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

import { keepPreviousData } from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { PROVIDER_RESPONSE_TYPE } from "~@idaho-th/shared";
import { SearchParams } from "~@idaho-th/shared/types";
import type { AppRouter } from "~@idaho-th/trpc-types";

import type { ApplicationFilters } from "../components/HousingApplications/ApplicationsTable/applicationsTable.filters";
import { trpc } from "../trpc/client";
import { EligibilityParams } from "../utils/eligibility";
import { getSubmitProviderResponseErrorMessage } from "../utils/errors/providerResponse.errors";
import { toastError } from "../utils/errors/toast";
import { createOptimisticLocationUpdate } from "../utils/optimisticProviderDetails";
import { createOptimisticReleaseTaskToggle } from "../utils/optimisticReleaseTasks";
export type ApplicationsQueryParams = {
  pagination: {
    cursor?: string;
    pageSize: number;
  };
  sorting?: {
    field: string;
    direction: "asc" | "desc";
  };
  search?: Record<string, { contains: string; mode: "insensitive" }>;
  filters?: ApplicationFilters;
};

export const useStaffHousingApplications = (
  params: ApplicationsQueryParams,
) => {
  return trpc.housingApplication.getByStaff.useQuery(params, {
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
};

export const useProvidersWithEligibility = (
  eligibilityParams: EligibilityParams,
  search?: SearchParams,
  options?: { enabled?: boolean },
) => {
  return trpc.housingApplication.getProvidersWithEligibility.useQuery(
    { eligibilityParams, search },
    {
      enabled: options?.enabled,
    },
  );
};

export const useSubmitDraftHousingApplication = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.submitDraft.useMutation({
    onSuccess: (_, variables) => {
      void utils.housingApplication.getByStaff.invalidate();
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.id,
      });
    },
  });
};

export const useUpdateHousingApplication = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.update.useMutation({
    meta: { suppressGlobalError: true },
    onSuccess: (_, variables) => {
      void utils.housingApplication.getByStaff.invalidate();
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.id,
      });
      void utils.timeline.getForStaff.invalidate({
        applicationId: variables.id,
      });
    },
  });
};

export const useDeleteHousingApplication = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.delete.useMutation({
    onSuccess: () => {
      void utils.housingApplication.getByStaff.invalidate();
    },
  });
};

export const useExtractContent = () => {
  return trpc.vertex.extractWithVertexAI.useMutation();
};

type GetProvidersInput =
  inferRouterInputs<AppRouter>["housingApplication"]["getProviders"];

type GetProvidersOutput =
  inferRouterOutputs<AppRouter>["housingApplication"]["getProviders"];

export const useHousingProviders = (
  params: GetProvidersInput = {},
): {
  providers: GetProvidersOutput["providers"];
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
} => {
  const { data, isPending, isLoading, isError } =
    trpc.housingApplication.getProviders.useQuery({
      search: params.search,
      distinct: params.distinct ?? ["name"],
    });
  return { providers: data?.providers ?? [], isPending, isLoading, isError };
};

export const useSendApplicationToProviders = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.sendToProviders.useMutation({
    onSuccess: (_, variables) => {
      void utils.housingApplication.getByStaff.invalidate();
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getStaffApplicationProviders.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.timeline.getForStaff.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
};

export const useProviderHousingApplications = (
  params: ApplicationsQueryParams,
) => {
  return trpc.housingApplication.getProviderApplications.useQuery(params, {
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
};

export const useCurrentProvider = () => {
  return trpc.housingApplication.getCurrentProvider.useQuery(undefined);
};

export type ProviderDetails =
  inferRouterOutputs<AppRouter>["housingApplication"]["getProviderDetails"];

export const useProviderDetails = (enabled: boolean) => {
  return trpc.housingApplication.getProviderDetails.useQuery(undefined, {
    enabled,
  });
};

// tRPC's query utils need the (undefined) input key explicitly; this adapts
// them to the input-free shape the optimistic helpers expect.
export const providerDetailsQueryUtils = (
  utils: ReturnType<typeof trpc.useUtils>,
) => ({
  cancel: () => utils.housingApplication.getProviderDetails.cancel(),
  getData: () => utils.housingApplication.getProviderDetails.getData(),
  setData: (
    updater:
      | ProviderDetails
      | undefined
      | ((old: ProviderDetails | undefined) => ProviderDetails | undefined),
  ) => utils.housingApplication.getProviderDetails.setData(undefined, updater),
});

// The organization and personal-details mutations live in hooks/providerSettings.

export const useUpdateProviderLocation = () => {
  const utils = trpc.useUtils();
  const optimistic = createOptimisticLocationUpdate(
    providerDetailsQueryUtils(utils),
  );
  return trpc.housingApplication.updateProviderLocation.useMutation({
    onMutate: optimistic.onMutate,
    onError: (error, variables, context) => {
      optimistic.onError(error, variables, context);
      toastError("Failed to save location.");
    },
    onSettled: () => {
      void utils.housingApplication.getProviderDetails.invalidate();
    },
  });
};

export const useSubmitProviderResponse = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.submitProviderResponse.useMutation({
    meta: { suppressGlobalError: true },
    onSuccess: (_, variables) => {
      void utils.housingApplication.getProviderApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getProviderApplications.invalidate();
      void utils.timeline.getForProvider.invalidate({
        applicationId: variables.applicationId,
      });

      if (variables.response === PROVIDER_RESPONSE_TYPE.INFO_NEEDED) {
        void utils.housingApplication.getProviderInfoRequest.invalidate({
          applicationId: variables.applicationId,
        });
      }
    },
    onError: (error, variables) => {
      toastError(getSubmitProviderResponseErrorMessage(error));
      // The response may have been rejected because the application moved on,
      // so the views are re-read to show its real state.
      void utils.housingApplication.getProviderApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getProviderApplications.invalidate();
    },
  });
};

export const useEditProviderInfoRequestMessage = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.editProviderInfoRequestMessage.useMutation({
    onSuccess: (_, variables) => {
      void utils.housingApplication.getProviderInfoRequest.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
};

export const useProviderInfoRequests = (
  applicationId: string | undefined,
  enabled: boolean,
) => {
  return trpc.housingApplication.getProviderInfoRequest.useQuery(
    { applicationId: applicationId ?? "" },
    { enabled: !!applicationId && enabled, staleTime: 0 },
  );
};
export function usePostStaffInfoReply() {
  const utils = trpc.useUtils();
  return trpc.housingApplication.postStaffInfoReply.useMutation({
    onSuccess: (_, variables) => {
      void utils.housingApplication.getStaffApplicationProviders.invalidate();
      void utils.housingApplication.getByStaff.invalidate();
      void utils.timeline.getForStaff.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
}

export const useAcceptProviderAsHomePlan = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.acceptProviderAsHomePlan.useMutation({
    onSuccess: (_, variables) => {
      void utils.housingApplication.getStaffHomePlan.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getStaffApplicationProviders.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getByStaff.invalidate();
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.timeline.getForStaff.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
};

export const useStaffHomePlan = (applicationId: string | undefined) => {
  return trpc.housingApplication.getStaffHomePlan.useQuery(
    { applicationId: applicationId ?? "" },
    {
      enabled: !!applicationId,
      staleTime: 0,
    },
  );
};

export const useSetManualAddressHomePlan = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.setManualAddressHomePlan.useMutation({
    onSuccess: (_, variables) => {
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getStaffHomePlan.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getStaffApplicationProviders.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getByStaff.invalidate();
      void utils.timeline.getForStaff.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
};

export const useSetHomePlanApprovals = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.setHomePlanApprovals.useMutation({
    onSuccess: (_, variables) => {
      void utils.housingApplication.getStaffHomePlan.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getByStaff.invalidate();
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.timeline.getForStaff.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
};

export const useSetParoleCommissionDecision = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.setParoleCommissionDecision.useMutation({
    onSuccess: (_, variables) => {
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getStaffHomePlan.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getByStaff.invalidate();
      void utils.timeline.getForStaff.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
};

export const useProviderHomePlan = (
  applicationId: string | undefined,
  enabled: boolean,
) => {
  return trpc.housingApplication.getProviderHomePlan.useQuery(
    { applicationId: applicationId ?? "" },
    { enabled: !!applicationId && enabled, staleTime: 0 },
  );
};

export const useToggleStaffHomePlanReleaseTask = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.toggleStaffHomePlanReleaseTask.useMutation({
    ...createOptimisticReleaseTaskToggle(
      utils.housingApplication.getStaffHomePlan,
    ),
    onSettled: (_data, _error, variables) => {
      void utils.housingApplication.getStaffHomePlan.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getByStaff.invalidate();
      void utils.timeline.getForStaff.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
};

export const useToggleProviderHomePlanReleaseTask = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.toggleProviderHomePlanReleaseTask.useMutation({
    ...createOptimisticReleaseTaskToggle(
      utils.housingApplication.getProviderHomePlan,
    ),
    onSettled: (_data, _error, variables) => {
      void utils.housingApplication.getProviderHomePlan.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getProviderApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getProviderApplications.invalidate();
      void utils.timeline.getForProvider.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
};

export const useUpdateProviderHomePlanReleaseTaskDetail = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.updateProviderHomePlanReleaseTaskDetail.useMutation(
    {
      onError: () => toastError("Failed to save release task details."),
      onSettled: (_data, _error, variables) => {
        void utils.housingApplication.getProviderHomePlan.invalidate({
          applicationId: variables.applicationId,
        });
        void utils.housingApplication.getStaffHomePlan.invalidate({
          applicationId: variables.applicationId,
        });
      },
    },
  );
};

export const useUpdateHomePlanReleaseTaskDetail = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.updateHomePlanReleaseTaskDetail.useMutation({
    onError: () => toastError("Failed to save release task details."),
    onSettled: (_data, _error, variables) => {
      void utils.housingApplication.getStaffHomePlan.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getProviderHomePlan.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.timeline.getForStaff.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
};

export const useAdvanceApplicationStage = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.advanceStage.useMutation({
    onSuccess: (data) => {
      void utils.housingApplication.getByStaff.invalidate();
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: data.applicationId,
      });
      void utils.housingApplication.getStaffHomePlan.invalidate({
        applicationId: data.applicationId,
      });
      void utils.timeline.getForStaff.invalidate({
        applicationId: data.applicationId,
      });
      void utils.housingApplication.getStaffApplicationProviders.invalidate({
        applicationId: data.applicationId,
      });
    },
  });
};

export const useDuplicateHousingApplication = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.duplicate.useMutation({
    // Errors are surfaced with a local toast at the call site instead.
    meta: { suppressGlobalError: true },
    onSuccess: (_, variables) => {
      void utils.housingApplication.getByStaff.invalidate();
      // The original is now closed or done, and has a duplicate.
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
    },
  });
};

export const useAcknowledgeApprovalRevoked = () => {
  const utils = trpc.useUtils();
  return trpc.housingApplication.acknowledgeApprovalRevoked.useMutation({
    onSuccess: (_, variables) => {
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.applicationId,
      });
      void utils.housingApplication.getByStaff.invalidate();
    },
  });
};

export const useToggleEligibleProviderSelection = () => {
  const utils = trpc.useUtils();

  return trpc.housingApplication.toggleEligibleProviderSelection.useMutation({
    meta: { suppressGlobalError: true },
    onSuccess: (_, variables) =>
      utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId: variables.applicationId,
      }),
    onError: () => {
      toastError("Failed to update provider selection.");
    },
  });
};
