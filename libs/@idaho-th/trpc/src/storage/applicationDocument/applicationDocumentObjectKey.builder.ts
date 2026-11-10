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

import { HousingApplicationDocumentType } from "~@idaho-th/prisma/client";
import { GCS_OBJECT_KEY_REGEX } from "~@idaho-th/trpc/storage/gcs/gcs.constants";

const DOCUMENT_TYPE_FILE_SUFFIX: Record<
  HousingApplicationDocumentType,
  string
> = {
  [HousingApplicationDocumentType.HANDWRITTEN_SOURCE]:
    "handwritten-application",
  [HousingApplicationDocumentType.DIGITIZED]: "digitized-application",
  [HousingApplicationDocumentType.ATTACHMENT]: "attachment",
};

export function buildApplicationDocumentFileName(
  objectId: string,
  documentType: HousingApplicationDocumentType,
  extension = "pdf",
): string {
  const suffix = DOCUMENT_TYPE_FILE_SUFFIX[documentType];
  return `${objectId}_${suffix}.${extension}`;
}

type StaffDocumentObjectKeyInput = {
  staffPseudonymizedId: string;
  objectId: string;
  documentType: HousingApplicationDocumentType;
  extension?: string;
};

export function buildStaffApplicationDocumentObjectKey({
  staffPseudonymizedId,
  objectId,
  documentType,
  extension = "pdf",
}: StaffDocumentObjectKeyInput): string {
  const fileName = buildApplicationDocumentFileName(
    objectId,
    documentType,
    extension,
  );
  const objectKey = `applications/staff/${staffPseudonymizedId}/${documentType}/${fileName}`;

  if (!GCS_OBJECT_KEY_REGEX.test(objectKey)) {
    throw new Error("Generated GCS object key failed validation");
  }

  return objectKey;
}

type ApplicationDocumentObjectKeyInput = {
  applicationId: string;
  documentId: string;
  extension?: string;
};

export function buildApplicationDocumentObjectKey({
  applicationId,
  documentId,
  extension,
}: ApplicationDocumentObjectKeyInput): string {
  const suffix = extension ? `.${extension}` : "";
  const objectKey = `applications/${applicationId}/documents/${documentId}${suffix}`;

  if (!GCS_OBJECT_KEY_REGEX.test(objectKey)) {
    throw new Error("Generated GCS object key failed validation");
  }

  return objectKey;
}

const MAX_DISPLAY_FILE_NAME_LENGTH = 200;
const UNKNOWN_DISPLAY_FILE_NAME = "document";

export function sanitizeDisplayFileName(fileName: string): string {
  const withoutPathSeparators = fileName.replace(/[/\\]+/g, " ");
  const printable = Array.from(withoutPathSeparators)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code > 0x1f && code !== 0x7f;
    })
    .join("");

  const base = printable
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DISPLAY_FILE_NAME_LENGTH)
    .trim();

  return base.length > 0 ? base : UNKNOWN_DISPLAY_FILE_NAME;
}
