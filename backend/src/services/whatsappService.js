const fs = require('fs');
const path = require('path');
const pino = require('pino');
const QRCode = require('qrcode');
const { PrismaClient } = require('@prisma/client');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const prisma = new PrismaClient();

const SESSION_ROOT = process.env.WA_SESSION_DIR
  ? path.resolve(process.env.WA_SESSION_DIR)
  : path.join(process.cwd(), '.wa-sessions');
const LOGGER = pino({ level: process.env.WA_LOG_LEVEL || 'info' });
const sessions = new Map();

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

const connectDevice = async (device) => {
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

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: LOGGER,
    browser: ['TerimaWa', 'Desktop', '1.0.0']
  });

  upsertSessionState(device.id, {
    deviceId: device.id,
    userId: device.userId,
    sock,
    status: 'CONNECTING',
    qrCode: null,
    phoneNumber: null
  });

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
    phoneNumber: null
  };
};

const getDeviceStatus = async (deviceId) => {
  const runtime = getSessionState(deviceId);
  if (runtime) {
    return {
      status: runtime.status || 'DISCONNECTED',
      qrCode: runtime.qrCode || null,
      phoneNumber: runtime.phoneNumber || null
    };
  }

  const device = await prisma.whatsAppDevice.findUnique({ where: { id: deviceId } });
  if (!device) return null;

  return {
    status: device.status,
    qrCode: null,
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

module.exports = {
  connectDevice,
  getDeviceStatus,
  disconnectDevice,
  destroyDeviceSession,
  bootstrapConnectedDevices
};
