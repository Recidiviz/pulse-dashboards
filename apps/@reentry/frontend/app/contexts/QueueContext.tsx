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

"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";

import { $api } from "~@reentry/frontend/api";
import type { QueuedChunk } from "~@reentry/frontend/types/recording";
import { PersistentChunkQueue } from "~@reentry/frontend/utils/persistentQueue";

interface QueueContextType {
  queue: PersistentChunkQueue;
}

const QueueContext = createContext<QueueContextType | null>(null);

interface QueueProviderProps {
  children: ReactNode;
}

export const QueueProvider = ({ children }: QueueProviderProps) => {
  // Create upload function that the queue will use
  const uploadChunkMutation = $api.useMutation(
    "post",
    "/recordings/sessions/{session_id}/upload-chunk",
  );

  const uploadFunction = useCallback(async (chunk: QueuedChunk) => {
    try {
      await uploadChunkMutation.mutateAsync({
        params: { path: { session_id: chunk.sessionId } },
        body: {
          timestamp: chunk.timestamp,
          chunk_index: chunk.chunkIndex,
          chunk_data: chunk.chunkData,
          mime_type: chunk.mimeType,
          has_header: chunk.hasHeader,
          chunk_duration: chunk.chunkDuration,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }, []);

  // Create queue instance as page-level singleton
  const queue = useMemo(
    () => new PersistentChunkQueue(uploadFunction),
    [uploadFunction],
  );

  // Initialize queue on mount
  useEffect(() => {
    queue.initialize();
  }, [queue]);

  const value = useMemo(() => ({ queue }), [queue]);

  return (
    <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
  );
};

export const useQueue = (): PersistentChunkQueue => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within QueueProvider");
  }
  return context.queue;
};
