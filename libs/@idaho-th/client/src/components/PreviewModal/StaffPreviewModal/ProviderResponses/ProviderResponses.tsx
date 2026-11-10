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

import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";

import { PlusIcon } from "~@idaho-th/client/components/common/icons";
import { HousingApplicationForm } from "~@idaho-th/client/components/HousingApplicationForm/types";
import type { ProviderHousingApplication } from "~@idaho-th/client/interfaces/common";
import { palette } from "~@idaho-th/client/styles";
import { generateLabels } from "~@idaho-th/client/utils/labelGenerator";
import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { useHousingApplicationsStore } from "../../../../datastores/IdahoTHStoreContext";
import {
  useStaffApplicationById,
  useStaffApplicationProviders,
} from "../../../../hooks/useApplicationDetail";
import { extractEligibilityParams } from "../../../../utils/eligibility";
import { ActionButton } from "../../../common/buttons";
import { AddProviderModal } from "../AddProviderModal";
import { StaffClosedBanner } from "../StaffClosedBanner";
import { normalizeParams } from "../utils/prepareEligibleProviders";
import { ProviderDetailView } from "./ProviderDetails/ProviderDetailView";
import { ProviderResponseCard } from "./ProviderResponseCard";
import * as Styled from "./ProviderResponses.styles";
import { sortProviderApplications } from "./utils/sortProviders";

const Header = ({ text }: { text: string }) => (
  <Styled.ResponseHeader>
    <Styled.ResponseTitle>{text}</Styled.ResponseTitle>
  </Styled.ResponseHeader>
);

interface ProviderResponsesProps {
  onSent?: (count: number) => void;
}

export const ProviderResponses = observer(function ProviderResponses({
  onSent,
}: ProviderResponsesProps) {
  const store = useHousingApplicationsStore();
  const { currentApplicationId } = store;
  const { data: currentApplication } = useStaffApplicationById(
    currentApplicationId,
    !!currentApplicationId,
  );
  const form = currentApplication?.formData as
    | HousingApplicationForm
    | undefined;
  const isHomePlanSet = currentApplication?.homePlan != null;

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null,
  );
  const [isAddProviderModalOpen, setIsAddProviderModalOpen] = useState(false);

  const eligibilityParams = useMemo(
    () => (form ? extractEligibilityParams(form) : null),
    [form],
  );

  const normalizedParams = useMemo(
    () => (eligibilityParams ? normalizeParams(eligibilityParams) : null),
    [eligibilityParams],
  );

  const { data, isLoading, isError } = useStaffApplicationProviders(
    currentApplicationId,
    !!currentApplicationId,
  );

  const providerApplications: ProviderHousingApplication[] = useMemo(() => {
    const mapped = (data?.providers ?? []).map((app) => {
      const labels =
        normalizedParams != null
          ? generateLabels(app.providerLocation, normalizedParams)
          : [];

      return {
        ...app,
        labels,
        isPreferred:
          eligibilityParams?.preferredProviders.includes(app.providerId) ??
          false,
      };
    });

    return sortProviderApplications(
      mapped,
      currentApplication?.homePlan?.selectedProviderId,
    );
  }, [
    data,
    normalizedParams,
    eligibilityParams?.preferredProviders,
    currentApplication?.homePlan?.selectedProviderId,
  ]);

  const selectedResponse = useMemo(
    () =>
      selectedProviderId
        ? providerApplications.find(
            (p) => p.providerId === selectedProviderId,
          ) ?? null
        : null,
    [selectedProviderId, providerApplications],
  );

  const isClosed = currentApplication?.stage === APPLICATION_STAGE.CLOSED;
  const showAddProviderButton = !isHomePlanSet && !isClosed;

  if (isLoading) {
    return (
      <Styled.ProviderResponseRoot>
        <Header text="Providers" />
        <Styled.ResponsesBody>
          {isClosed && <StaffClosedBanner />}
          <Styled.StatusMessage>Loading providers...</Styled.StatusMessage>
        </Styled.ResponsesBody>
      </Styled.ProviderResponseRoot>
    );
  }

  if (isError) {
    return (
      <Styled.ProviderResponseRoot>
        <Header text="Providers" />
        <Styled.ResponsesBody>
          {isClosed && <StaffClosedBanner />}
          <Styled.StatusMessage $error>
            Failed to load providers. Please try again.
          </Styled.StatusMessage>
        </Styled.ResponsesBody>
      </Styled.ProviderResponseRoot>
    );
  }

  if (!isHomePlanSet && selectedResponse) {
    return (
      <ProviderDetailView
        provider={selectedResponse}
        onBack={() => setSelectedProviderId(null)}
      />
    );
  }

  if (providerApplications.length === 0) {
    return (
      <Styled.ProviderResponseRoot>
        <Header text="Providers" />
        <Styled.ResponsesBody>
          {isClosed && <StaffClosedBanner />}
          <Styled.StatusMessage>No provider responses.</Styled.StatusMessage>
        </Styled.ResponsesBody>
      </Styled.ProviderResponseRoot>
    );
  }

  return (
    <>
      <Styled.ProviderResponseRoot>
        <Header text={`Providers (${providerApplications.length})`} />
        <Styled.ResponsesBody>
          {isClosed && <StaffClosedBanner />}
          {providerApplications.map((providerApplication) => (
            <ProviderResponseCard
              key={providerApplication.providerId}
              providerApplication={providerApplication}
              onSelect={() =>
                setSelectedProviderId(providerApplication.providerId)
              }
            />
          ))}
        </Styled.ResponsesBody>
        {showAddProviderButton && (
          <Styled.ResponseFooter>
            <ActionButton
              variant="primary"
              startIcon={
                <PlusIcon size={17} color={palette.background.primary} />
              }
              onClick={() => setIsAddProviderModalOpen(true)}
            >
              Add Provider
            </ActionButton>
          </Styled.ResponseFooter>
        )}
      </Styled.ProviderResponseRoot>

      <AddProviderModal
        isOpen={isAddProviderModalOpen}
        onClose={() => setIsAddProviderModalOpen(false)}
        onSent={onSent}
      />
    </>
  );
});
