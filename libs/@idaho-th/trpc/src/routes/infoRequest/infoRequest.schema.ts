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

import { INFO_REQUEST_MESSAGE_MAX_LENGTH } from "~@idaho-th/shared";

export const infoRequestMessageBodySchema = z
  .string()
  .trim()
  .min(1, "Message is required")
  .max(INFO_REQUEST_MESSAGE_MAX_LENGTH);

export const editProviderInfoRequestMessageSchema = z.object({
  applicationId: z.string(),
  message: infoRequestMessageBodySchema,
});

export const postStaffInfoReplySchema = z.object({
  applicationId: z.string(),
  providerApplicationId: z.string(),
  message: infoRequestMessageBodySchema,
});

export const getProviderInfoRequestSchema = z.object({
  applicationId: z.string(),
});

export const getStaffInfoRequestSchema = z.object({
  applicationId: z.string(),
  providerApplicationId: z.string(),
});

export const markStaffInfoMessagesReadSchema = z.object({
  applicationId: z.string(),
  providerApplicationId: z.string(),
});
