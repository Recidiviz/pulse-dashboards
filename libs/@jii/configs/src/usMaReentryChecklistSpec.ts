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

/**
 * Configuration and types relating to the Reentry Checklist for Massachusetts.
 *
 * This file should only contain internal identifiers, not copy. All copy should be
 * in the @jii/translation library.
 */

import { ShowIf } from "./showIf";
import { ReentryQuestionnaireQuestionId } from "./usMaReentryQuestionnaireSpec";

export type ReentryChecklistItemConfig = {
  showIf?: ShowIf<ReentryQuestionnaireQuestionId>;
  // TODO(OBT-50538): add time bands based on parole/expiry decision
};

export const reentryChecklistItemIds = [
  "BACKUP_HOUSING",
  "FINALIZED_HOUSING",
  "HOUSING_PLAN_AGREEMENT",
  "HAS_RENT_PAYMENT_PLAN",
  "HAS_HOUSING_LOCATION_PREFERENCE",
  "RESEARCHED_HOUSING_RESOURCES",
  "DISCUSSED_HOUSING_WITH_SPECIALIST",
  "HAS_HOUSING_PROGRAM_RENT_PLAN",
  "HAS_PAID_HOUSING_PROGRAM_DEPOSIT",
] as const;
export type ReentryChecklistItemId = (typeof reentryChecklistItemIds)[number];

export const reentryChecklistConfig: Record<
  ReentryChecklistItemId,
  ReentryChecklistItemConfig
> = {
  BACKUP_HOUSING: {},
  FINALIZED_HOUSING: {},
  HOUSING_PLAN_AGREEMENT: {
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "FAMILY",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "FRIENDS_OR_ROOMMATES",
        },
      ],
    },
  },
  HAS_RENT_PAYMENT_PLAN: {
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "FAMILY",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "FRIENDS_OR_ROOMMATES",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "OWN_PLACE",
        },
      ],
    },
  },
  HAS_HOUSING_LOCATION_PREFERENCE: {
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "LONG_TERM_RESIDENTIAL_PROGRAM",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "SOBER_OR_ROOMING_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "OWN_PLACE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "UNSURE",
        },
      ],
    },
  },
  RESEARCHED_HOUSING_RESOURCES: {
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "LONG_TERM_RESIDENTIAL_PROGRAM",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "SOBER_OR_ROOMING_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "UNSURE",
        },
      ],
    },
  },
  DISCUSSED_HOUSING_WITH_SPECIALIST: {
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "LONG_TERM_RESIDENTIAL_PROGRAM",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "SOBER_OR_ROOMING_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "UNSURE",
        },
      ],
    },
  },
  HAS_HOUSING_PROGRAM_RENT_PLAN: {
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "LONG_TERM_RESIDENTIAL_PROGRAM",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "SOBER_OR_ROOMING_HOUSE",
        },
      ],
    },
  },
  HAS_PAID_HOUSING_PROGRAM_DEPOSIT: {
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "LONG_TERM_RESIDENTIAL_PROGRAM",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "SOBER_OR_ROOMING_HOUSE",
        },
      ],
    },
  },
};
