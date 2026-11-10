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

export { getDisplayFileName } from "~@idaho-th/shared";

export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

const EXTENSION_MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  heic: "image/heic",
  heif: "image/heif",
};

export function resolveMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME_MAP[ext] ?? "";
}

export const ALLOWED_ACCEPT = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/heic",
  "image/heif",
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".docx",
  ".heic",
  ".heif",
].join(",");

export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

interface TriggerBrowserDownloadOptions {
  href: string;
  download?: string;
  openInNewTab?: boolean;
  revoke?: boolean;
}

export function triggerBrowserDownload({
  href,
  download,
  openInNewTab = false,
  revoke = false,
}: TriggerBrowserDownloadOptions): void {
  const link = document.createElement("a");
  link.href = href;
  if (download) link.download = download;
  if (openInNewTab) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  link.click();
  if (revoke) setTimeout(() => URL.revokeObjectURL(href), 0);
}
