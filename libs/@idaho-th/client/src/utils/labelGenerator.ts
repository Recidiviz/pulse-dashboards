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

import { LABEL_STATE } from "~@idaho-th/client/constants/label";
import {
  acceptsFemale,
  acceptsMale,
  type EligibilityParams,
  isFemale,
  isMale,
  normalizeEligibilityParams,
} from "~@idaho-th/shared";

import { HousingProviderLocation, ProviderLabel } from "../interfaces/common";

export const PROVIDER_LABELS = {
  gender: {
    allGenders: "All genders",
    menOnly: "Men only",
    womenOnly: "Women only",
  },
  rider: {
    accepts: "Accepts riders",
    rejects: "No riders",
  },
  sexOffender: {
    accepts: "Accepts sex offenders",
    rejects: "No sex offenders",
  },
  faithBased: {
    yes: "Faith-based",
    no: "Not faith-based",
  },
} as const;

const DISPLAY_ORDER = {
  district: 1,
  gender: 2,
  rider: 3,
  sexOffender: 4,
  faithBased: 5,
} as const;

const STATE_ORDER: Record<ProviderLabel["state"], number> = {
  error: 0,
  warning: 1,
  match: 2,
};

function buildGenderLabel(
  location: HousingProviderLocation,
  params: EligibilityParams,
): ProviderLabel {
  const menAccepted = acceptsMale(location);
  const womenAccepted = acceptsFemale(location);

  const bothAccepted = menAccepted && womenAccepted;
  const menOnly = menAccepted && !womenAccepted;
  const womenOnly = !menAccepted && womenAccepted;

  let genderText: string;
  let genderState: ProviderLabel["state"];

  if (bothAccepted) {
    genderText = PROVIDER_LABELS.gender.allGenders;
    genderState = LABEL_STATE["match"];
  } else if (menOnly) {
    genderText = PROVIDER_LABELS.gender.menOnly;
    if (params.gender) {
      genderState = isMale(params.gender)
        ? LABEL_STATE["match"]
        : LABEL_STATE["error"];
    } else {
      genderState = LABEL_STATE["warning"];
    }
  } else if (womenOnly) {
    genderText = PROVIDER_LABELS.gender.womenOnly;
    if (params.gender) {
      genderState = isFemale(params.gender)
        ? LABEL_STATE["match"]
        : LABEL_STATE["error"];
    } else {
      genderState = LABEL_STATE["warning"];
    }
  } else {
    // No gender data on the location — treat as accepting all.
    genderText = PROVIDER_LABELS.gender.allGenders;
    genderState = LABEL_STATE["match"];
  }

  return {
    text: genderText,
    state: genderState,
    displayOrder: DISPLAY_ORDER.gender,
  };
}

function buildRestrictionLabel(
  param: boolean | null,
  locationAccepts: boolean,
  acceptsText: string,
  rejectsText: string,
  displayOrder: number,
): ProviderLabel | null {
  const isRelevant = param === true || (param === null && !locationAccepts);
  if (!isRelevant) return null;

  return locationAccepts
    ? { text: acceptsText, state: LABEL_STATE["match"], displayOrder }
    : {
        text: rejectsText,
        state: param === true ? LABEL_STATE["error"] : LABEL_STATE["warning"],
        displayOrder,
      };
}

export function filterMatchLabels(labels: ProviderLabel[]): ProviderLabel[] {
  return labels.filter((l) => l.state === LABEL_STATE.match);
}

export function hasRequirementConflicts(
  location: HousingProviderLocation,
  params: EligibilityParams,
): boolean {
  const labels = generateLabels(location, normalizeEligibilityParams(params));
  return labels.some((label) => label.state !== LABEL_STATE.match);
}

const CONFLICT_FACTOR_LABELS = {
  sexOffender: "Sex offender",
} as const;

export function getConflictFactors(
  location: HousingProviderLocation,
  params: EligibilityParams,
): string[] {
  const factors: string[] = [];

  const gender = params.gender?.trim();
  if (gender) factors.push(gender);

  if (params.preferredDistricts.length > 0) {
    factors.push(params.preferredDistricts.join(", "));
  }

  if (params.isSexOffender === true && !location.acceptsSexOffenders) {
    factors.push(CONFLICT_FACTOR_LABELS.sexOffender);
  }

  return factors;
}

export function generateLabels(
  location: HousingProviderLocation,
  params: EligibilityParams,
): ProviderLabel[] {
  const labels: ProviderLabel[] = [];

  if (params.preferredDistricts && params.preferredDistricts.length > 0) {
    const district = location.district ?? "";
    const isMatched = params.preferredDistricts.includes(
      district.trim().toLowerCase(),
    );
    labels.push({
      text: district,
      state: isMatched ? LABEL_STATE["match"] : LABEL_STATE["error"],
      displayOrder: DISPLAY_ORDER.district,
    });
  }

  labels.push(buildGenderLabel(location, params));

  const riderLabel = buildRestrictionLabel(
    params.isRider,
    location.acceptsRiders,
    PROVIDER_LABELS.rider.accepts,
    PROVIDER_LABELS.rider.rejects,
    DISPLAY_ORDER.rider,
  );
  if (riderLabel) labels.push(riderLabel);

  const sexOffenderLabel = buildRestrictionLabel(
    params.isSexOffender,
    location.acceptsSexOffenders,
    PROVIDER_LABELS.sexOffender.accepts,
    PROVIDER_LABELS.sexOffender.rejects,
    DISPLAY_ORDER.sexOffender,
  );
  if (sexOffenderLabel) labels.push(sexOffenderLabel);

  if (params.faithBasedPreferred === true) {
    labels.push({
      text: location.faithBased
        ? PROVIDER_LABELS.faithBased.yes
        : PROVIDER_LABELS.faithBased.no,
      state: location.faithBased
        ? LABEL_STATE["match"]
        : LABEL_STATE["warning"],
      displayOrder: DISPLAY_ORDER.faithBased,
    });
  }

  labels.sort((a, b) => {
    const stateDiff = STATE_ORDER[a.state] - STATE_ORDER[b.state];
    if (stateDiff !== 0) return stateDiff;
    return a.displayOrder - b.displayOrder;
  });

  return labels;
}
