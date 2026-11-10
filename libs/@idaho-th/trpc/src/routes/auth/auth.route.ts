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

import { TRPCError } from "@trpc/server";

import {
  isIdocStaffEmail,
  isRecidivizStaffEmail,
  isStaffEmail,
  SIGN_IN_FLOW,
} from "~@idaho-th/shared";
import { isProvisionedProviderEmail } from "~@idaho-th/trpc/auth/isProvisionedProviderEmail";
import {
  checkRecidivizRoleChoiceRateLimiter,
  getClientIp,
  signInEmailRateLimiter,
} from "~@idaho-th/trpc/auth/rateLimit";
import { baseProcedure, publicProcedure, router } from "~@idaho-th/trpc/init";
import { getOptionalEnv } from "~@idaho-th/trpc/routes/common/env";

import {
  checkRecidivizRoleChoiceInputSchema,
  checkSignInEmailInputSchema,
} from "./auth.schema";

export const authRouter = router({
  getSession: baseProcedure.query(({ ctx }) => ({
    role: ctx.role ?? null,
    staffPseudonymizedId: ctx.staffPseudonymizedId ?? null,
    providerPseudonymizedId: ctx.providerPseudonymizedId ?? null,
  })),

  checkSignInEmail: publicProcedure
    .input(checkSignInEmailInputSchema)
    .mutation(async ({ ctx, input }) => {
      const clientIp = getClientIp(ctx.req);
      const rateLimit = signInEmailRateLimiter.consume(clientIp);

      if (!rateLimit.allowed) {
        const retryAfterSec = Math.ceil(
          (rateLimit.retryAfterMs ?? 60_000) / 1000,
        );
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many sign-in attempts. Please try again in ${retryAfterSec} seconds.`,
        });
      }

      const email = input.email.trim().toLowerCase();
      const env = getOptionalEnv("APP_ENV");
      const isStaging = env === "staging";
      const isProduction = env === "production";

      // The role chooser is offered to Recidiviz addresses only, and an
      // explicit choice from one is honoured over anything inferred below.
      const requestedProviderFlow =
        input.requestedFlow === SIGN_IN_FLOW.PROVIDER &&
        isRecidivizStaffEmail(email);
      const requestedStaffFlow =
        input.requestedFlow === SIGN_IN_FLOW.STAFF_SSO &&
        isRecidivizStaffEmail(email);

      // Someone who picked "case manager" gets the staff flow even if they
      // also hold a provider row: the chooser exists precisely because a
      // Recidiviz address can be both, so resolving it from the provider table
      // would discard the answer we just asked them for. Outside production
      // that is the one-time code; the production Actions do not handle staff
      // on the passwordless connection yet, so there it stays the database.
      if (requestedStaffFlow) {
        return {
          ok: true as const,
          flow: isProduction
            ? SIGN_IN_FLOW.STAFF_DATABASE
            : SIGN_IN_FLOW.RECIDIVIZ_STAFF_PASSWORDLESS,
        };
      }

      if (!requestedProviderFlow && isStaffEmail(email, isStaging)) {
        // Tested for production rather than against staging so an unset or
        // misspelled APP_ENV keeps the database connection instead of
        // routing to a connection only the production tenant has.
        const flow =
          isProduction && isIdocStaffEmail(email)
            ? SIGN_IN_FLOW.STAFF_SSO
            : SIGN_IN_FLOW.STAFF_DATABASE;

        return { ok: true as const, flow };
      }

      const ok = await isProvisionedProviderEmail(ctx.prisma, email);
      if (ok) {
        return { ok, flow: SIGN_IN_FLOW.PROVIDER };
      }

      // A Recidiviz address that is not a provider gets the staff connection,
      // whether or not it carries a staff grant. The grant is deliberately not
      // read here: the post-login Action asks isRecidivizStaffAuthorized over
      // /internal/check-staff-authorized and that answer is the only one that
      // grants access, so consulting it here would add nothing except an
      // answer to "is this named Recidiviz address allowlisted?" for anyone
      // who can POST an email. The two are expected to differ — the page
      // offers the staff connection, the Action denies the addresses it has no
      // grant for.
      //
      // Resolving against the provider table first is what keeps a provisioned
      // provider on a Recidiviz address reaching the provider flow, which is
      // how they signed in before the grant was removed from this decision.
      if (!requestedProviderFlow && isRecidivizStaffEmail(email)) {
        return { ok: true as const, flow: SIGN_IN_FLOW.STAFF_DATABASE };
      }

      return { ok, flow: SIGN_IN_FLOW.PROVIDER };
    }),

  checkRecidivizRoleChoice: publicProcedure
    .input(checkRecidivizRoleChoiceInputSchema)
    .query(({ ctx, input }) => {
      const clientIp = getClientIp(ctx.req);
      const rateLimit = checkRecidivizRoleChoiceRateLimiter.consume(clientIp);

      if (!rateLimit.allowed) {
        const retryAfterSec = Math.ceil(
          (rateLimit.retryAfterMs ?? 60_000) / 1000,
        );
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many requests. Please try again in ${retryAfterSec} seconds.`,
        });
      }

      // The chooser exists because a @recidiviz.org address could be signing
      // in either way, which is a property of the domain and not of any
      // grant. Answering from the grant instead would disclose allowlist
      // membership to an anonymous caller, for no gain: someone the Action
      // will deny is no worse off picking a role first.
      const email = input.email.trim().toLowerCase();
      return { showRoleChoice: isRecidivizStaffEmail(email) };
    }),
});
