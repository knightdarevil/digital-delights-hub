const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  // You need to set FIREBASE_SERVICE_ACCOUNT env variable with the service account JSON
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  
  if (serviceAccount.project_id) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.warn('⚠️ Firebase Admin not configured - license routes will not work');
  }
}

const db = admin.apps.length ? admin.firestore() : null;

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

    // Check if key is active
    if (keyData.status !== 'active') {
      return res.json({ 
        success: true, 
        valid: false,
        status: keyData.status,
        error: `Key is ${keyData.status}` 
      });
    }

    // Check if key has expired (before activation)
    if (keyData.expiresAt && keyData.expiresAt.toDate() < new Date()) {
      // Update key status to expired
      await keyDoc.ref.update({ status: 'expired' });
      return res.json({ 
        success: true, 
        valid: false,
        status: 'expired',
        error: 'Key has expired' 
      });
    }

    res.json({
      success: true,
      valid: true,
      keyType: keyData.keyType,
      status: keyData.status
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
 * Activate a license key for a device/user
 * Body: { 
 *   key: "XXXX-XXXX-XXXX-XXXX",
 *   deviceId: "unique-device-identifier",
 *   deviceName: "Windows PC" (optional),
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

    const { key, deviceId, deviceName, email } = req.body;

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

    // Check if key is active
    if (keyData.status !== 'active') {
      return res.json({ 
        success: false, 
        error: `Key is already ${keyData.status}` 
      });
    }

    // Check if key has expired (before activation)
    if (keyData.expiresAt && keyData.expiresAt.toDate() < new Date()) {
      await keyDoc.ref.update({ status: 'expired' });
      return res.json({ 
        success: false, 
        error: 'Key has expired' 
      });
    }

    // Calculate VIP expiration
    const vipExpiresAt = getVIPExpiration(keyData.keyType);

    // Activate the key
    await keyDoc.ref.update({
      status: 'used',
      usedBy: deviceId,
      usedByEmail: email || null,
      usedByDevice: deviceName || null,
      usedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ License key activated: ${normalizedKey} for device: ${deviceId}`);

    res.json({
      success: true,
      message: 'License activated successfully',
      keyType: keyData.keyType,
      vipExpiresAt: vipExpiresAt ? vipExpiresAt.toISOString() : null,
      isLifetime: keyData.keyType === 'vip_lifetime'
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
 *   deviceId: "unique-device-identifier"
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

    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID is required' 
      });
    }

    // Find any key used by this device
    const snapshot = await db.collection('licenseKeys')
      .where('usedBy', '==', deviceId)
      .where('status', '==', 'used')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ 
        success: true, 
        licensed: false,
        message: 'No active license found for this device' 
      });
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();

    // Calculate if VIP is still valid
    const vipExpiresAt = keyData.usedAt ? getVIPExpiration(keyData.keyType) : null;
    let isExpired = false;

    if (keyData.keyType !== 'vip_lifetime' && keyData.usedAt) {
      const usedDate = keyData.usedAt.toDate();
      const expireDate = getVIPExpiration(keyData.keyType);
      if (expireDate) {
        const actualExpireDate = new Date(usedDate.getTime() + (expireDate.getTime() - new Date().getTime()));
        isExpired = actualExpireDate < new Date();
      }
    }

    res.json({
      success: true,
      licensed: true,
      keyType: keyData.keyType,
      isExpired,
      isLifetime: keyData.keyType === 'vip_lifetime',
      activatedAt: keyData.usedAt?.toDate()?.toISOString() || null
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
 * Deactivate a license (for device reset/transfer)
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
      .where('usedBy', '==', deviceId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ 
        success: false, 
        error: 'No matching license found for this device' 
      });
    }

    const keyDoc = snapshot.docs[0];

    // Reactivate the key (allow reuse)
    await keyDoc.ref.update({
      status: 'active',
      usedBy: null,
      usedByEmail: null,
      usedByDevice: null,
      usedAt: null
    });

    console.log(`🔄 License key deactivated: ${normalizedKey}`);

    res.json({
      success: true,
      message: 'License deactivated successfully'
    });

  } catch (error) {
    console.error('❌ License deactivate error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;