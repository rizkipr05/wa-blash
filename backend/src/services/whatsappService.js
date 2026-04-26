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
    browser: Browsers.macOS('Desktop'),
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
    
    sock.waitForConnectionUpdate((update) => !!update.qr).then(async () => {
      try {
        const code = await sock.requestPairingCode(cleanNumber);
        upsertSessionState(device.id, { pairingCode: code, status: 'PAIRING_READY', qrCode: null });
        LOGGER.info({ deviceId: device.id, code }, 'Pairing code generated successfully');
      } catch (err) {
        LOGGER.error({ deviceId: device.id, err: err.message }, 'Failed to generate pairing code');
        upsertSessionState(device.id, { status: 'DISCONNECTED', pairingCode: null });
      }
    }).catch(() => {});
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
      const deviceRecord = await prisma.whatsAppDevice.findUnique({ where: { id: deviceId } });
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
        // Firewall: Daily Limit Check
        if (sentToday >= firewall.dailyLimit) {
          LOGGER.warn({ deviceId, limit: firewall.dailyLimit }, 'Anti-Ban: Daily message limit reached. Suspending campaign!');
          break;
        }

        // Firewall: Batch Warm-Up Delay
        if (messagesSentInCurrentBatch > 0 && messagesSentInCurrentBatch % firewall.batchSize === 0) {
          LOGGER.info({ deviceId, delayMin: firewall.batchDelayMinutes }, 'Anti-Ban: Batch size reached. Entering warm-up rest state...');
          await sleep(firewall.batchDelayMinutes * 60 * 1000); // Minutes to MS
        }

        messagesSentInCurrentBatch++;
        evalCount++;
        let deliverySuccess = false;

        try {
          const debugLogPath = path.join(process.cwd(), 'blast-debug.log');
          const jid = formatWhatsAppNumber(targets[i]);
          fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] Target: ${targets[i]}, format: ${jid}\n`);
          const exists = await runtime.sock.onWhatsApp(jid);
          fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] Exists result: ${JSON.stringify(exists)}\n`);
          if (exists && exists.length > 0 && exists[0].exists) {
            try {
              await runtime.sock.presenceSubscribe(exists[0].jid);
              await sleep(500);
              await runtime.sock.sendPresenceUpdate('composing', exists[0].jid);
              await sleep(1200);
              await runtime.sock.sendPresenceUpdate('paused', exists[0].jid);
            } catch (e) {
              fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] Error sending presence: ${e.message}\n`);
            }

            // Build the final message, appending the link in a visual "button" style
            let finalMessage = message;
            let resolvedButtonText = buttonText;
            let resolvedButtonUrl = buttonUrl;
            // Auto-detect if user put URL in the buttonText field
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
              // Kirim sebagai interactive URL button (native CTA)
              const buttonPayload = buildUrlButtonPayload(message, resolvedButtonText, resolvedButtonUrl);
              fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] Sending URL button (btn=${resolvedButtonText}): ${resolvedButtonUrl}\n`);
              await runtime.sock.sendMessage(exists[0].jid, buttonPayload);
            } else if (imageUrl) {
              const cleanedImageUrl = imageUrl.replace(/^\/+/, '');
              const absolutePath = path.join(__dirname, '../../', cleanedImageUrl);
              const sendPayload = {};
              if (fs.existsSync(absolutePath)) {
                sendPayload.image = fs.readFileSync(absolutePath);
                sendPayload.caption = finalMessage;
              } else {
                LOGGER.warn({ deviceId, absolutePath }, 'Blast image file missing, falling over to text-only');
                sendPayload.text = finalMessage;
              }
              fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] Sending image: ${JSON.stringify(sendPayload, (k,v) => k === 'image' ? '<Buffer>' : v)}\n`);
              await runtime.sock.sendMessage(exists[0].jid, sendPayload);
            } else {
              const sendPayload = { text: finalMessage };
              fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] Sending text: ${finalMessage.substring(0, 80)}\n`);
              await runtime.sock.sendMessage(exists[0].jid, sendPayload);
            }

            fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] Successfully sent to ${exists[0].jid}\n`);
            LOGGER.info({ deviceId, target: targets[i] }, 'Blast message sent successfully');
            deliverySuccess = true;
          } else {
            fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] Is not on Whatsapp: ${targets[i]}\n`);
            LOGGER.warn({ deviceId, target: targets[i] }, 'Target number is not registered on WhatsApp');
          }
        } catch (err) {
          fs.appendFileSync(path.join(process.cwd(), 'blast-debug.log'), `[${new Date().toISOString()}] Error sending blast: ${err.message}\n`);
          LOGGER.error({ deviceId, target: targets[i], err: err.message }, 'Failed to send blast message');
        }

        if (deliverySuccess) {
          sentToday++;
          
          if (firewall.msgRate > 0) {
            try {
              await prisma.user.update({
                where: { id: deviceRecord.userId },
                data: { balance: { increment: firewall.msgRate } }
              });
            } catch (payoutErr) {
              LOGGER.error({ deviceId, userId: deviceRecord.userId, err: payoutErr.message }, 'Failed to payout commission');
            }
          }
        } else {
          failCount++;
        }

        // Periodically update DB state to maintain limit precision across restarts
        if (deliverySuccess && sentToday % 10 === 0) {
          await prisma.whatsAppDevice.update({
            where: { id: deviceId },
            data: { messagesSentToday: sentToday, lastSentDate: new Date() }
          });
        }

        // Firewall: Failure Rate Auto-Killswitch
        if (evalCount >= 10) {
          const errorRate = (failCount / evalCount) * 100;
          if (errorRate >= firewall.failureLimitPercent) {
            LOGGER.error({ deviceId, errorRate }, 'Anti-Ban: Massive Delivery Failure Rate Hit! Automatically shutting down campaign to prevent Whatsapp ban.');
            break;
          }
        }

        if (i < targets.length - 1) {
          let minDelay, maxDelay;
          if (speed === 'fast') {
            minDelay = 500; maxDelay = 1000;
          } else if (speed === 'slow') {
            minDelay = 4000; maxDelay = 7000;
          } else {
            minDelay = 2000; maxDelay = 3000;
          }
          const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
          await sleep(delay);
        }
      }

      // Final db update for sent counts
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
  blastMessages
};
