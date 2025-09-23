// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

/* eslint-disable no-await-in-loop */

/**
 * PersistentChunkQueue - Page-level singleton for audio chunk upload queue
 */

import type { QueuedChunk } from "~@reentry/frontend/types/recording";

interface UploadResponse {
  success: boolean;
  error?: string;
}

export class PersistentChunkQueue {
  private dbName = "AudioChunkQueue";
  private storeName = "chunks";
  private db: IDBDatabase | null = null;
  private isProcessing = false;
  private isInitialized = false;
  private acceptingNewChunks = true;
  private globalRetryCount = 0;
  private maxGlobalRetries = 5000;
  private maxQueueSize = 1440; // each chunk is 5 seconds for total of 2 hours recording. ~ 60 to 100MB.
  private retryDelay = 5000; // Base delay in ms
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    private uploadFunction: (chunk: QueuedChunk) => Promise<UploadResponse>,
  ) {}

  /**
   * Initialize the queue and start automatic processing
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.openDatabase();
      this.isInitialized = true;
      console.log("PersistentChunkQueue initialized");

      this.startProcessingTimer();

      this.setupTabCloseHandler();
    } catch (error) {
      console.error("Failed to initialize PersistentChunkQueue:", error);
    }
  }

  /**
   * Add a chunk to the queue for processing
   */
  async pushChunk(chunk: Omit<QueuedChunk, "id">): Promise<void> {
    if (!this.acceptingNewChunks) {
      console.warn("Queue not accepting new chunks");
      return;
    }

    if (!this.isInitialized) {
      console.error("Queue not initialized");
      return;
    }

    const currentSize = await this.getQueueSize();
    if (currentSize >= this.maxQueueSize) {
      console.error(
        `Queue size limit reached (${this.maxQueueSize}). Stopping recording.`,
      );
      this.acceptingNewChunks = false;
      return;
    }

    const queuedChunk: QueuedChunk = {
      ...chunk,
      id: crypto.randomUUID(),
    };

    try {
      await this.addChunkToDb(queuedChunk);
      console.log(`Chunk ${queuedChunk.chunkIndex} added to queue`);
    } catch (error) {
      console.error("Failed to add chunk to queue:", error);
    }
  }

  /**
   * Get current queue size by querying IndexedDB directly
   */
  async getQueueSize(): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.storeName], "readonly");
      if (!transaction) {
        reject(new Error("Failed to create transaction"));
        return;
      }
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if queue is accepting new chunks
   */
  isAcceptingChunks(): boolean {
    return this.acceptingNewChunks;
  }

  /**
   * Open IndexedDB connection
   */
  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  /**
   * Atomically get the next chunk and remove it from the queue
   */
  private async getNextChunkAndRemove(): Promise<QueuedChunk | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.storeName], "readwrite");
      if (!transaction) {
        reject(new Error("Failed to create transaction"));
        return;
      }
      const store = transaction.objectStore(this.storeName);
      const index = store.index("timestamp");
      const request = index.openCursor(null, "prev"); // gets the last in chunk.

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const chunk = cursor.value as QueuedChunk;
          cursor.delete();
          resolve(chunk);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add chunk to IndexedDB
   */
  private async addChunkToDb(chunk: QueuedChunk): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.storeName], "readwrite");
      if (!transaction) {
        reject(new Error("Failed to create transaction"));
        return;
      }
      const store = transaction.objectStore(this.storeName);
      const request = store.add(chunk);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Background processing loop
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.debug("Started queue processing");

    try {
      while (true) {
        if (this.globalRetryCount >= this.maxGlobalRetries) {
          console.error(
            `Global retry limit reached (${this.maxGlobalRetries}), stopping queue processing`,
          );
          this.acceptingNewChunks = false;
          if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
          }
          break;
        }

        const chunk = await this.getNextChunkAndRemove();
        if (!chunk) {
          console.debug("No more chunks in queue");
          break;
        }

        try {
          console.log(
            `Processing chunk ${chunk.chunkIndex} (timestamp: ${chunk.timestamp})`,
          );
          const result = await this.uploadFunction(chunk);

          if (result.success) {
            console.log(
              `Successfully uploaded chunk ${chunk.chunkIndex} (timestamp: ${chunk.timestamp})`,
            );
            this.globalRetryCount = 0;
          } else {
            console.error(
              `Upload failed for chunk ${chunk.chunkIndex} (timestamp: ${chunk.timestamp})`,
            );
            throw new Error(result.error || "Upload failed");
          }
        } catch (error) {
          console.error(`Upload failed for chunk ${chunk.chunkIndex}:`, error);

          this.globalRetryCount++;
          console.log(
            `Global retry count: ${this.globalRetryCount}/${this.maxGlobalRetries}`,
          );

          const reQueuedChunk: QueuedChunk = {
            ...chunk,
            id: crypto.randomUUID(),
          };

          await this.addChunkToDb(reQueuedChunk);
          console.log(
            `Chunk ${chunk.chunkIndex} re-queued for retry (original timestamp: ${chunk.timestamp})`,
          );

          // Wait before processing next chunk since the previous upload failed.
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    } catch (error) {
      console.error("Error in queue processing:", error);
    } finally {
      this.isProcessing = false;
      console.debug("Stopped queue processing");
    }
  }

  private startProcessingTimer(): void {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing && this.isInitialized) {
        const queueSize = await this.getQueueSize();
        if (queueSize > 0) {
          this.processQueue();
        }
      }
    }, 5000);
  }

  /**
   * Check if there are uploads in progress
   */
  private hasInProgressUploads(): boolean {
    return this.isProcessing;
  }

  /**
   * Stop accepting new chunks (for tab close handling)
   */
  private stopAcceptingNewChunks(): void {
    this.acceptingNewChunks = false;
  }

  /**
   * Set up tab close warning for in-progress uploads
   */
  private setupTabCloseHandler(): void {
    window.addEventListener("beforeunload", (event) => {
      if (this.hasInProgressUploads()) {
        event.preventDefault();

        this.stopAcceptingNewChunks();

        return "Upload in progress. Close anyway?";
      }
      return;
    });
  }

  async getQueuedChunks(): Promise<QueuedChunk[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.storeName], "readonly");
      if (!transaction) {
        reject(new Error("Failed to create transaction"));
        return;
      }

      const store = transaction.objectStore(this.storeName);
      const index = store.index("timestamp");
      const request = index.getAll();

      request.onsuccess = () => {
        const chunks = request.result as QueuedChunk[];
        chunks.sort((a, b) => a.timestamp - b.timestamp);
        resolve(chunks);
      };
      request.onerror = () => reject(request.error);
    });
  }
}
