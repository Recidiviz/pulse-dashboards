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

import { z } from "zod";

import { supervisionOfficerSupervisorSchema } from "~datatypes";

export const userInfoSchema = z
  .discriminatedUnion("role", [
    z.object({
      role: z.literal("supervision_officer_supervisor"),
      entity: supervisionOfficerSupervisorSchema,
    }),
    z.object({ role: z.null(), entity: z.null() }),
  ])
  .and(
    // TODO(#4651): Remove union type once backend sends metadata
    z.union([
      z.object({
        hasSeenOnboarding: z.boolean(),
        metadata: z.undefined(),
      }),
      z.object({
        hasSeenOnboarding: z.undefined(),
        metadata: z.object({
          hasSeenOnboarding: z.boolean(),
        }),
      }),
    ]),
  )
  .transform(({ hasSeenOnboarding, metadata, ...rest }) => ({
    metadata: {
      hasSeenOnboarding:
        metadata?.hasSeenOnboarding ?? hasSeenOnboarding ?? false, // this "false" should never occur due to the definitions above, but typescript is only _so_ smart, so provide it as a fallback
    },
    ...rest,
  }));

export type UserInfo = z.infer<typeof userInfoSchema>;
export type RawUserInfo = z.input<typeof userInfoSchema>;
