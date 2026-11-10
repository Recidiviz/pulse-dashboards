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

import type { z } from "zod";

import type {
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  Prisma,
} from "~@idaho-th/prisma/client";
import type { housingApplicationFormSchema } from "~@idaho-th/trpc/routes/housing-common/housingApplication.form.schema";

import type { submitDraftHousingApplicationSchema } from "./draftIntake.schema";

export type SubmitDraftHousingApplicationInput = z.infer<
  typeof submitDraftHousingApplicationSchema
>;

export type SubmitDraftIntakeApplicationInput =
  SubmitDraftHousingApplicationInput;

export type HousingApplicationForm = z.infer<
  typeof housingApplicationFormSchema
>;

export type DraftIntakeDocumentInput = {
  bucketName: string;
  objectKey: string;
  contentType: string;
  fileSizeBytes?: number;
  fileName?: string;
};

export type CreateDraftIntakeApplicationInput = {
  applicationId: string;
  staffPseudonymizedId: string;
  formData: Prisma.InputJsonValue;
  document?: DraftIntakeDocumentInput;
};

export type CreateDraftIntakeApplicationShellInput = {
  applicationId: string;
  staffPseudonymizedId: string;
  document: DraftIntakeDocumentInput;
  /**
   * Defaults to CONFIRMED (the streaming-upload flow's behavior, where the
   * server has already written the object to GCS by the time this is
   * called). Pass PENDING when the shell is created before the browser has
   * finished PUTting bytes directly to a signed upload URL — the caller must
   * then flip it to CONFIRMED itself (see markDocumentConfirmed) once the
   * upload is verified.
   */
  documentStatus?: HousingApplicationDocumentStatus;
};

export type FinalizeDraftIntakeApplicationDataInput = {
  applicationId: string;
  formData: Prisma.InputJsonValue;
};

export type DocumentScanState = {
  scanStatus: HousingApplicationDocumentScanStatus;
  bucketName: string;
};
