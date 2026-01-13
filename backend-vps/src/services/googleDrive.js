const { google } = require('googleapis');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.init();
  }

  init() {
    try {
      // Parse Service Account credentials from environment
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });

      this.drive = google.drive({ version: 'v3', auth });
      console.log('✅ Google Drive Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive:', error.message);
    }
  }

  // List files in a folder
  async listFiles(folderId, pageToken = null) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink)',
      pageSize: 100,
      pageToken,
      orderBy: 'createdTime desc'
    });

    return {
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken
    };
  }

  // Get single file details
  async getFile(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink'
    });

    return response.data;
  }

  // Get file stream for download
  async getFileStream(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
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
      category,
      type,
      size: formattedSize,
      thumbnailUrl: file.thumbnailLink || '',
      createdAt: file.createdTime,
      modifiedAt: file.modifiedTime
    };
  }
}

module.exports = new GoogleDriveService();
