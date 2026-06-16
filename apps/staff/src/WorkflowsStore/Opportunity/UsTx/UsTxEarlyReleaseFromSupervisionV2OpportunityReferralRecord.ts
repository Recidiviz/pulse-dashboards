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

import { z } from "zod";

import {
  dateStringSchemaWithoutTimeShift,
  opportunitySchemaBase,
} from "~datatypes";

import type { UsTxArsErsSharedDraftData } from "./UsTxArsErsSharedUtils";

/**
 * Shared `formInformation` shape for the US_TX ARS and ERS forms. Both forms
 * pull the same staff hierarchy and TDCJ number off the referral record.
 */
export const usTxArsErsSharedFormInformationSchema = z
  .object({
    tdcjNumber: z.string(),
    unitSupervisor: z.string().nullish(),
    paroleSupervisor: z.string().nullish(),
    assistantRegionDirector: z.string().nullish(),
    regionDirector: z.string().nullish(),
  })
  .partial();

export type UsTxArsErsSharedFormInformation = z.infer<
  typeof usTxArsErsSharedFormInformationSchema
>;

export const usTxEarlyReleaseFromSupervisionV2Schema =
  opportunitySchemaBase.extend({
    formInformation: usTxArsErsSharedFormInformationSchema,
    metadata: z
      .object({
        grantedAt: dateStringSchemaWithoutTimeShift.nullish(),
      })
      .passthrough(),
  });

export type UsTxEarlyReleaseFromSupervisionV2ReferralRecord = z.infer<
  typeof usTxEarlyReleaseFromSupervisionV2Schema
>;

export type UsTxEarlyReleaseFromSupervisionV2DraftData =
  UsTxArsErsSharedDraftData & {
    atLeastHalfTimeCheck: boolean;
    comment1: string;
    minimumThreeYearsSupervisionCheck: boolean;
    comment2: string;
    goodFaithFeesAndEducationCheck: boolean;
    comment3: string;
    comment4: string;
    comment5: string;
    noViolationsCertificateCheck: boolean;
    comment6: string;
    comment7: string;
  };
