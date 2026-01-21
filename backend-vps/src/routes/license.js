const express = require('express');
const router = express.Router();

// NOTE: Make license routes resilient so the whole backend doesn't crash
// if Firebase Admin isn't installed/configured on a given environment.
let admin = null;
try {
  // eslint-disable-next-line global-require
  admin = require('firebase-admin');
} catch (e) {
  console.warn('⚠️ firebase-admin is not installed - license routes will not work');
}

function parseServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const rawB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!raw && !rawB64) return null;

  try {
    const jsonText = rawB64
      ? Buffer.from(rawB64, 'base64').toString('utf8')
      : raw;

    // People often paste with surrounding quotes in .env; strip a single pair.
    const trimmed = (jsonText || '').trim();
    const unquoted =
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ? trimmed.slice(1, -1)
        : trimmed;

    return JSON.parse(unquoted);
  } catch (e) {
    console.error(
      '❌ Invalid JSON in FIREBASE_SERVICE_ACCOUNT / FIREBASE_SERVICE_ACCOUNT_BASE64:',
      e.message
    );
    return null;
  }
}

// Initialize Firebase Admin if available
if (admin && !admin.apps.length) {
  const serviceAccount = parseServiceAccountFromEnv();

  if (serviceAccount?.project_id) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.warn('⚠️ Firebase Admin not configured - license routes will not work');
  }
}

const db = admin?.apps?.length ? admin.firestore() : null;

// Helper to get VIP expiration date based on key type
const getVIPExpiration = (keyType) => {
  const now = new Date();
  switch (keyType) {
    case 'vip_7':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'vip_30':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'vip_lifetime':
      return null; // Never expires
    default:
      return null;
  }
};

// Helper to calculate actual expiration based on activation date
const calculateActualExpiration = (keyType, activatedAt) => {
  if (keyType === 'vip_lifetime') return null;
  
  const activationDate = activatedAt instanceof Date ? activatedAt : activatedAt.toDate();
  const daysToAdd = keyType === 'vip_7' ? 7 : keyType === 'vip_30' ? 30 : 0;
  
  if (daysToAdd === 0) return null;
  
  return new Date(activationDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
};

// ============ PUBLIC ENDPOINTS ============

/**
 * POST /api/license/verify
 * Verify if a license key is valid (without activating it)
 * Body: { key: "XXXX-XXXX-XXXX-XXXX" }
 */
router.post('/verify', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: 'License service not configured' 
      });
    }

    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ 
        success: false, 
        error: 'License key is required' 
      });
    }

    const normalizedKey = key.toUpperCase().trim();
    
    // Find the key in Firestore
    const snapshot = await db.collection('licenseKeys')
      .where('key', '==', normalizedKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ 
        success: false, 
        valid: false,
        error: 'Invalid license key' 
      });
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();

    // Check if key is revoked
    if (keyData.status === 'revoked') {
      return res.json({ 
        success: true, 
        valid: false,
        status: 'revoked',
        error: 'Key has been revoked' 
      });
    }

    // Check if key has expired (before first activation)
    if (keyData.status === 'active' && keyData.expiresAt && keyData.expiresAt.toDate() < new Date()) {
      await keyDoc.ref.update({ status: 'expired' });
      return res.json({ 
        success: true, 
        valid: false,
        status: 'expired',
        error: 'Key has expired' 
      });
    }

    // Check device slots available
    const devices = keyData.devices || [];
    const maxDevices = keyData.maxDevices || 1;
    const availableSlots = maxDevices - devices.length;

    res.json({
      success: true,
      valid: true,
      keyType: keyData.keyType,
      status: keyData.status,
      maxDevices,
      currentDevices: devices.length,
      availableSlots
    });

  } catch (error) {
    console.error('❌ License verify error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/license/activate
 * Activate a license key for a device
 * Body: { 
 *   key: "XXXX-XXXX-XXXX-XXXX",
 *   deviceId: "unique-device-identifier",
 *   deviceName: "My Windows PC" (optional),
 *   softwareName: "MyApp Pro" (optional),
 *   platform: "windows" | "mac" | "android" | "ios" | "linux" (optional),
 *   email: "user@email.com" (optional)
 * }
 */
router.post('/activate', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: 'License service not configured' 
      });
    }

    const { key, deviceId, deviceName, softwareName, platform, email } = req.body;

    if (!key || !deviceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'License key and device ID are required' 
      });
    }

    const normalizedKey = key.toUpperCase().trim();
    
    // Find the key in Firestore
    const snapshot = await db.collection('licenseKeys')
      .where('key', '==', normalizedKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ 
        success: false, 
        error: 'Invalid license key' 
      });
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();

    // Check if key is revoked
    if (keyData.status === 'revoked') {
      return res.json({ 
        success: false, 
        error: 'Key has been revoked' 
      });
    }

    // Check if key has expired (before activation)
    if (keyData.status === 'active' && keyData.expiresAt && keyData.expiresAt.toDate() < new Date()) {
      await keyDoc.ref.update({ status: 'expired' });
      return res.json({ 
        success: false, 
        error: 'Key has expired before activation' 
      });
    }

    // Get current devices
    const devices = keyData.devices || [];
    const maxDevices = keyData.maxDevices || 1;
    const now = new Date();

    // Check if device already exists
    const existingDeviceIndex = devices.findIndex(d => d.deviceId === deviceId);

    if (existingDeviceIndex !== -1) {
      // Device already registered, update lastSeenAt and softwareName
      devices[existingDeviceIndex] = {
        ...devices[existingDeviceIndex],
        deviceName: deviceName || devices[existingDeviceIndex].deviceName,
        softwareName: softwareName || devices[existingDeviceIndex].softwareName,
        platform: platform || devices[existingDeviceIndex].platform,
        lastSeenAt: now
      };

      await keyDoc.ref.update({ devices });

      // Calculate VIP expiration
      const firstActivation = keyData.usedAt?.toDate() || now;
      const vipExpiresAt = calculateActualExpiration(keyData.keyType, firstActivation);

      return res.json({
        success: true,
        message: 'Device already registered, updated last seen',
        keyType: keyData.keyType,
        vipExpiresAt: vipExpiresAt ? vipExpiresAt.toISOString() : null,
        isLifetime: keyData.keyType === 'vip_lifetime',
        currentDevices: devices.length,
        maxDevices
      });
    }

    // Check if max devices reached
    if (devices.length >= maxDevices) {
      return res.json({ 
        success: false, 
        error: `Maximum devices limit reached (${maxDevices}). Please deactivate another device first.`,
        currentDevices: devices.length,
        maxDevices
      });
    }

    // Add new device
    const newDevice = {
      deviceId,
      deviceName: deviceName || 'Unknown Device',
      softwareName: softwareName || 'Unknown Software',
      platform: platform || 'unknown',
      activatedAt: now,
      lastSeenAt: now
    };

    devices.push(newDevice);

    // Determine if this is first activation
    const isFirstActivation = !keyData.usedAt;
    
    // Update the key
    const updateData = {
      status: 'used',
      devices,
      usedByEmail: email || keyData.usedByEmail || null
    };

    // Only set usedAt on first activation
    if (isFirstActivation) {
      updateData.usedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await keyDoc.ref.update(updateData);

    // Calculate VIP expiration
    const activationDate = isFirstActivation ? now : keyData.usedAt.toDate();
    const vipExpiresAt = calculateActualExpiration(keyData.keyType, activationDate);

    console.log(`✅ License key activated: ${normalizedKey} for device: ${deviceId} (${deviceName || 'Unknown'})`);

    res.json({
      success: true,
      message: 'License activated successfully',
      keyType: keyData.keyType,
      vipExpiresAt: vipExpiresAt ? vipExpiresAt.toISOString() : null,
      isLifetime: keyData.keyType === 'vip_lifetime',
      currentDevices: devices.length,
      maxDevices,
      device: newDevice
    });

  } catch (error) {
    console.error('❌ License activate error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/license/check
 * Check the status of an activated license for a device
 * Body: { 
 *   deviceId: "unique-device-identifier",
 *   key: "XXXX-XXXX-XXXX-XXXX" (optional - if provided, updates lastSeenAt)
 * }
 */
router.post('/check', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: 'License service not configured' 
      });
    }

    const { deviceId, key } = req.body;

    if (!deviceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID is required' 
      });
    }

    let snapshot;
    
    // If key is provided, search by key; otherwise search by deviceId in devices array
    if (key) {
      const normalizedKey = key.toUpperCase().trim();
      snapshot = await db.collection('licenseKeys')
        .where('key', '==', normalizedKey)
        .where('status', '==', 'used')
        .limit(1)
        .get();
    } else {
      // Search all used keys and filter by deviceId
      snapshot = await db.collection('licenseKeys')
        .where('status', '==', 'used')
        .get();
    }

    if (snapshot.empty) {
      return res.json({ 
        success: true, 
        licensed: false,
        message: 'No active license found' 
      });
    }

    // Find the key that contains this device
    let foundKeyDoc = null;
    let foundKeyData = null;
    let foundDeviceIndex = -1;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const devices = data.devices || [];
      const deviceIndex = devices.findIndex(d => d.deviceId === deviceId);
      
      if (deviceIndex !== -1) {
        foundKeyDoc = doc;
        foundKeyData = data;
        foundDeviceIndex = deviceIndex;
        break;
      }
    }

    if (!foundKeyDoc || !foundKeyData) {
      return res.json({ 
        success: true, 
        licensed: false,
        message: 'No active license found for this device' 
      });
    }

    // Update lastSeenAt for this device
    const devices = foundKeyData.devices || [];
    const now = new Date();
    
    if (foundDeviceIndex !== -1) {
      devices[foundDeviceIndex].lastSeenAt = now;
      await foundKeyDoc.ref.update({ devices });
    }

    // Calculate if VIP is still valid
    let isExpired = false;
    let vipExpiresAt = null;

    if (foundKeyData.keyType !== 'vip_lifetime' && foundKeyData.usedAt) {
      vipExpiresAt = calculateActualExpiration(foundKeyData.keyType, foundKeyData.usedAt);
      if (vipExpiresAt) {
        isExpired = vipExpiresAt < now;
      }
    }

    // Check if key is revoked
    if (foundKeyData.status === 'revoked') {
      return res.json({
        success: true,
        licensed: false,
        message: 'License has been revoked'
      });
    }

    res.json({
      success: true,
      licensed: true,
      keyType: foundKeyData.keyType,
      isExpired,
      isLifetime: foundKeyData.keyType === 'vip_lifetime',
      vipExpiresAt: vipExpiresAt ? vipExpiresAt.toISOString() : null,
      activatedAt: foundKeyData.usedAt?.toDate()?.toISOString() || null,
      currentDevices: devices.length,
      maxDevices: foundKeyData.maxDevices || 1,
      device: devices[foundDeviceIndex]
    });

  } catch (error) {
    console.error('❌ License check error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/license/deactivate
 * Deactivate a license for a specific device (remove device from list)
 * Body: { 
 *   key: "XXXX-XXXX-XXXX-XXXX",
 *   deviceId: "unique-device-identifier"
 * }
 */
router.post('/deactivate', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: 'License service not configured' 
      });
    }

    const { key, deviceId } = req.body;

    if (!key || !deviceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'License key and device ID are required' 
      });
    }

    const normalizedKey = key.toUpperCase().trim();
    
    // Find the key
    const snapshot = await db.collection('licenseKeys')
      .where('key', '==', normalizedKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ 
        success: false, 
        error: 'Invalid license key' 
      });
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();
    const devices = keyData.devices || [];

    // Find and remove the device
    const deviceIndex = devices.findIndex(d => d.deviceId === deviceId);
    
    if (deviceIndex === -1) {
      return res.json({ 
        success: false, 
        error: 'Device not found for this license' 
      });
    }

    // Remove the device
    devices.splice(deviceIndex, 1);

    // Update the key - if no devices left, set status back to active
    const updateData = { devices };
    
    if (devices.length === 0) {
      updateData.status = 'active';
      // Keep usedAt and usedByEmail for history
    }

    await keyDoc.ref.update(updateData);

    console.log(`🔄 Device deactivated from license: ${normalizedKey}, device: ${deviceId}`);

    res.json({
      success: true,
      message: 'Device deactivated successfully',
      remainingDevices: devices.length,
      maxDevices: keyData.maxDevices || 1,
      keyStatus: devices.length === 0 ? 'active' : 'used'
    });

  } catch (error) {
    console.error('❌ License deactivate error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/license/devices
 * Get all devices for a specific license key
 * Body: { 
 *   key: "XXXX-XXXX-XXXX-XXXX"
 * }
 */
router.post('/devices', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: 'License service not configured' 
      });
    }

    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ 
        success: false, 
        error: 'License key is required' 
      });
    }

    const normalizedKey = key.toUpperCase().trim();
    
    const snapshot = await db.collection('licenseKeys')
      .where('key', '==', normalizedKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ 
        success: false, 
        error: 'Invalid license key' 
      });
    }

    const keyData = snapshot.docs[0].data();
    const devices = keyData.devices || [];

    res.json({
      success: true,
      devices,
      currentDevices: devices.length,
      maxDevices: keyData.maxDevices || 1,
      availableSlots: (keyData.maxDevices || 1) - devices.length
    });

  } catch (error) {
    console.error('❌ License devices error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
