const express = require('express');
const router = express.Router();
const driveService = require('../services/googleDrive');
const { verifyToken, checkDownloadLimit } = require('../middleware/auth');

// Folder ID mapping from environment
const getFolderMapping = () => ({
  movies: process.env.DRIVE_FOLDER_MOVIES || '',
  software: process.env.DRIVE_FOLDER_SOFTWARE || '',
  courses: process.env.DRIVE_FOLDER_COURSES || '',
  windows: process.env.DRIVE_FOLDER_WINDOWS || '',
  driver: process.env.DRIVE_FOLDER_DRIVER || ''
});

// ============ PUBLIC ENDPOINTS ============

// List files by raw folderId (PUBLIC) - used by frontend sync
router.get('/list-folder/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    const { pageToken } = req.query;

    if (!folderId || folderId === 'undefined') {
      return res.status(400).json({ error: 'Invalid folder ID' });
    }

    console.log(`📂 Request to list folder: ${folderId}`);
    
    const result = await driveService.listFiles(folderId, pageToken || null);

    res.json({
      success: true,
      files: result.files || [],
      nextPageToken: result.nextPageToken || null,
      count: result.files?.length || 0
    });
  } catch (error) {
    console.error('❌ List folder files error:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message,
      files: [] 
    });
  }
});

// List files in a category folder (PUBLIC)
router.get('/list/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { pageToken } = req.query;
    
    const folderMapping = getFolderMapping();
    const folderId = folderMapping[category];
    
    if (!folderId) {
      return res.status(400).json({ 
        error: `Invalid or unconfigured category: ${category}`,
        validCategories: Object.keys(folderMapping).filter(k => folderMapping[k])
      });
    }

    console.log(`📂 Request to list category: ${category} (folder: ${folderId})`);
    
    const result = await driveService.listFiles(folderId, pageToken || null);

    const items = (result.files || []).map(file =>
      driveService.convertToContentItem(file, category)
    );

    res.json({
      success: true,
      items,
      nextPageToken: result.nextPageToken || null,
      count: items.length
    });
  } catch (error) {
    console.error('❌ List files error:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message,
      items: [] 
    });
  }
});

// Get file info (PUBLIC)
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId || fileId === 'undefined') {
      return res.status(400).json({ error: 'Invalid file ID' });
    }
    
    console.log(`📄 Request to get file: ${fileId}`);
    
    const file = await driveService.getFile(fileId);
    res.json({
      success: true,
      ...file
    });
  } catch (error) {
    console.error('❌ Get file error:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============ PROTECTED ENDPOINTS (require auth) ============

// Sync all files from a category folder (for admin)
router.post('/sync/:category', verifyToken, async (req, res) => {
  try {
    const { category } = req.params;
    const folderMapping = getFolderMapping();
    const folderId = folderMapping[category];
    
    if (!folderId) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid or unconfigured category: ${category}` 
      });
    }

    console.log(`🔄 Syncing category: ${category}`);
    
    let allFiles = [];
    let pageToken = null;

    do {
      const result = await driveService.listFiles(folderId, pageToken);
      allFiles = allFiles.concat(result.files || []);
      pageToken = result.nextPageToken;
    } while (pageToken);

    const items = allFiles.map(file => 
      driveService.convertToContentItem(file, category)
    );

    console.log(`✅ Synced ${items.length} files from ${category}`);
    
    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Sync from specific folder URL (for admin)
router.post('/sync-url', verifyToken, async (req, res) => {
  try {
    const { url, category } = req.body;
    
    if (!url || !category) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing url or category in request body' 
      });
    }
    
    // Extract folder ID from URL
    const folderIdMatch = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (!folderIdMatch) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid Google Drive folder URL. Expected format: https://drive.google.com/drive/folders/FOLDER_ID' 
      });
    }

    const folderId = folderIdMatch[1];
    console.log(`🔄 Syncing folder from URL: ${folderId}`);
    
    let allFiles = [];
    let pageToken = null;

    do {
      const result = await driveService.listFiles(folderId, pageToken);
      allFiles = allFiles.concat(result.files || []);
      pageToken = result.nextPageToken;
    } while (pageToken);

    const items = allFiles.map(file => 
      driveService.convertToContentItem(file, category)
    );

    console.log(`✅ Synced ${items.length} files from URL`);
    
    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    console.error('❌ Sync URL error:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get download stream (protected - checks user limits)
router.get('/download/:fileId', verifyToken, checkDownloadLimit, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId || fileId === 'undefined') {
      return res.status(400).json({ error: 'Invalid file ID' });
    }
    
    console.log(`⬇️ Download request for file: ${fileId}`);
    
    // Get file info first
    const fileInfo = await driveService.getDownloadInfo(fileId);
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.name)}"`);
    res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
    if (fileInfo.size) {
      res.setHeader('Content-Length', fileInfo.size);
    }

    // Stream file to response
    const stream = await driveService.getFileStream(fileId);
    
    stream.on('error', (error) => {
      console.error('❌ Stream error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
    
    stream.pipe(res);
    
  } catch (error) {
    console.error('❌ Download error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
