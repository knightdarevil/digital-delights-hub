const { google } = require('googleapis');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.init();
  }

  init() {
    try {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      const rawB64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

      if (!raw && !rawB64) {
        console.error('❌ Missing GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_BASE64');
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
      
      const credentials = JSON.parse(jsonText);
      console.log(`📧 Service Account Email: ${credentials.client_email}`);

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });

      this.drive = google.drive({ version: 'v3', auth });
      console.log('✅ Google Drive Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive:', error.message);
      console.error('Stack:', error.stack);
    }
  }

  // List files in a folder
  async listFiles(folderId, pageToken = null) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized. Check your GOOGLE_SERVICE_ACCOUNT_KEY.');
    }

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

      console.log(`✅ Found ${response.data.files?.length || 0} files`);
      
      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error(`❌ Error listing files:`, error.message);
      
      if (error.code === 404) {
        throw new Error(`Folder not found: ${folderId}. Make sure the folder is shared with the Service Account.`);
      }
      if (error.code === 403) {
        throw new Error(`Access denied to folder: ${folderId}. Make sure the folder is shared with the Service Account email.`);
      }
      
      throw error;
    }
  }

  // Get single file details
  async getFile(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

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
      throw error;
    }
  }

  // Get file stream for download
  async getFileStream(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    const response = await this.drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );

    return response.data;
  }

  // Get file metadata and download URL
  async getDownloadInfo(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

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

    // Determine type based on mimeType
    let type = 'file';
    if (file.mimeType?.includes('video')) type = 'video';
    else if (file.mimeType?.includes('image')) type = 'image';
    else if (file.mimeType?.includes('audio')) type = 'audio';
    else if (file.mimeType?.includes('pdf')) type = 'pdf';
    else if (file.mimeType?.includes('zip') || file.mimeType?.includes('rar')) type = 'archive';

    return {
      driveFileId: file.id,
      title: file.name,
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

module.exports = new GoogleDriveService();
