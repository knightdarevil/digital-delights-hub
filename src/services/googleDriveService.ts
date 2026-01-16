// Google Drive API Service
// Uses VPS Backend with Service Account for private folders

const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

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

// Category mapping - Map Google Drive folder IDs to content categories
export const DRIVE_FOLDER_MAPPING: Record<string, string> = {
  'YOUR_MOVIES_FOLDER_ID': 'movies',
  'YOUR_SOFTWARE_FOLDER_ID': 'software',
  'YOUR_WINDOWS_FOLDER_ID': 'windows',
  'YOUR_COURSES_FOLDER_ID': 'courses',
  'YOUR_DRIVER_FOLDER_ID': 'driver',
};

export const googleDriveService = {
  getApiKey(): string {
    return import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '';
  },

  getBackendUrl(): string {
    // In development with Vite proxy, use relative path
    // In production, use the configured backend URL
    const configuredUrl = import.meta.env.VITE_VPS_BACKEND_URL || '';
    if (configuredUrl) {
      return configuredUrl.replace(/\/+$/, '');
    }
    // Default to relative path (works with Vite proxy in dev)
    return '';
  },

  // List files in a folder - Always uses VPS backend if configured
  async listFiles(folderId: string, apiKey?: string): Promise<DriveFile[]> {
    const backendUrl = this.getBackendUrl();
    
    // Use relative path for proxy or absolute for configured backend
    const baseUrl = backendUrl || '';
    console.log('📡 Using backend:', baseUrl || 'proxy (/api)');
    const url = `${baseUrl}/api/drive/list-folder/${encodeURIComponent(folderId)}`;
      
    try {
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
      
      const data = await response.json();
      console.log('✅ Fetched files from backend:', data.files?.length || 0);
      return data.files || [];
    } catch (error) {
      console.error('❌ Backend fetch error:', error);
      throw error;
    }
  },

  // Get file details
  async getFile(fileId: string, apiKey?: string): Promise<DriveFile> {
    const backendUrl = this.getBackendUrl();
    const baseUrl = backendUrl || '';
    const url = `${baseUrl}/api/drive/file/${encodeURIComponent(fileId)}`;
    
    const response = await fetch(url);
    
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
    
    if (file.mimeType?.includes('video') || name.match(/\.(mp4|mkv|avi|mov)$/)) {
      type = 'video';
    } else if (file.mimeType?.includes('application') || name.match(/\.(exe|msi|dmg|pkg|iso|zip|rar)$/)) {
      type = 'software';
    } else if (name.match(/\.(pdf|doc|docx|ppt|pptx)$/)) {
      type = 'document';
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
    } else {
      size = sizeInBytes + ' bytes';
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
    // Format: https://drive.google.com/file/d/FILE_ID/view
    let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Format: https://drive.google.com/open?id=FILE_ID
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Format: https://drive.google.com/uc?id=FILE_ID
    match = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Already a file ID
    if (/^[a-zA-Z0-9_-]+$/.test(url) && url.length > 20) {
      return url;
    }

    return null;
  },

  // Parse folder ID from various Google Drive folder URL formats
  parseFolderId(url: string): string | null {
    // Format: https://drive.google.com/drive/folders/FOLDER_ID
    let match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Format: https://drive.google.com/drive/u/0/folders/FOLDER_ID
    match = url.match(/\/drive\/u\/\d+\/folders\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Format: https://drive.google.com/open?id=FOLDER_ID
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Already a folder ID (just an ID string)
    if (/^[a-zA-Z0-9_-]+$/.test(url) && url.length > 20) {
      return url;
    }

    return null;
  },
};
