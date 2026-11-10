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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { HousingApplicationForm } from "~@idaho-th/client/components/HousingApplicationForm/types";
import { generateLabels } from "~@idaho-th/client/utils/labelGenerator";

import { useHousingApplicationsStore } from "../../../../datastores/IdahoTHStoreContext";
import {
  useProvidersWithEligibility,
  useSendApplicationToProviders,
  useToggleEligibleProviderSelection,
  useUpdateHousingApplication,
} from "../../../../hooks/housingApplication";
import { useStaffApplicationById } from "../../../../hooks/useApplicationDetail";
import { HousingProvider } from "../../../../interfaces/common";
import {
  EligibilityParams,
  extractEligibilityParams,
} from "../../../../utils/eligibility";
import { SearchBarItem } from "../../../common/SearchBar";
import {
  normalizeParams,
  prepareEligibleProviders,
} from "../utils/prepareEligibleProviders";
import { splitProviders } from "./utils/splitProviders";

export type ProviderSelectionVariant = "default" | "modal";

export const useProviderSelection = (
  variant: ProviderSelectionVariant,
  onClose?: () => void,
  onSent?: (count: number) => void,
) => {
  const store = useHousingApplicationsStore();
  const { currentApplicationId } = store;

  const { data: currentApplication, isFetching: isApplicationFetching } =
    useStaffApplicationById(currentApplicationId, !!currentApplicationId);
  const form = currentApplication?.formData as
    | HousingApplicationForm
    | undefined;

  const eligibilityParams = useMemo(
    () => (form ? extractEligibilityParams(form) : null),
    [form],
  );

  const { data: providersData, isLoading: isProvidersLoading } =
    useProvidersWithEligibility(
      (eligibilityParams ?? {}) as EligibilityParams,
      undefined,
      { enabled: !!form },
    );

  const sendApplicationToProviders = useSendApplicationToProviders();
  const { mutate: updateStaffApplication } = useUpdateHousingApplication();
  const { mutate: toggleProviderSelection } =
    useToggleEligibleProviderSelection();

  const [searchQuery, setSearchQuery] = useState("");
  const [newProvider, setNewProvider] = useState<HousingProvider | null>(null);
  const hasInitializedSelection = useRef(false);
  const [isAutoSelectPending, setIsAutoSelectPending] = useState(
    variant !== "modal",
  );

  const sentProviderIds = useMemo(
    () =>
      new Set(
        (currentApplication?.providerApplications ?? []).map(
          (pa) => pa.providerId,
        ),
      ),
    [currentApplication?.providerApplications],
  );

  const eligibleProviders = useMemo(
    () => currentApplication?.eligibleProviders ?? [],
    [currentApplication?.eligibleProviders],
  );

  useEffect(() => {
    if (hasInitializedSelection.current || variant === "modal") return;
    if (!eligibilityParams || !currentApplicationId) return;
    if (isApplicationFetching) return;

    hasInitializedSelection.current = true;

    if (eligibleProviders.length === 0) {
      setIsAutoSelectPending(false);
      return;
    }

    const toAutoSelect = eligibleProviders
      .filter((row) =>
        eligibilityParams.preferredProviders.includes(row.provider.id),
      )
      .filter((row) => !sentProviderIds.has(row.provider.id))
      .filter((row) => row.isSelected == null);

    if (toAutoSelect.length === 0) {
      setIsAutoSelectPending(false);
      return;
    }

    toggleProviderSelection(
      {
        applicationId: currentApplicationId,
        providers: toAutoSelect.map((row) => ({
          providerId: row.provider.id,
          isSelected: true,
        })),
      },
      {
        onSuccess: () => {
          setIsAutoSelectPending(false);
        },
        onError: () => {
          setIsAutoSelectPending(false);
        },
      },
    );
  }, [
    eligibilityParams,
    eligibleProviders,
    sentProviderIds,
    variant,
    currentApplicationId,
    toggleProviderSelection,
    isApplicationFetching,
  ]);

  const preparedProviders = useMemo(
    () =>
      eligibilityParams
        ? prepareEligibleProviders(eligibleProviders, eligibilityParams)
        : [],
    [eligibleProviders, eligibilityParams],
  );

  const { selected, suggestions } = useMemo(
    () => splitProviders(preparedProviders, sentProviderIds),
    [preparedProviders, sentProviderIds],
  );

  const searchResults = useMemo(() => {
    const allProviders = providersData?.providers ?? [];
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return allProviders.filter((p) => p.name.toLowerCase().includes(query));
  }, [providersData?.providers, searchQuery]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleAddNewProvider = useCallback(
    (provider: HousingProvider, eligibilityOverrideNote?: string) => {
      if (!currentApplicationId) return;
      updateStaffApplication(
        {
          id: currentApplicationId,
          data: {
            addEligibleProviders: [
              {
                providerId: provider.id,
                providerLocationId: provider.providerLocation.id,
                eligibilityOverrideNote,
              },
            ],
          },
        },
        {
          onSuccess: (data) => {
            if (!data) {
              toast.error("Failed to add new provider to application.");
              return;
            }
            setNewProvider(null);
            toast.success(`${provider.name} added to selected providers.`);
          },
          onError: () =>
            toast.error("Failed to add new provider to application."),
        },
      );
    },
    [currentApplicationId, updateStaffApplication],
  );

  const handleSelectProvider = useCallback(
    (item: SearchBarItem) => {
      setSearchQuery("");
      const selectedProvider = item as HousingProvider;

      if (sentProviderIds.has(selectedProvider.id)) {
        toast("Application has already been sent to this provider.");
        return;
      }

      const isAlreadyEligible = eligibleProviders.some(
        (r) => r.provider.id === selectedProvider.id,
      );

      if (isAlreadyEligible) {
        if (selected.some((p) => p.id === selectedProvider.id)) {
          toast("Provider is already in your selected list.");
        } else if (currentApplicationId) {
          toggleProviderSelection({
            applicationId: currentApplicationId,
            providers: [{ providerId: selectedProvider.id, isSelected: true }],
          });
          toast.success(
            `${selectedProvider.name} added to selected providers.`,
          );
        }
        return;
      }

      if (!eligibilityParams) return;
      const labels = generateLabels(
        selectedProvider.providerLocation,
        normalizeParams(eligibilityParams),
      );
      const errorLabels = labels.filter((label) => label.state === "error");
      const provider = { ...selectedProvider, labels: errorLabels };

      if (errorLabels.length > 0) {
        setNewProvider(provider);
      } else {
        handleAddNewProvider(provider);
      }
    },
    [
      sentProviderIds,
      eligibleProviders,
      selected,
      currentApplicationId,
      eligibilityParams,
      toggleProviderSelection,
      handleAddNewProvider,
    ],
  );

  const handleSendToProviders = useCallback(() => {
    if (!currentApplicationId) return;
    sendApplicationToProviders.mutate(
      {
        applicationId: currentApplicationId,
        providerIds: selected.map((p) => p.id),
      },
      {
        onSuccess: () => {
          onSent?.(selected.length);
          onClose?.();
        },
        onError: () => toast.error("Failed to send application to providers."),
      },
    );
  }, [
    currentApplicationId,
    sendApplicationToProviders,
    selected,
    onSent,
    onClose,
  ]);

  const handleAddToSelected = useCallback(
    (id: string) => {
      if (!currentApplicationId) return;
      toggleProviderSelection({
        applicationId: currentApplicationId,
        providers: [{ providerId: id, isSelected: true }],
      });
    },
    [currentApplicationId, toggleProviderSelection],
  );

  const handleRemoveFromSelected = useCallback(
    (id: string) => {
      if (!currentApplicationId) return;
      toggleProviderSelection({
        applicationId: currentApplicationId,
        providers: [{ providerId: id, isSelected: false }],
      });
    },
    [currentApplicationId, toggleProviderSelection],
  );

  let sendButtonLabel = "Send Application";
  if (sendApplicationToProviders.isPending) {
    sendButtonLabel = "Sending…";
  } else if (selected.length > 0) {
    const plural = selected.length !== 1 ? "s" : "";
    sendButtonLabel = `Send Application to ${selected.length} Provider${plural}`;
  }

  const allEligibleSent =
    eligibleProviders.length > 0 &&
    eligibleProviders.every((row) => sentProviderIds.has(row.provider.id));

  return {
    form,
    eligibilityParams,
    isAutoSelectPending,
    isProvidersLoading,
    searchResults,
    newProvider,
    setNewProvider,
    selected,
    suggestions,
    eligibleProviders,
    allEligibleSent,
    isSendPending: sendApplicationToProviders.isPending,
    sendButtonLabel,
    handleSearch,
    handleSelectProvider,
    handleAddNewProvider,
    handleAddToSelected,
    handleRemoveFromSelected,
    handleSendToProviders,
  };
};
