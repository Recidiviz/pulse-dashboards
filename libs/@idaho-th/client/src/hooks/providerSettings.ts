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

import { TRPCClientError } from "@trpc/client";

import { trpc } from "../trpc/client";
import { toastError } from "../utils/errors/toast";
import {
  createOptimisticHousingProviderUpdate,
  createOptimisticProfileUpdate,
} from "../utils/optimisticProviderDetails";
import { providerDetailsQueryUtils } from "./housingApplication";

const HOUSING_PROVIDER_SAVE_FAILED = "Failed to save provider settings.";
const PROFILE_SAVE_FAILED = "Failed to save your personal details.";

/**
 * A rename onto a name another organization already holds. The server turns the
 * unique-constraint violation into this conflict, and its message is the
 * actionable one ("choose a different name"), so it is shown as-is rather than
 * replaced by the generic failure text.
 */
function duplicateHousingProviderNameMessage(error: unknown): string | null {
  if (!(error instanceof TRPCClientError)) return null;
  if (error.data?.code !== "CONFLICT") return null;
  return error.message || null;
}

/**
 * The organization half of settings. The mutation carries no organization id —
 * the server writes whichever organization the caller is acting as.
 *
 * onError opts this out of the global toast, and the editor has already closed,
 * so the rollback must toast or the failure goes unnoticed.
 */
export const useUpdateHousingProvider = () => {
  const utils = trpc.useUtils();
  const optimistic = createOptimisticHousingProviderUpdate(
    providerDetailsQueryUtils(utils),
  );
  return trpc.housingApplication.updateHousingProvider.useMutation({
    onMutate: optimistic.onMutate,
    onError: (error, variables, context) => {
      optimistic.onError(error, variables, context);
      toastError(
        duplicateHousingProviderNameMessage(error) ??
          HOUSING_PROVIDER_SAVE_FAILED,
      );
    },
    onSettled: () => {
      void utils.housingApplication.getProviderDetails.invalidate();
      // The organization name is also what the portal header shows.
      void utils.housingApplication.getCurrentProvider.invalidate();
    },
  });
};

/**
 * The person half of settings. These are the same in every organization the
 * caller manages, so nothing organization-scoped is invalidated here.
 */
export const useUpdateProviderProfile = () => {
  const utils = trpc.useUtils();
  const optimistic = createOptimisticProfileUpdate(
    providerDetailsQueryUtils(utils),
  );
  return trpc.housingApplication.updateProviderProfile.useMutation({
    onMutate: optimistic.onMutate,
    onError: (error, variables, context) => {
      optimistic.onError(error, variables, context);
      toastError(PROFILE_SAVE_FAILED);
    },
    onSettled: () => {
      void utils.housingApplication.getProviderDetails.invalidate();
    },
  });
};
