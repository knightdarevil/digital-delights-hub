const { google } = require('googleapis');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.initialized = false;
    this.initError = null;
  }

  init() {
    if (this.initialized) return;
    
    try {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      const rawB64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

      if (!raw && !rawB64) {
        this.initError = 'Missing GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_BASE64';
        console.error('❌ ' + this.initError);
        console.error('Please set one of these environment variables with your Service Account JSON');
        return;
      }

      // Support either JSON string OR base64(JSON)
      let jsonText;
      if (rawB64) {
        console.log('📋 Using base64 encoded service account key');
        jsonText = Buffer.from(rawB64, 'base64').toString('utf8');
      } else {
        console.log('📋 Using JSON string service account key');
        jsonText = raw;
      }
      
      let credentials;
      try {
        credentials = JSON.parse(jsonText);
      } catch (parseError) {
        this.initError = 'Invalid JSON in service account key: ' + parseError.message;
        console.error('❌ ' + this.initError);
        return;
      }
      
      if (!credentials.client_email || !credentials.private_key) {
        this.initError = 'Service account key missing required fields (client_email or private_key)';
        console.error('❌ ' + this.initError);
        return;
      }
      
      console.log(`📧 Service Account Email: ${credentials.client_email}`);
      console.log('💡 Make sure to share your Google Drive folders with this email!');

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.initialized = true;
      console.log('✅ Google Drive Service initialized successfully');
    } catch (error) {
      this.initError = 'Failed to initialize Google Drive: ' + error.message;
      console.error('❌ ' + this.initError);
      console.error('Stack:', error.stack);
    }
  }

  ensureInitialized() {
    if (!this.initialized) {
      this.init();
    }
    
    if (!this.drive) {
      throw new Error(this.initError || 'Google Drive not initialized. Check your GOOGLE_SERVICE_ACCOUNT_KEY.');
    }
  }

  // List files in a folder
  async listFiles(folderId, pageToken = null) {
    this.ensureInitialized();

    console.log(`📂 Listing files in folder: ${folderId}`);
    
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, description)',
        pageSize: 100,
        pageToken,
        orderBy: 'createdTime desc',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true
      });

      const files = response.data.files || [];
      console.log(`✅ Found ${files.length} files`);
      
      return {
        files,
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error(`❌ Error listing files:`, error.message);
      
      if (error.code === 404) {
        throw new Error(`Folder not found: ${folderId}. Make sure the folder ID is correct.`);
      }
      if (error.code === 403) {
        throw new Error(`Access denied to folder: ${folderId}. Make sure the folder is shared with the Service Account email.`);
      }
      if (error.code === 400) {
        throw new Error(`Invalid folder ID: ${folderId}. Please check the folder ID format.`);
      }
      
      throw error;
    }
  }

  // Get single file details
  async getFile(fileId) {
    this.ensureInitialized();

    console.log(`📄 Getting file details: ${fileId}`);
    
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, description',
        supportsAllDrives: true
      });

      console.log(`✅ Got file: ${response.data.name}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error getting file:`, error.message);
      
      if (error.code === 404) {
        throw new Error(`File not found: ${fileId}`);
      }
      if (error.code === 403) {
        throw new Error(`Access denied to file: ${fileId}. Make sure it's shared with the Service Account.`);
      }
      
      throw error;
    }
  }

  // Get file stream for download
  async getFileStream(fileId) {
    this.ensureInitialized();

    console.log(`⬇️ Getting file stream: ${fileId}`);
    
    const response = await this.drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );

    return response.data;
  }

  // Get file metadata and download URL
  async getDownloadInfo(fileId) {
    this.ensureInitialized();

    const file = await this.getFile(fileId);
    
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size
    };
  }

  // Convert Drive file to content item format
  convertToContentItem(file, category) {
    const sizeInBytes = parseInt(file.size) || 0;
    let formattedSize = '';
    
    if (sizeInBytes >= 1073741824) {
      formattedSize = (sizeInBytes / 1073741824).toFixed(2) + ' GB';
    } else if (sizeInBytes >= 1048576) {
      formattedSize = (sizeInBytes / 1048576).toFixed(2) + ' MB';
    } else if (sizeInBytes >= 1024) {
      formattedSize = (sizeInBytes / 1024).toFixed(2) + ' KB';
    } else {
      formattedSize = sizeInBytes + ' bytes';
    }

    // Determine type based on mimeType or file extension
    let type = 'file';
    const name = (file.name || '').toLowerCase();
    const mimeType = file.mimeType || '';
    
    if (mimeType.includes('video') || name.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/)) {
      type = 'video';
    } else if (mimeType.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) {
      type = 'image';
    } else if (mimeType.includes('audio') || name.match(/\.(mp3|wav|flac|aac|ogg)$/)) {
      type = 'audio';
    } else if (mimeType.includes('pdf') || name.endsWith('.pdf')) {
      type = 'pdf';
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || name.match(/\.(zip|rar|7z|tar|gz)$/)) {
      type = 'archive';
    } else if (name.match(/\.(exe|msi|dmg|pkg|deb|rpm|iso)$/)) {
      type = 'software';
    }

    return {
      driveFileId: file.id,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      description: file.description || `${file.name} - ${formattedSize}`,
      category,
      type,
      size: formattedSize,
      thumbnailUrl: file.thumbnailLink || '',
      downloadLink: `https://drive.google.com/uc?export=download&id=${file.id}`,
      createdAt: file.createdTime,
      modifiedAt: file.modifiedTime
    };
  }
}

// Export singleton instance
const driveService = new GoogleDriveService();
driveService.init();

module.exports = driveService;
