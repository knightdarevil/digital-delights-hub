const jwt = require('jsonwebtoken');

// Simple in-memory store for download tracking (use Redis/DB in production)
const downloadTracking = new Map();

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token in the Authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured!');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid.'
      });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const checkDownloadLimit = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // VIP users and admins have unlimited downloads
    if (user.isVIP || user.role === 'admin') {
      console.log(`✅ Unlimited downloads for ${user.role || 'VIP'} user: ${user.email}`);
      return next();
    }

    const userId = user.uid || user.id || user.email;
    const now = new Date();
    const weekStart = getWeekStart(now);

    // Get or create tracking for this user
    let userTracking = downloadTracking.get(userId);
    
    if (!userTracking || userTracking.weekStart < weekStart) {
      // Reset for new week
      userTracking = {
        weekStart,
        downloads: 0
      };
    }

    const weeklyLimit = parseInt(process.env.WEEKLY_DOWNLOAD_LIMIT) || 3;

    if (userTracking.downloads >= weeklyLimit) {
      console.log(`❌ Download limit reached for user: ${user.email}`);
      return res.status(403).json({ 
        error: 'Download limit reached',
        message: `You have used all ${weeklyLimit} downloads this week. Upgrade to VIP for unlimited downloads.`,
        remainingDownloads: 0,
        resetDate: getNextWeekStart(now),
        limit: weeklyLimit
      });
    }

    // Increment download count
    userTracking.downloads++;
    downloadTracking.set(userId, userTracking);

    const remaining = weeklyLimit - userTracking.downloads;
    console.log(`📊 Download ${userTracking.downloads}/${weeklyLimit} for user: ${user.email}`);
    
    // Add remaining downloads to response headers
    res.setHeader('X-Remaining-Downloads', remaining);
    res.setHeader('X-Weekly-Limit', weeklyLimit);
    
    next();
  } catch (error) {
    console.error('Download limit check error:', error);
    // Don't block download on error, just log it
    next();
  }
};

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

function getNextWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 7);
  return d.toISOString();
}

// Generate token for users (call this from your auth endpoint)
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign(
    {
      uid: user.uid || user.id,
      email: user.email,
      role: user.role || 'user',
      isVIP: user.isVIP || false
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Utility to clear expired tracking entries (call periodically)
const cleanupTracking = () => {
  const now = new Date();
  const weekStart = getWeekStart(now);
  
  for (const [userId, tracking] of downloadTracking.entries()) {
    if (tracking.weekStart < weekStart) {
      downloadTracking.delete(userId);
    }
  }
};

// Clean up every hour
setInterval(cleanupTracking, 60 * 60 * 1000);

module.exports = {
  verifyToken,
  checkDownloadLimit,
  generateToken,
  cleanupTracking
};
