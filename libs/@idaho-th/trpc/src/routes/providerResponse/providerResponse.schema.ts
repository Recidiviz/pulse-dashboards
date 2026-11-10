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

import { PROVIDER_RESPONSE_TYPE } from "~@idaho-th/shared";
import { infoRequestMessageBodySchema } from "~@idaho-th/trpc/routes/infoRequest/infoRequest.schema";

export const submitProviderResponseSchema = z.discriminatedUnion("response", [
  z.object({
    applicationId: z.string(),
    response: z.literal(PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE),
  }),
  z.object({
    applicationId: z.string(),
    response: z.literal(PROVIDER_RESPONSE_TYPE.DECLINE),
  }),
  z.object({
    applicationId: z.string(),
    response: z.literal(PROVIDER_RESPONSE_TYPE.INFO_NEEDED),
    message: infoRequestMessageBodySchema,
  }),
  z.object({
    applicationId: z.string(),
    response: z.literal(PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL),
    message: infoRequestMessageBodySchema,
  }),
]);
