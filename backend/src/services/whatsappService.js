const fs = require('fs');
const path = require('path');
const pino = require('pino');
const QRCode = require('qrcode');
const { PrismaClient } = require('@prisma/client');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

const prisma = new PrismaClient();

const SESSION_ROOT = process.env.WA_SESSION_DIR
  ? path.resolve(process.env.WA_SESSION_DIR)
  : path.join(process.cwd(), '.wa-sessions');
const LOGGER = pino({ level: process.env.WA_LOG_LEVEL || 'info' });
const sessions = new Map();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const normalizePairingPhoneNumber = (raw) => {
  let cleaned = String(raw || '').replace(/\D/g, '');
  if (!cleaned) return null;

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  if (!/^\d{10,15}$/.test(cleaned)) {
    throw new Error('Invalid phone number format for pairing');
  }

  return cleaned;
};

const formatWhatsAppNumber = (number) => {
  let cleaned = String(number).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned + '@s.whatsapp.net';
};

const ensureSessionRoot = async () => {
  await fs.promises.mkdir(SESSION_ROOT, { recursive: true, mode: 0o700 });
  await fs.promises.chmod(SESSION_ROOT, 0o700);
};

const sessionKey = (userId, deviceId) => `user-${userId}-device-${deviceId}`;

const getSessionDir = (userId, deviceId) => path.join(SESSION_ROOT, sessionKey(userId, deviceId));

const updateProfileAfterConnect = async (deviceId, sock) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const botName = settingsObj['global_wa_name'];
    const botAbout = settingsObj['global_wa_about'];
    const botPP = settingsObj['global_wa_pp'];

    if (botName) {
      console.log(`[Baileys] Auto-updating profile name for ${deviceId} to: ${botName}`);
      await sock.updateProfileName(botName);
    }
    if (botAbout) {
      console.log(`[Baileys] Auto-updating profile bio for ${deviceId} to: ${botAbout}`);
      await sock.updateProfileStatus(botAbout);
    }
    if (botPP) {
      const cleanedPPUrl = botPP.replace(/^\/+/, '');
      const absolutePath = path.join(__dirname, '../../', cleanedPPUrl);
      if (fs.existsSync(absolutePath)) {
        console.log(`[Baileys] Auto-updating profile picture for ${deviceId}`);
        await sock.updateProfilePicture(sock.user.id, { url: absolutePath });
      }
    }
  } catch (error) {
    console.error(`Error in updateProfileAfterConnect for ${deviceId}:`, error.message);
  }
};

const getSessionState = (deviceId) => sessions.get(deviceId);
const upsertSessionState = (deviceId, data) => {
  const current = sessions.get(deviceId) || {};
  const next = { ...current, ...data };
  sessions.set(deviceId, next);
  return next;
};

const updateDeviceRecord = async (deviceId, data) => {
  await prisma.whatsAppDevice.update({
    where: { id: deviceId },
    data
  });
};

const normalizePhoneNumber = (jid) => {
  if (!jid) return null;
  return jid.split('@')[0] || null;
};

const connectDevice = async (device, options = {}) => {
  LOGGER.info({ deviceId: device.id, userId: device.userId }, 'Starting WhatsApp connect flow');
  await ensureSessionRoot();

  const existing = getSessionState(device.id);
  if (existing?.sock) {
    return {
      status: existing.status || 'CONNECTING',
      qrCode: existing.qrCode || null,
      phoneNumber: existing.phoneNumber || null
    };
  }

  const authDir = getSessionDir(device.userId, device.id);
  await fs.promises.mkdir(authDir, { recursive: true, mode: 0o700 });
  await fs.promises.chmod(authDir, 0o700);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  LOGGER.info({ version, isLatest }, 'Using WA v' + version.join('.'));

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: LOGGER,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    syncFullHistory: false
  });

  upsertSessionState(device.id, {
    deviceId: device.id,
    userId: device.userId,
    sock,
    status: 'CONNECTING',
    qrCode: null,
    pairingCode: null,
    phoneNumber: null
  });

  if (options.method === 'pairing' && options.phoneNumber && !state.creds.me) {
    const cleanNumber = normalizePairingPhoneNumber(options.phoneNumber);
    
    // Give the socket a second to initialize before requesting the code
    setTimeout(async () => {
      try {
        LOGGER.info({ deviceId: device.id, cleanNumber }, 'Requesting WhatsApp pairing code...');
        const code = await sock.requestPairingCode(cleanNumber);
        upsertSessionState(device.id, { pairingCode: code, status: 'PAIRING_READY', qrCode: null });
        LOGGER.info({ deviceId: device.id, code }, 'Pairing code generated successfully');
      } catch (err) {
        LOGGER.error({ deviceId: device.id, err: err.message }, 'Failed to generate pairing code');
        upsertSessionState(device.id, { status: 'DISCONNECTED', pairingCode: null });
      }
    }, 3000);
  }

  await updateDeviceRecord(device.id, {
    status: 'DISCONNECTED',
    phoneNumber: null,
    sessionData: JSON.stringify({
      sessionKey: sessionKey(device.userId, device.id)
    })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    try {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrCode = await QRCode.toDataURL(qr);
        upsertSessionState(device.id, { status: 'QR_READY', qrCode });
        LOGGER.info({ deviceId: device.id }, 'WhatsApp QR generated and ready');
      }

      if (connection === 'open') {
        const phoneNumber = normalizePhoneNumber(sock.user?.id);
        upsertSessionState(device.id, {
          status: 'CONNECTED',
          qrCode: null,
          phoneNumber
        });

        await updateDeviceRecord(device.id, {
          status: 'CONNECTED',
          phoneNumber
        });
        LOGGER.info({ deviceId: device.id, phoneNumber }, 'WhatsApp device connected');

        // Auto Profile Update (Wait a few seconds for initialization to settle)
        setTimeout(async () => {
          try {
            await updateProfileAfterConnect(device.id, sock);
          } catch (pErr) {
            console.error(`[Baileys] Failed to auto-update profile for ${device.id}:`, pErr.message);
          }
        }, 5000);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        upsertSessionState(device.id, {
          status: 'DISCONNECTED',
          qrCode: null,
          phoneNumber: null,
          sock: null
        });

        await updateDeviceRecord(device.id, {
          status: 'DISCONNECTED',
          phoneNumber: null
        });
        LOGGER.warn({ deviceId: device.id, isLoggedOut }, 'WhatsApp device disconnected');

        if (!isLoggedOut) {
          sessions.delete(device.id);
          LOGGER.info({ deviceId: device.id }, 'Attempting automatic reconnect');
          await connectDevice(device);
          return;
        }

        sessions.delete(device.id);
      }
    } catch (error) {
      sessions.delete(device.id);
      LOGGER.error({ deviceId: device.id, error: error.message }, 'Failed handling WhatsApp connection update');
    }
  });

  return {
    status: 'CONNECTING',
    qrCode: null,
    pairingCode: null,
    phoneNumber: null
  };
};

const getDeviceStatus = async (deviceId) => {
  const runtime = getSessionState(deviceId);
  if (runtime) {
    return {
      status: runtime.status || 'DISCONNECTED',
      qrCode: runtime.qrCode || null,
      pairingCode: runtime.pairingCode || null,
      phoneNumber: runtime.phoneNumber || null
    };
  }

  const device = await prisma.whatsAppDevice.findUnique({ where: { id: deviceId } });
  if (!device) return null;

  return {
    status: device.status,
    qrCode: null,
    pairingCode: null,
    phoneNumber: device.phoneNumber
  };
};

const disconnectDevice = async (device) => {
  LOGGER.info({ deviceId: device.id, userId: device.userId }, 'Manual WhatsApp disconnect requested');
  const runtime = getSessionState(device.id);

  if (runtime?.sock) {
    try {
      await runtime.sock.logout();
    } catch (error) {
      // Best-effort logout.
    }
    try {
      runtime.sock.end(new Error('Manual disconnect'));
    } catch (error) {
      // Socket may already be closed.
    }
  }

  sessions.delete(device.id);
  await updateDeviceRecord(device.id, {
    status: 'DISCONNECTED',
    phoneNumber: null
  });
};

const destroyDeviceSession = async (userId, deviceId) => {
  sessions.delete(deviceId);
  const authDir = getSessionDir(userId, deviceId);
  await fs.promises.rm(authDir, { recursive: true, force: true });
  LOGGER.info({ deviceId, userId, authDir }, 'WhatsApp session credentials deleted');
};

const bootstrapConnectedDevices = async () => {
  await ensureSessionRoot();

  const devices = await prisma.whatsAppDevice.findMany({
    where: {
      status: 'CONNECTED'
    }
  });

  for (const device of devices) {
    try {
      LOGGER.info({ deviceId: device.id, userId: device.userId }, 'Bootstrapping connected WhatsApp device');
      await connectDevice(device);
    } catch (error) {
      await updateDeviceRecord(device.id, {
        status: 'DISCONNECTED',
        phoneNumber: null
      });
      LOGGER.error({ deviceId: device.id, error: error.message }, 'Failed bootstrapping WhatsApp device');
    }
  }
};

const buildUrlButtonPayload = (teksPesan, teksTombol, urlTujuan) => ({
  viewOnceMessage: {
    message: {
      interactiveMessage: {
        header: { title: '' },
        body: { text: teksPesan },
        nativeFlowMessage: {
          buttons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: teksTombol,
                url: urlTujuan,
                merchant_url: urlTujuan
              })
            }
          ]
        }
      }
    }
  }
});

const blastMessages = async (deviceId, targets, message, speed, imageUrl = null, firewall, buttonText = null, buttonUrl = null) => {
  const runtime = getSessionState(deviceId);
  if (!runtime || !runtime.sock) {
    throw new Error('Device is not connected');
  }
  
  if (!targets || !Array.isArray(targets) || targets.length === 0) return;

  setImmediate(async () => {
    try {
      const deviceRecord = await prisma.whatsAppDevice.findUnique({ 
        where: { id: deviceId },
        include: { user: { include: { referrer: true } } }
      });
      const userRecord = deviceRecord.user;
      const referrer = userRecord.referrer;

      let sentToday = deviceRecord.messagesSentToday || 0;
      const lastSent = deviceRecord.lastSentDate;
      const todayString = new Date().toDateString();
      
      if (lastSent && new Date(lastSent).toDateString() !== todayString) {
        sentToday = 0; // reset
      }

      let messagesSentInCurrentBatch = 0;
      let failCount = 0;
      let evalCount = 0;

      for (let i = 0; i < targets.length; i++) {
        // Ultra Blast: Firewall Bypass (Daily Limit, Batch delays, and Failure Killswitch removed as requested)
        evalCount++;
        let deliverySuccess = false;
        let errorMessage = null;

        try {
          const jid = formatWhatsAppNumber(targets[i]);
          
          // Ultra Blast: Skipping existence check for speed
          const targetJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;
          
          try {
            // Minimal presence to trick basic filters
            await runtime.sock.sendPresenceUpdate('composing', targetJid);
            await sleep(200);
            await runtime.sock.sendPresenceUpdate('paused', targetJid);
          } catch (e) {
            // Presence error is non-critical
          }

          // Build the final message
          let finalMessage = message;
          let resolvedButtonText = buttonText;
          let resolvedButtonUrl = buttonUrl;
          if (buttonText && buttonText.startsWith('http') && !buttonUrl) {
            resolvedButtonUrl = buttonText;
            resolvedButtonText = 'Buka Link';
          }
          if (resolvedButtonText && resolvedButtonUrl) {
            finalMessage = `${message}\n\n〰️〰️〰️〰️〰️〰️〰️〰️\n🔗 *${resolvedButtonText}*\n${resolvedButtonUrl}\n〰️〰️〰️〰️〰️〰️〰️〰️`;
          } else if (resolvedButtonUrl) {
            finalMessage = `${message}\n\n🔗 ${resolvedButtonUrl}`;
          }

          if (resolvedButtonText && resolvedButtonUrl) {
            const buttonPayload = buildUrlButtonPayload(message, resolvedButtonText, resolvedButtonUrl);
            await runtime.sock.sendMessage(targetJid, buttonPayload);
          } else if (imageUrl) {
            const cleanedImageUrl = imageUrl.replace(/^\/+/, '');
            const absolutePath = path.join(__dirname, '../../', cleanedImageUrl);
            if (fs.existsSync(absolutePath)) {
              await runtime.sock.sendMessage(targetJid, { 
                image: { url: absolutePath }, 
                caption: finalMessage 
              });
            } else {
              await runtime.sock.sendMessage(targetJid, { text: finalMessage });
            }
          } else {
            await runtime.sock.sendMessage(targetJid, { text: finalMessage });
          }

          LOGGER.info({ deviceId, target: targets[i] }, 'Blast message sent successfully');
          deliverySuccess = true;
        } catch (err) {
          errorMessage = err.message;
          LOGGER.error({ deviceId, target: targets[i], err: err.message }, 'Failed to send blast message');
        }

        // Save Blast Log
        try {
          await prisma.blastLog.create({
            data: {
              userId: deviceRecord.userId,
              deviceId: deviceId,
              target: targets[i],
              message: message,
              status: deliverySuccess ? 'SUCCESS' : 'FAILED',
              error: errorMessage
            }
          });
        } catch (logErr) {
          LOGGER.error({ err: logErr.message }, 'Failed to save blast log to DB');
        }

        if (deliverySuccess) {
          sentToday++;
          if (firewall.msgRate > 0) {
            try {
              await prisma.user.update({
                where: { id: userRecord.id },
                data: { balance: { increment: firewall.msgRate } }
              });
            } catch (payoutErr) {
              LOGGER.error({ deviceId, userId: userRecord.id, err: payoutErr.message }, 'Failed to payout commission');
            }
          }

          // Referral Payout
          if (referrer && firewall.referralCommission > 0) {
            try {
              await prisma.user.update({
                where: { id: referrer.id },
                data: { balance: { increment: firewall.referralCommission } }
              });
            } catch (refPayoutErr) {
              LOGGER.error({ deviceId, referrerId: referrer.id, err: refPayoutErr.message }, 'Failed to payout referral commission');
            }
          }
        } else {
          failCount++;
        }

        // Periodically update DB state
        if (deliverySuccess && sentToday % 10 === 0) {
           await prisma.whatsAppDevice.update({
             where: { id: deviceId },
             data: { messagesSentToday: sentToday, lastSentDate: new Date() }
           });
        }

        if (i < targets.length - 1) {
          let minDelay, maxDelay;
          if (speed === 'fast') {
            minDelay = 300; maxDelay = 600; // Ultra Fast
          } else if (speed === 'slow') {
            minDelay = 4000; maxDelay = 7000;
          } else {
            minDelay = 1500; maxDelay = 2500;
          }
          const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
          await sleep(delay);
        }
      }

      await prisma.whatsAppDevice.update({
        where: { id: deviceId },
        data: { messagesSentToday: sentToday, lastSentDate: new Date() }
      });

      LOGGER.info({ deviceId, totalSent: sentToday }, 'Blast campaign sequence finished.');
    } catch (criticalError) {
      LOGGER.error({ deviceId, error: criticalError.message }, 'Critical error executing blast sequence');
    }
  });
};

module.exports = {
  connectDevice,
  getDeviceStatus,
  disconnectDevice,
  destroyDeviceSession,
  bootstrapConnectedDevices,
  blastMessages,
  updateProfileAfterConnect
};
