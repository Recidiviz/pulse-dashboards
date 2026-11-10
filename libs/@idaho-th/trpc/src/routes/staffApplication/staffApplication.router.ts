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

import { router, staffProcedure } from "~@idaho-th/trpc/init";
import { duplicateHousingApplication } from "~@idaho-th/trpc/routes/staffApplication/duplicateApplication.service";
import {
  acknowledgeApprovalRevokedSchema,
  advanceApplicationStageSchema,
  createHousingApplicationSchema,
  deleteHousingApplicationSchema,
  duplicateHousingApplicationSchema,
  setParoleCommissionDecisionSchema,
  toggleEligibleProviderSelectionSchema,
  updateHousingApplicationSchema,
} from "~@idaho-th/trpc/routes/staffApplication/staffApplication.schema";
import {
  acknowledgeApprovalRevoked,
  advanceApplicationStage,
  createHousingApplication,
  deleteHousingApplication,
  setParoleCommissionDecision,
  toggleEligibleProviderSelection,
  updateHousingApplication,
} from "~@idaho-th/trpc/routes/staffApplication/staffApplication.service";

export const staffApplicationRouter = router({
  create: staffProcedure
    .input(createHousingApplicationSchema)
    .mutation(({ ctx, input }) =>
      createHousingApplication(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  update: staffProcedure
    .input(updateHousingApplicationSchema)
    .mutation(({ ctx, input }) =>
      updateHousingApplication(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  advanceStage: staffProcedure
    .input(advanceApplicationStageSchema)
    .mutation(({ ctx, input }) =>
      advanceApplicationStage(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  delete: staffProcedure
    .input(deleteHousingApplicationSchema)
    .mutation(({ ctx, input }) =>
      deleteHousingApplication(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  duplicate: staffProcedure
    .input(duplicateHousingApplicationSchema)
    .mutation(({ ctx, input }) =>
      duplicateHousingApplication(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  setParoleCommissionDecision: staffProcedure
    .input(setParoleCommissionDecisionSchema)
    .mutation(({ ctx, input }) =>
      setParoleCommissionDecision(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  acknowledgeApprovalRevoked: staffProcedure
    .input(acknowledgeApprovalRevokedSchema)
    .mutation(({ ctx, input }) =>
      acknowledgeApprovalRevoked(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  toggleEligibleProviderSelection: staffProcedure
    .input(toggleEligibleProviderSelectionSchema)
    .mutation(({ ctx, input }) =>
      toggleEligibleProviderSelection(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input,
      ),
    ),
});
