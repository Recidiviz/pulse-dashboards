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
  providerProcedure,
  router,
  staffProcedure,
} from "~@idaho-th/trpc/init";
import {
  editProviderInfoRequestMessageSchema,
  getProviderInfoRequestSchema,
  getStaffInfoRequestSchema,
  markStaffInfoMessagesReadSchema,
  postStaffInfoReplySchema,
} from "~@idaho-th/trpc/routes/infoRequest/infoRequest.schema";
import {
  editProviderInfoRequestMessage,
  getProviderInfoRequest,
  getStaffInfoRequest,
  markStaffInfoMessagesRead,
  postStaffInfoReply,
} from "~@idaho-th/trpc/routes/infoRequest/infoRequest.service";

export const infoRequestRouter = router({
  getProviderInfoRequest: providerProcedure
    .input(getProviderInfoRequestSchema)
    .query(({ ctx, input }) =>
      getProviderInfoRequest(ctx.prisma, ctx.providerId, input.applicationId),
    ),

  editProviderInfoRequestMessage: providerProcedure
    .input(editProviderInfoRequestMessageSchema)
    .mutation(({ ctx, input }) =>
      editProviderInfoRequestMessage(
        ctx.prisma,
        ctx.providerId,
        input.applicationId,
        input.message,
      ),
    ),

  getStaffInfoRequest: staffProcedure
    .input(getStaffInfoRequestSchema)
    .query(({ ctx, input }) =>
      getStaffInfoRequest(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.applicationId,
        input.providerApplicationId,
      ),
    ),

  postStaffInfoReply: staffProcedure
    .input(postStaffInfoReplySchema)
    .mutation(({ ctx, input }) =>
      postStaffInfoReply(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.applicationId,
        input.providerApplicationId,
        input.message,
      ),
    ),

  markStaffInfoMessagesRead: staffProcedure
    .input(markStaffInfoMessagesReadSchema)
    .mutation(({ ctx, input }) =>
      markStaffInfoMessagesRead(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.applicationId,
        input.providerApplicationId,
      ),
    ),
});
