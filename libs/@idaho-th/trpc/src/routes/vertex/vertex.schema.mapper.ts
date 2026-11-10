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

import {
  buildMedicalAccommodationSelections,
  COUNTY_OPTIONS,
  normalizeGenderLabelStrict,
} from "~@idaho-th/shared";
import { stripFieldConfidence } from "~@idaho-th/trpc/routes/vertex/vertex.schema.confidence";
import type {
  FlatHousingApplicationExtractedData,
  HousingApplicationExtractedData,
  PreferredDistrict,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";

const IDAHO_COUNTY_SET = new Set<string>(COUNTY_OPTIONS);

function formatDateToClient(dateString: string | null): string | null {
  if (!dateString) return null;
  const trimmed = dateString.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
  const clientMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (clientMatch) return trimmed;
  return null;
}

function normalizeCounty(county: string): string {
  const titleCase = county
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return IDAHO_COUNTY_SET.has(titleCase) ? titleCase : county.trim();
}

function toValidCounty(
  county: string,
): HousingApplicationExtractedData["legalStatus"]["legalCountyOfCrime"] {
  const normalizedCounty = normalizeCounty(county);
  if (!IDAHO_COUNTY_SET.has(normalizedCounty)) {
    throw new Error(`Invalid legalCountyOfCrime value: ${county}`);
  }
  return normalizedCounty as HousingApplicationExtractedData["legalStatus"]["legalCountyOfCrime"];
}

function normalizePreferredDistricts(raw: unknown): PreferredDistrict[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is PreferredDistrict => typeof x === "string");
  }
  if (typeof raw === "string" && raw.trim().length > 0) {
    return [raw as PreferredDistrict];
  }
  return [];
}

export function toFlatHousingApplicationData(
  data: HousingApplicationExtractedData,
): FlatHousingApplicationExtractedData {
  const stripped = stripFieldConfidence(
    data,
  ) as HousingApplicationExtractedData;
  const { medicalSupport } = stripped;
  return {
    ...stripped.caseManager,
    ...stripped.clientIdentity,
    ...stripped.emergencyContact,
    ...stripped.legalStatus,
    ...stripped.identification,
    ...stripped.military,
    ...stripped.employment,
    ...medicalSupport,
    medicalAccommodations: buildMedicalAccommodationSelections({
      prescriptionMedication: medicalSupport.prescriptionMedication,
      assistanceCbrs: medicalSupport.assistanceCbrs,
      moudMatProgram: medicalSupport.moudMatProgram,
      contagiousRowSelected: medicalSupport.contagiousDisease,
      ongoingMedicalMhTreatment: medicalSupport.ongoingMedicalMhTreatment,
    }),
    ...stripped.benefits,
    ...stripped.substanceUse,
    ...stripped.housingPreferences,
    preferredDistrict: normalizePreferredDistricts(
      stripped.housingPreferences.preferredDistrict,
    ),
    ...stripped.signature,
    ...stripped.reasonableAccommodations,
    ...stripped.childVisitation,
    ...stripped.violenceAndDischarge,
    ...stripped.supportPlan,
    dob: formatDateToClient(stripped.clientIdentity.dob),
    tpdHousingNeededDate: formatDateToClient(
      stripped.legalStatus.tpdHousingNeededDate,
    ),
    signatureDate: formatDateToClient(stripped.signature.signatureDate),
    lastUseDate: stripped.substanceUse.lastUseDate,
    gender: normalizeGenderLabelStrict(stripped.clientIdentity.gender),
    legalCountyOfCrime: toValidCounty(stripped.legalStatus.legalCountyOfCrime),
  };
}
