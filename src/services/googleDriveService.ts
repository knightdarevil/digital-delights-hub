// Google Drive API Service
// Uses VPS Backend with Service Account for private folders

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webContentLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  description?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
}

export const googleDriveService = {
  /**
   * Get the backend URL
   * In development: empty string (Vite proxy handles /api)
   * In production: VITE_VPS_BACKEND_URL value
   */
  getBackendUrl(): string {
    const configuredUrl = import.meta.env.VITE_VPS_BACKEND_URL || '';
    return configuredUrl ? configuredUrl.replace(/\/+$/, '') : '';
  },

  /**
   * Build full API URL
   * Handles both proxy mode (dev) and direct URL (production)
   */
  buildApiUrl(path: string): string {
    const backendUrl = this.getBackendUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendUrl}${normalizedPath}`;
  },

  // List files in a folder - uses VPS backend
  async listFiles(folderId: string): Promise<DriveFile[]> {
    const url = this.buildApiUrl(`/api/drive/list-folder/${encodeURIComponent(folderId)}`);
    
    console.log('📡 Fetching files from:', url);
      
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.error || `Backend error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Fetched files from backend:', data.files?.length || 0);
      return data.files || [];
    } catch (error) {
      console.error('❌ Backend fetch error:', error);
      throw error;
    }
  },

  // Get file details
  async getFile(fileId: string): Promise<DriveFile> {
    const url = this.buildApiUrl(`/api/drive/file/${encodeURIComponent(fileId)}`);
    
    console.log('📡 Getting file details from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Backend error: ${response.status}`);
    }
    
    return response.json();
  },

  // Convert Google Drive file to ContentItem format
  convertToContentItem(file: DriveFile, category: string): {
    title: string;
    description: string;
    category: string;
    type: string;
    downloadLink: string;
    size: string;
    imageUrl: string;
    driveFileId: string;
  } {
    // Determine type based on mime type or file extension
    let type = 'other';
    const name = file.name.toLowerCase();
    
    if (file.mimeType?.includes('video') || name.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/)) {
      type = 'video';
    } else if (file.mimeType?.includes('application') || name.match(/\.(exe|msi|dmg|pkg|iso|zip|rar|7z)$/)) {
      type = 'software';
    } else if (name.match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/)) {
      type = 'document';
    } else if (file.mimeType?.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      type = 'image';
    } else if (file.mimeType?.includes('audio') || name.match(/\.(mp3|wav|flac|aac)$/)) {
      type = 'audio';
    }

    // Format file size
    const sizeInBytes = parseInt(file.size || '0');
    let size = '';
    if (sizeInBytes > 1073741824) {
      size = (sizeInBytes / 1073741824).toFixed(2) + ' GB';
    } else if (sizeInBytes > 1048576) {
      size = (sizeInBytes / 1048576).toFixed(2) + ' MB';
    } else if (sizeInBytes > 1024) {
      size = (sizeInBytes / 1024).toFixed(2) + ' KB';
    } else if (sizeInBytes > 0) {
      size = sizeInBytes + ' bytes';
    } else {
      size = 'Unknown';
    }

    // Create direct download link
    const downloadLink = `https://drive.google.com/uc?export=download&id=${file.id}`;

    return {
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      description: file.description || `${file.name} - ${size}`,
      category,
      type,
      downloadLink,
      size,
      imageUrl: file.thumbnailLink || '',
      driveFileId: file.id,
    };
  },

  // Get direct download link for a file
  getDirectDownloadLink(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  },

  // Get embed/preview link for a file
  getPreviewLink(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  },

  // Parse file ID from various Google Drive URL formats
  parseFileId(url: string): string | null {
    if (!url) return null;
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Format: https://drive.google.com/open?id=FILE_ID
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Format: https://drive.google.com/uc?id=FILE_ID
    match = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Already a file ID (alphanumeric string of reasonable length)
    if (/^[a-zA-Z0-9_-]{10,50}$/.test(url)) {
      return url;
    }

    return null;
  },

  // Parse folder ID from various Google Drive folder URL formats
  parseFolderId(url: string): string | null {
    if (!url) return null;
    
    // Format: https://drive.google.com/drive/folders/FOLDER_ID
    let match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Format: https://drive.google.com/drive/u/0/folders/FOLDER_ID
    match = url.match(/\/drive\/u\/\d+\/folders\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Format: https://drive.google.com/open?id=FOLDER_ID
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Already a folder ID (alphanumeric string of reasonable length)
    if (/^[a-zA-Z0-9_-]{10,50}$/.test(url)) {
      return url;
    }

    return null;
  },

  // Check if backend is available
  async checkBackendHealth(): Promise<boolean> {
    try {
      const url = this.buildApiUrl('/health');
      const response = await fetch(url, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};
