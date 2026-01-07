// Google Drive API Service
// Requires: GOOGLE_DRIVE_API_KEY in environment or Firebase config

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
  // Replace these with your actual Google Drive folder IDs
  'YOUR_MOVIES_FOLDER_ID': 'movies',
  'YOUR_SOFTWARE_FOLDER_ID': 'software',
  'YOUR_WINDOWS_FOLDER_ID': 'windows',
  'YOUR_COURSES_FOLDER_ID': 'courses',
  'YOUR_DRIVER_FOLDER_ID': 'driver',
};

export const googleDriveService = {
  // Get API key from environment or Firebase Remote Config
  getApiKey(): string {
    // You can store this in Firebase Remote Config or environment
    return import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '';
  },

  // List files in a folder
  async listFiles(folderId: string, apiKey?: string): Promise<DriveFile[]> {
    const key = apiKey || this.getApiKey();
    if (!key) {
      throw new Error('Google Drive API key not configured');
    }

    const query = `'${folderId}' in parents and trashed = false`;
    const fields = 'files(id,name,mimeType,size,webContentLink,webViewLink,thumbnailLink,createdTime,modifiedTime,description)';
    
    const url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&key=${key}&orderBy=createdTime desc`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch files from Google Drive');
    }
    
    const data = await response.json();
    return data.files || [];
  },

  // Get file details
  async getFile(fileId: string, apiKey?: string): Promise<DriveFile> {
    const key = apiKey || this.getApiKey();
    if (!key) {
      throw new Error('Google Drive API key not configured');
    }

    const fields = 'id,name,mimeType,size,webContentLink,webViewLink,thumbnailLink,createdTime,modifiedTime,description';
    const url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?fields=${encodeURIComponent(fields)}&key=${key}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch file from Google Drive');
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
};
