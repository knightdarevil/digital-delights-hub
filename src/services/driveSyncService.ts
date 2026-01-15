// Google Drive to Firebase Sync Service
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { googleDriveService, DriveFile } from './googleDriveService';
import { ContentItem } from '@/types/user';

const CONTENTS_COLLECTION = 'contents';

export interface SyncResult {
  added: number;
  updated: number;
  errors: string[];
}

export const driveSyncService = {
  // Sync a single folder to Firebase
  async syncFolder(folderId: string, category: string): Promise<SyncResult> {
    const result: SyncResult = { added: 0, updated: 0, errors: [] };

    try {
      console.log(`🔄 Syncing folder ${folderId} to category ${category}`);
      
      // Get files from Google Drive via VPS backend
      const driveFiles = await googleDriveService.listFiles(folderId);
      console.log(`📁 Found ${driveFiles.length} files in Drive folder`);
      
      // Get existing content from Firebase for this category
      const existingQuery = query(
        collection(db, CONTENTS_COLLECTION),
        where('category', '==', category)
      );
      const existingSnapshot = await getDocs(existingQuery);
      const existingByDriveId = new Map<string, { id: string; data: ContentItem }>();
      
      existingSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as ContentItem;
        if (data.driveFileId) {
          existingByDriveId.set(data.driveFileId, { id: docSnap.id, data });
        }
      });

      console.log(`📊 Found ${existingByDriveId.size} existing items in Firebase`);

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
            console.log(`✏️ Updated: ${contentData.title}`);
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
            console.log(`➕ Added: ${contentData.title}`);
          }
        } catch (error) {
          const errorMsg = `Error processing ${driveFile.name}: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
      
      console.log(`✅ Sync complete: ${result.added} added, ${result.updated} updated, ${result.errors.length} errors`);
    } catch (error) {
      const errorMsg = `Error syncing folder ${folderId}: ${error}`;
      result.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }

    return result;
  },

  // Sync single file from URL
  async syncFileFromUrl(url: string, category: string): Promise<{ success: boolean; message: string; contentId?: string }> {
    const fileId = googleDriveService.parseFileId(url);
    
    if (!fileId) {
      return { success: false, message: 'Invalid Google Drive URL' };
    }

    try {
      console.log(`🔄 Syncing file ${fileId} to category ${category}`);
      
      // Get file details from Google Drive
      const driveFile = await googleDriveService.getFile(fileId);
      
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
        console.log(`✏️ Updated existing file: ${contentData.title}`);
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
        console.log(`➕ Added new file: ${contentData.title}`);
        return { success: true, message: 'Content added successfully', contentId: docRef.id };
      }
    } catch (error) {
      console.error(`❌ Error syncing file:`, error);
      return { success: false, message: `Error: ${error}` };
    }
  },

  // Sync folder from URL - syncs all files in a Google Drive folder
  async syncFolderFromUrl(url: string, category: string): Promise<{ success: boolean; message: string; added: number; updated: number }> {
    const folderId = googleDriveService.parseFolderId(url);
    
    if (!folderId) {
      return { success: false, message: 'Invalid Google Drive folder URL', added: 0, updated: 0 };
    }

    try {
      console.log(`🔄 Syncing folder from URL: ${url}`);
      const result = await this.syncFolder(folderId, category);
      
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
      console.error(`❌ Error syncing folder:`, error);
      return { success: false, message: `Error: ${error}`, added: 0, updated: 0 };
    }
  },

  // Smart sync - auto-detect if URL is file or folder
  async syncFromUrl(url: string, category: string): Promise<{ success: boolean; message: string }> {
    console.log(`🔍 Auto-detecting URL type: ${url}`);
    
    // Check if it's a folder URL first
    if (url.includes('/folders/') || url.includes('/drive/folders')) {
      console.log(`📁 Detected folder URL`);
      const result = await this.syncFolderFromUrl(url, category);
      return { success: result.success, message: result.message };
    }
    
    // Otherwise try as file
    console.log(`📄 Detected file URL`);
    return this.syncFileFromUrl(url, category);
  },
};
