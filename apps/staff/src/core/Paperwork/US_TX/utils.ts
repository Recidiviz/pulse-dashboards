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

import type { UsTxArsErsSharedDraftData } from "../../../WorkflowsStore/Opportunity/UsTx/UsTxArsErsSharedUtils";
import { SetFunc } from "../PDFFormFiller";

/**
 * Sets the PDF fields shared between the ARS and ERS forms: the client header
 * (name, TDCJ/SID, eligibility month) and the 5 signature blocks (supervising
 * officer, unit supervisor, parole supervisor, assistant region director,
 * region director).
 */
export function setArsErsSharedPDFFields(
  formData: Partial<UsTxArsErsSharedDraftData>,
  set: SetFunc,
): void {
  set("clientName", formData.clientName);
  set("tdcjNumberAndSid", formData.tdcjNumberAndSid);
  set("eligibilityMonthString", formData.eligibilityMonthString);

  set("officerName", formData.officerName);
  set("supervisingOfficerDate", formData.supervisingOfficerDate);
  set(
    "supervisingOfficerRecommendCheck",
    formData.supervisingOfficerRecommendCheckYes,
  );
  set(
    "supervisingOfficerRecommendCheckNo",
    formData.supervisingOfficerRecommendCheckNo,
  );
  set("supervisingOfficerSignature", formData.supervisingOfficerSignature);
  set("supervisingOfficerRemarks", formData.supervisingOfficerRemarks);

  set("unitSupervisorName", formData.unitSupervisorName);
  set(
    "unitSupervisorConcurWithSupervisingOfficerCheck",
    formData.unitSupervisorConcurWithSupervisingOfficerCheckYes,
  );
  set(
    "unitSupervisorConcurWithSupervisingOfficerCheckNo",
    formData.unitSupervisorConcurWithSupervisingOfficerCheckNo,
  );
  set("unitSupervisorDate", formData.unitSupervisorDate);
  set("unitSupervisorSignature", formData.unitSupervisorSignature);
  set("unitSupervisorRemarks", formData.unitSupervisorRemarks);

  set("paroleSupervisorName", formData.paroleSupervisorName);
  set("paroleSupervisorDate", formData.paroleSupervisorDate);
  set(
    "paroleSupervisorConcurWithSupervisingOfficerCheck",
    formData.paroleSupervisorConcurWithSupervisingOfficerCheckYes,
  );
  set(
    "paroleSupervisorConcurWithSupervisingOfficerCheckNo",
    formData.paroleSupervisorConcurWithSupervisingOfficerCheckNo,
  );
  set("paroleSupervisorSignature", formData.paroleSupervisorSignature);
  set("paroleSupervisorRemarks", formData.paroleSupervisorRemarks);

  set("assistantRegionDirectorName", formData.assistantRegionDirectorName);
  set("assistantRegionDirectorDate", formData.assistantRegionDirectorDate);
  set(
    "assistantRegionDirectorConcurWithSupervisingOfficerCheck",
    formData.assistantRegionDirectorConcurWithSupervisingOfficerCheckYes,
  );
  set(
    "assistantRegionDirectorConcurWithSupervisingOfficerCheckNo",
    formData.assistantRegionDirectorConcurWithSupervisingOfficerCheckNo,
  );
  set(
    "assistantRegionDirectorSignature",
    formData.assistantRegionDirectorSignature,
  );
  set(
    "assistantRegionDirectorRemarks",
    formData.assistantRegionDirectorRemarks,
  );

  set("regionDirectorName", formData.regionDirectorName);
  set("regionDirectorDate", formData.regionDirectorDate);
  set(
    "regionDirectorConcurWithSupervisingOfficerCheck",
    formData.regionDirectorConcurWithSupervisingOfficerCheckYes,
  );
  set(
    "regionDirectorConcurWithSupervisingOfficerCheckNo",
    formData.regionDirectorConcurWithSupervisingOfficerCheckNo,
  );
  set("regionDirectorSignature", formData.regionDirectorSignature);
  set("regionDirectorRemarks", formData.regionDirectorRemarks);
}

/**
 * Wraps {@link import("pdf-lib").PDFForm.flatten} with a try/catch since
 * flatten() can throw on certain PDFs but the form output is still usable.
 */
export function flattenPDFFormSafely(form: { flatten: () => void }): void {
  try {
    form.flatten();
  } catch (error) {
    console.error("Error flattening form:", error);
  }
}
