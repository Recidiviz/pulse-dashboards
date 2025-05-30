// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

export const SIMULATION_COMPARTMENTS = {
  SUPERVISION: "SUPERVISION",
  INCARCERATION: "INCARCERATION",
};

export const METRIC_MODES = {
  COUNTS: "counts",
  RATES: "rates",
};

export const FILTER_TYPES = {
  TIME_PERIOD: "timePeriod",
  GENDER: "gender",
  LEGAL_STATUS: "legalStatus",
  ADMISSION_REASON: "admissionReason",
  SUPERVISION_TYPE: "supervisionType",
  AGE_GROUP: "ageGroup",
  FACILITY: "facility",
  DISTRICT: "district",
  JUDICIAL_DISTRICT: "judicialDistrict",
  MOST_SEVERE_VIOLATION: "mostSevereViolation",
  RACE: "race",
  NUMBER_OF_VIOLATIONS: "numberOfViolations",
  SUPERVISION_LEVEL: "supervisionLevel",
} as const;

export const DIMENSION_TYPES = {
  ...FILTER_TYPES,
  PRIOR_LENGTH_OF_INCARCERATION: "priorLengthOfIncarceration",
  LENGTH_OF_STAY: "lengthOfStay",
  OFFICER_NAME: "officerName",
} as const;

export const filtersOrder = [
  FILTER_TYPES.TIME_PERIOD,
  FILTER_TYPES.FACILITY,
  FILTER_TYPES.DISTRICT,
  FILTER_TYPES.GENDER,
  FILTER_TYPES.LEGAL_STATUS,
  FILTER_TYPES.ADMISSION_REASON,
  FILTER_TYPES.JUDICIAL_DISTRICT,
  FILTER_TYPES.SUPERVISION_TYPE,
  FILTER_TYPES.SUPERVISION_LEVEL,
  FILTER_TYPES.MOST_SEVERE_VIOLATION,
  FILTER_TYPES.NUMBER_OF_VIOLATIONS,
  FILTER_TYPES.AGE_GROUP,
  FILTER_TYPES.RACE,
];

export const WORKFLOWS_METHODOLOGY_URL: Record<string, string> = {
  US_AZ:
    "https://docs.google.com/document/d/e/2PACX-1vQdaopTwajMs7exIRMLm6OtZQuPXI_gOb7W96CHNcpJ0Wez5a2qd3Ag_mpOpOcHobXo1FOnmnfF2JnL/pub",
  US_CA:
    "https://drive.google.com/file/d/1qIXF7G6CY_pVbNTNTyHvYJF1lAIgiy1n/view?usp=sharing",
  US_TN:
    "https://drive.google.com/file/d/1fkqncNb_GNYBvRfOgij4QHw4HEdkkHHz/view?usp=sharing",
  US_ND:
    "https://drive.google.com/file/d/1eHbSEOjjT9FvxffSbXOYEfOYPJheeu6t/view",
  US_IA:
    "https://drive.google.com/file/d/1a3py-AnYR5imGtCLQRxDM2-0zZdXn_xn/view",
  US_ID:
    "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
  US_ME:
    "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view?usp=sharing",
  US_MO:
    "https://drive.google.com/file/d/1IyslsgIVlpACCtEeTmJKFttEp0Fmuc9A/view?usp=sharing",
  US_MI:
    "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
  US_OR:
    "https://drive.google.com/file/d/1-V5qxOjurPggO4NrHSRBDB_pn8gmYjoa/view",
  US_PA:
    "https://docs.google.com/document/d/e/2PACX-1vSdsgMDOmD7tR_IP8NwqYggO6w9MBsAdB3jZp8ZEfWSseoGw0_6gBuF1hw6AGUskESpnA7htA8uct_y/pub",
  US_TX:
    "https://docs.google.com/document/d/e/2PACX-1vQamrgWtwG-kUfm6sBTRjRCYlFAZmMUQRHvoZ-fLU_YO0YfEElrVG7Rgq9NFdIq-NbcD_aILsZvWT2Z/pub",
  US_UT:
    "https://docs.google.com/document/d/e/2PACX-1vR3uKKRbdWXDRUz8v1km5oZNNeYuB3yUmWsZLut8RlPCAQqjUi4Cle3fXeivhYKYm8By--6nNRWFIUO/pub",
};
