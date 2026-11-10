// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { makeAutoObservable } from "mobx";

import type { IdahoTHStore } from "./IdahoTHStore";

export type UploadStatus =
  | "uploading"
  | "success"
  | "failed"
  | "scanning"
  | "updating";

export interface PendingUpload {
  applicationId: string;
  documentId: string;
  errorMessage?: string;
  fileName: string;
  loadedBytes: number;
  pendingId: string;
  progress: number;
  status: UploadStatus;
  totalBytes: number;
}

export class HousingApplicationsStore {
  currentApplicationId: string | undefined = undefined;

  pendingUploads = new Map<string, PendingUpload>();

  constructor(public parent: IdahoTHStore) {
    makeAutoObservable(this);
  }

  setCurrentApplicationId(id: string | undefined): void {
    this.currentApplicationId = id;
  }

  addPendingUpload(upload: PendingUpload): void {
    this.pendingUploads.set(upload.pendingId, upload);
  }

  updatePendingUpload(
    pendingId: string,
    patch: Partial<Omit<PendingUpload, "pendingId">>,
  ): void {
    const existing = this.pendingUploads.get(pendingId);
    if (existing) {
      this.pendingUploads.set(pendingId, { ...existing, ...patch });
    }
  }

  removePendingUpload(pendingId: string): void {
    this.pendingUploads.delete(pendingId);
  }

  reset(): void {
    this.currentApplicationId = undefined;
    this.pendingUploads.clear();
  }
}
