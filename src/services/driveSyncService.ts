// Google Drive to Firebase Sync Service
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { googleDriveService, DRIVE_FOLDER_MAPPING, DriveFile } from './googleDriveService';
import { ContentItem } from '@/types/user';

const CONTENTS_COLLECTION = 'contents';

export interface SyncResult {
  added: number;
  updated: number;
  errors: string[];
}

export const driveSyncService = {
  // Sync a single folder to Firebase
  async syncFolder(folderId: string, category: string, apiKey?: string): Promise<SyncResult> {
    const result: SyncResult = { added: 0, updated: 0, errors: [] };

    try {
      // Get files from Google Drive
      const driveFiles = await googleDriveService.listFiles(folderId, apiKey);
      
      // Get existing content from Firebase for this category
      const existingQuery = query(
        collection(db, CONTENTS_COLLECTION),
        where('category', '==', category)
      );
      const existingSnapshot = await getDocs(existingQuery);
      const existingByDriveId = new Map<string, { id: string; data: ContentItem }>();
      
      existingSnapshot.docs.forEach(doc => {
        const data = doc.data() as ContentItem;
        if (data.driveFileId) {
          existingByDriveId.set(data.driveFileId, { id: doc.id, data });
        }
      });

      // Process each Drive file
      for (const driveFile of driveFiles) {
        try {
          const contentData = googleDriveService.convertToContentItem(driveFile, category);
          const existing = existingByDriveId.get(driveFile.id);

          if (existing) {
            // Update existing content
            await updateDoc(doc(db, CONTENTS_COLLECTION, existing.id), {
              ...contentData,
              updatedAt: serverTimestamp(),
            });
            result.updated++;
          } else {
            // Add new content
            await addDoc(collection(db, CONTENTS_COLLECTION), {
              ...contentData,
              views: 0,
              downloads: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            result.added++;
          }
        } catch (error) {
          result.errors.push(`Error processing ${driveFile.name}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Error syncing folder ${folderId}: ${error}`);
    }

    return result;
  },

  // Sync all configured folders
  async syncAllFolders(apiKey?: string): Promise<Record<string, SyncResult>> {
    const results: Record<string, SyncResult> = {};

    for (const [folderId, category] of Object.entries(DRIVE_FOLDER_MAPPING)) {
      if (folderId.startsWith('YOUR_')) continue; // Skip placeholder IDs
      results[category] = await this.syncFolder(folderId, category, apiKey);
    }

    return results;
  },

  // Sync single file from URL
  async syncFileFromUrl(url: string, category: string, apiKey?: string): Promise<{ success: boolean; message: string; contentId?: string }> {
    const fileId = googleDriveService.parseFileId(url);
    
    if (!fileId) {
      return { success: false, message: 'Invalid Google Drive URL' };
    }

    try {
      // Get file details from Google Drive
      const driveFile = await googleDriveService.getFile(fileId, apiKey);
      
      // Check if already exists
      const existingQuery = query(
        collection(db, CONTENTS_COLLECTION),
        where('driveFileId', '==', fileId)
      );
      const existingSnapshot = await getDocs(existingQuery);

      const contentData = googleDriveService.convertToContentItem(driveFile, category);

      if (!existingSnapshot.empty) {
        // Update existing
        const existingDoc = existingSnapshot.docs[0];
        await updateDoc(doc(db, CONTENTS_COLLECTION, existingDoc.id), {
          ...contentData,
          updatedAt: serverTimestamp(),
        });
        return { success: true, message: 'Content updated successfully', contentId: existingDoc.id };
      } else {
        // Add new
        const docRef = await addDoc(collection(db, CONTENTS_COLLECTION), {
          ...contentData,
          views: 0,
          downloads: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { success: true, message: 'Content added successfully', contentId: docRef.id };
      }
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  },

  // Sync folder from URL - syncs all files in a Google Drive folder
  async syncFolderFromUrl(url: string, category: string, apiKey?: string): Promise<{ success: boolean; message: string; added: number; updated: number }> {
    const folderId = googleDriveService.parseFolderId(url);
    
    if (!folderId) {
      return { success: false, message: 'Invalid Google Drive folder URL', added: 0, updated: 0 };
    }

    try {
      const result = await this.syncFolder(folderId, category, apiKey);
      
      if (result.errors.length > 0) {
        return { 
          success: result.added > 0 || result.updated > 0, 
          message: `Synced with ${result.errors.length} errors: ${result.errors[0]}`,
          added: result.added,
          updated: result.updated
        };
      }
      
      return { 
        success: true, 
        message: `Successfully synced ${result.added} new and ${result.updated} updated files`,
        added: result.added,
        updated: result.updated
      };
    } catch (error) {
      return { success: false, message: `Error: ${error}`, added: 0, updated: 0 };
    }
  },

  // Smart sync - auto-detect if URL is file or folder
  async syncFromUrl(url: string, category: string, apiKey?: string): Promise<{ success: boolean; message: string }> {
    // Check if it's a folder URL first
    if (url.includes('/folders/') || url.includes('/drive/folders')) {
      const result = await this.syncFolderFromUrl(url, category, apiKey);
      return { success: result.success, message: result.message };
    }
    
    // Otherwise try as file
    return this.syncFileFromUrl(url, category, apiKey);
  },
};
