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

import type { PrismaClient } from "~@idaho-th/prisma/client";
import type { GenderOption } from "~@idaho-th/shared";
import {
  COUNTY_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  DISTRICT_OPTIONS,
  IDS_ON_FILE_OPTIONS,
} from "~@idaho-th/shared";
import type { PdfOutputMode } from "~@idaho-th/trpc/pdfSorter/constants";
import type { PreparedPdfForExtraction } from "~@idaho-th/trpc/pdfSorter/prepare/preparePdfForExtraction";
import { GeminiJsonSchemaType } from "~@idaho-th/trpc/routes/vertex/constants";
import type { ModelProfileKey } from "~@idaho-th/trpc/routes/vertex/vertex.models";
export type {
  ModelProfile,
  ModelProfileKey,
  VertexThinkingLevel,
} from "~@idaho-th/trpc/routes/vertex/vertex.models";

export type VertexExtractionLogger = {
  info: (message: string, metadata?: Record<string, unknown>) => void;
  debug: (message: string, metadata?: Record<string, unknown>) => void;
};

export type IsoDateString = string;

export type PreferredDistrict = (typeof DISTRICT_OPTIONS)[number];

export type LegalCurrentStatus = (typeof CURRENT_STATUS_OPTIONS)[number];
export type { GenderOption };
export type IdahoCounty = (typeof COUNTY_OPTIONS)[number];

export type IdOnFileOption = (typeof IDS_ON_FILE_OPTIONS)[number];

export interface CaseManager {
  cmPoName: string | null;
  cmPoEmail: string | null;
  cmPoPhone: string | null;
  currentFacilityLocation: string | null;
}

export interface ClientIdentity {
  clientFullName: string | null;
  idocNumber: string | null;
  dob: IsoDateString | null;
  age: number;
  ssnLast4: string | null;
  gender: GenderOption;
  personalPhoneNumber: string | null;
}

export interface EmergencyContact {
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
}

export interface LegalStatus {
  legalCurrentStatus: LegalCurrentStatus;
  legalMostRecentConviction: string | null;
  legalCountyOfCrime: IdahoCounty;
  legalSexOffenderRegistry: boolean | null;
  legalBackupForIcOrIce: boolean | null;
  childVisitationRequired: boolean | null;
  priorInvoluntaryDischarge: boolean | null;
  violenceHistoryDors: boolean | null;
  housingProbationParoleAtRelease: boolean | null;
  tpdHousingNeededDate: IsoDateString | null;
  paroleHearingCompleted: boolean | null;
  vehicleOnSite: boolean | null;
}

export interface Identification {
  idsOnFile: IdOnFileOption[];
}

export interface Military {
  militaryService: boolean | null;
  vaEnrolled: boolean | null;
}

export interface Employment {
  employmentOnRelease: boolean | null;
  employer: string | null;
  employerContact: string | null;
}

export interface MedicalSupport {
  medicalMhSupportNeeded: boolean | null;
  contagiousDisease: boolean | null;
  prescriptionMedication: boolean | null;
  prescriptionMedicationCompany: string | null;
  assistanceCbrs: boolean | null;
  assistanceCbrsCompany: string | null;
  moudMatProgram: boolean | null;
  moudMatProgramCompany: string | null;
  contagiousDiseaseCompany: string | null;
  ongoingMedicalMhTreatment: boolean | null;
  ongoingMedicalMhTreatmentCompany: string | null;
  medicalAccommodations: string[];
  otherMedicalAccommodation: string | null;
  additionalMedicalInfo: string | null;
}

export type MedicalSupportPage2 = Pick<
  MedicalSupport,
  "medicalMhSupportNeeded" | "contagiousDisease"
>;

export type MedicalSupportPage4 = Omit<
  MedicalSupport,
  "medicalMhSupportNeeded"
>;

export interface Benefits {
  ssiSsdiSsrbMedicareMedicaid: boolean | null;
  benefitsReinstatementDate: string | null;
  benefitsDuration: string | null;
}

export interface SubstanceUse {
  prescribedMedications: string | null;
  addictions: boolean | null;
  substances: string | null;
  lastUseDate: string | null;
  underInfluenceAtCrime: boolean | null;
}

export interface HousingPreferences {
  faithBasedPreferred: boolean | null;
  previousTransitionalHome: boolean | null;
  previousHomeName: string | null;
  previousHomeCity: string | null;
  preferredDistrict: PreferredDistrict[];
  preferredProviders: string[];
}

export interface Signature {
  signatureProvided: boolean | null;
  signatureDate: IsoDateString | null;
}

export interface ReasonableAccommodations {
  accommodations: string[];
  otherAccommodations: string | null;
  accommodationsInfo: string | null;
}

export interface ChildVisitation {
  childFamilyServicesDocumentation: string[];
  parentGuardianNames: string | null;
  child1Info: string | null;
  child2Info: string | null;
  child3Info: string | null;
  childVisitationInfo: string | null;
}

export interface ViolenceAndDischarge {
  violenceDischargeDescription: string | null;
}

export interface SupportPlan {
  ssi90DayCarePlan: string | null;
  faithBasedProviderInfo: string | null;
}

interface ExtractedSections {
  caseManager: CaseManager;
  clientIdentity: ClientIdentity;
  emergencyContact: EmergencyContact;
  legalStatus: LegalStatus;
  identification: Identification;
  military: Military;
  employment: Employment;
  medicalSupport: MedicalSupport;
  benefits: Benefits;
  substanceUse: SubstanceUse;
  housingPreferences: HousingPreferences;
  signature: Signature;
  reasonableAccommodations: ReasonableAccommodations;
  childVisitation: ChildVisitation;
  violenceAndDischarge: ViolenceAndDischarge;
  supportPlan: SupportPlan;
}

export type HousingApplicationExtractedData = ExtractedSections;

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type FlatHousingApplicationExtractedData = UnionToIntersection<
  ExtractedSections[keyof ExtractedSections]
>;

export type HousingApplicationPage1ExtractedData = { readonly page: 1 } & Pick<
  ExtractedSections,
  | "clientIdentity"
  | "emergencyContact"
  | "legalStatus"
  | "identification"
  | "military"
> & {
    caseManager: Pick<
      CaseManager,
      "cmPoEmail" | "cmPoPhone" | "currentFacilityLocation"
    >;
    employment: Pick<Employment, "employmentOnRelease">;
  };

export type HousingApplicationPage2ExtractedData = { readonly page: 2 } & Pick<
  ExtractedSections,
  "benefits" | "substanceUse" | "housingPreferences" | "signature"
> & {
    caseManager: Pick<CaseManager, "cmPoName">;
    employment: Pick<Employment, "employer" | "employerContact">;
    medicalSupport: MedicalSupportPage2;
  };

export type HousingApplicationPage3ExtractedData = { readonly page: 3 } & Pick<
  ExtractedSections,
  "reasonableAccommodations" | "childVisitation" | "violenceAndDischarge"
> & {
    clientIdentity: Pick<ClientIdentity, "idocNumber">;
  };

export type HousingApplicationPage4ExtractedData = { readonly page: 4 } & Pick<
  ExtractedSections,
  "supportPlan"
> & {
    medicalSupport: MedicalSupportPage4;
  };

interface PageExtractedDataMap {
  1: HousingApplicationPage1ExtractedData;
  2: HousingApplicationPage2ExtractedData;
  3: HousingApplicationPage3ExtractedData;
  4: HousingApplicationPage4ExtractedData;
}

export type HousingApplicationPageExtractedData =
  PageExtractedDataMap[keyof PageExtractedDataMap];

export type VertexAIConfig = {
  project: string;
};

export type GeminiSchema = {
  type: GeminiJsonSchemaType;
  nullable?: boolean;
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  required?: string[];
  enum?: string[];
  minimum?: number;
  maximum?: number;
};

export type PromptConfig = {
  systemPrompt: string;
  userPrompt: string;
};

export type ExtractionConfig = {
  responseSchema: GeminiSchema;
  perPageExtraction?: boolean;
  includeConfidence?: boolean;
};

export type ModelConfig = {
  modelProfile?: ModelProfileKey;
};

export type AnalyzePdfOptions = PromptConfig & ExtractionConfig & ModelConfig;

export interface IVertexAIExtractor {
  analyzeApplicationPdf<T extends object>(
    pdfBase64: string,
    options: AnalyzePdfOptions,
  ): Promise<{ data: T }>;
}

// export type VertexExtractionOutput = FlatHousingApplicationExtractedData;

/** Full GCS upload metadata (server-side logging and persistence). */
export type PreparedPdfGcsUploadResult = {
  objectKey: string;
  bucketName: string;
  contentType: string;
  fileName: string;
  sizeInBytes?: number;
  updatedAt?: string;
  signedUrl: string;
};

/** Prepared PDF read access returned to the frontend (no storage key exposed). */
export type PreparedPdfForClient = {
  signedUrl: string;
  sizeInBytes?: number;
  updatedAt?: string;
};

export type VertexExtractedApplicationData =
  FlatHousingApplicationExtractedData & {
    perPagePartials?: HousingApplicationPageExtractedData[];
  };

/** Procedure return from {@link extractWithVertexAIService}. */
export type HousingVertexExtractResult = {
  applicationId: string;
  application: VertexExtractedApplicationData;
  preparedPdf?: PreparedPdfForClient;
  // True when the source document hasn't cleared the ClamAV scan yet.
  // preparedPdf is omitted in this case; the frontend should poll the
  // application/document detail query for the signed URL once it's CLEAN.
  preparedPdfPending?: boolean;
  missingPages?: number[];
};

export type PreparedPdf = PreparedPdfForExtraction;

export interface ResolvedExtractionConfig {
  usePerPage: boolean;
  includePerPagePartials: boolean;
  includeConfidence: boolean;
  uploadPreparedPdf: boolean;
  pdfOutputMode: PdfOutputMode;
  preparationOutputMode: PdfOutputMode;
}

export type HousingVertexProcedureMeta = {
  traceId: string;
  procedureName: string;
  staffPseudonymizedId: string;
};

export type HousingVertexProcedureDeps = {
  extractor: IVertexAIExtractor;
  prisma: PrismaClient;
  log: {
    info: (message: string, metadata?: Record<string, unknown>) => void;
    error: (message: string, metadata?: Record<string, unknown>) => void;
  };
};

export type HousingVertexExtractionOptions = {
  perPageExtraction?: boolean;
  includePerPagePartials?: boolean;
  includeConfidence?: boolean;
  uploadPreparedPdf?: boolean;
  fileName?: string;
  pdfOutputMode?: PdfOutputMode;
};

export type CleanStaffDocumentForExtraction = {
  applicationId: string;
  bucketName: string;
  objectKey: string;
  fileName: string;
};
