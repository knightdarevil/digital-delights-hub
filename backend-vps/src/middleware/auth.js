const jwt = require('jsonwebtoken');

// Simple in-memory store for download tracking (use Redis/DB in production)
const downloadTracking = new Map();

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const checkDownloadLimit = (req, res, next) => {
  try {
    const user = req.user;
    
    // VIP users have unlimited downloads
    if (user.isVIP || user.role === 'admin') {
      return next();
    }

    const userId = user.uid;
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
      return res.status(403).json({ 
        error: 'Download limit reached',
        message: `You have used all ${weeklyLimit} downloads this week. Upgrade to VIP for unlimited downloads.`,
        remainingDownloads: 0,
        resetDate: getNextWeekStart(now)
      });
    }

    // Increment download count
    userTracking.downloads++;
    downloadTracking.set(userId, userTracking);

    // Add remaining downloads to response headers
    res.setHeader('X-Remaining-Downloads', weeklyLimit - userTracking.downloads);
    
    next();
  } catch (error) {
    console.error('Download limit check error:', error);
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
  return jwt.sign(
    {
      uid: user.uid,
      email: user.email,
      role: user.role || 'user',
      isVIP: user.isVIP || false
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  verifyToken,
  checkDownloadLimit,
  generateToken
};
