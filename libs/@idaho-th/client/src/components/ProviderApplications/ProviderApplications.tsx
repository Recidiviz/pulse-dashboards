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
import React, { useCallback, useState } from "react";

import { USER_ROLE } from "~@idaho-th/shared";

import {
  useHousingApplicationsStore,
  useHousingProviderStore,
  usePreviewModalStore,
} from "../../datastores/IdahoTHStoreContext";
import {
  useCurrentProvider,
  useProviderHousingApplications,
} from "../../hooks/housingApplication";
import { useResolveHousingProvider } from "../../hooks/housingProvider";
import {
  PAGE_SIZE,
  useApplicationsTableState,
} from "../../hooks/useApplicationsTableState";
import { useDelay } from "../../hooks/useDelayedTrue";
import type {
  HousingApplication,
  PreviewApplication,
} from "../../interfaces/common";
import { AppHeader } from "../HousingApplications/AppHeader/AppHeader";
import { ApplicationsTable } from "../HousingApplications/ApplicationsTable/ApplicationsTable";
import { PROVIDER_STATUS_FILTER_OPTIONS } from "../HousingApplications/ApplicationsTable/applicationsTable.filters";
import { PROVIDER_COLUMNS } from "../HousingApplications/ApplicationsTable/columns";
import { ProviderEmptyState } from "../HousingApplications/EmptyState/ProviderEmptyState";
import * as Styled from "../HousingApplications/HousingApplications.styles";
import { ProviderHeading } from "../HousingApplications/ProviderHeading";
import { getProviderInitialTab, ProviderPreviewModal } from "../PreviewModal";
import { ProviderSettingsModal } from "../ProviderSettings";

export const ProviderApplications: React.FC = observer(
  function ProviderApplications() {
    const housingProviderStore = useHousingProviderStore();
    const housingApplicationsStore = useHousingApplicationsStore();
    const previewModalStore = usePreviewModalStore();
    const { data: currentProvider, isLoading: isProviderLoading } =
      useCurrentProvider();
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<
      PreviewApplication | undefined
    >();

    const {
      sorting,
      filters,
      hasSearch,
      pagination,
      query,
      handleSearchChange,
      handleFiltersChange,
      handleSortingChange,
    } = useApplicationsTableState(USER_ROLE.PROVIDER);

    const { data, isLoading, isFetching, isPlaceholderData } =
      useProviderHousingApplications(query);
    const showFetching = useDelay(isFetching && isPlaceholderData);

    const applications = data?.items ?? [];

    // Cache hit: made available in HousingProviderGate.
    const { data: providerAssignments } = useResolveHousingProvider(true);

    const canSwitchProvider =
      (providerAssignments?.housingProviders.length ?? 0) > 1;

    const headerActions = [
      ...(canSwitchProvider
        ? [
            {
              key: "switch-provider",
              label: "Switch Provider",
              onClick: () =>
                housingProviderStore.openHousingProviderSelection(),
            },
          ]
        : []),
      {
        key: "settings",
        label: "Settings",
        onClick: () => setIsSettingsModalOpen(true),
      },
    ];

    const handleClosePreviewModal = useCallback(() => {
      setIsPreviewModalOpen(false);
      setSelectedApplication(undefined);
      housingApplicationsStore.setCurrentApplicationId(undefined);
    }, [housingApplicationsStore]);

    const handleRowClick = useCallback(
      (application: HousingApplication) => {
        // Seeding the starting tab here (rather than while the modal renders)
        // keeps the modal's first paint on the right tab without mutating
        // state in render.
        previewModalStore.setInitialTab(
          getProviderInitialTab(application.stage),
        );
        setSelectedApplication(application);
        housingApplicationsStore.setCurrentApplicationId(application.id);
        setIsPreviewModalOpen(true);
      },
      [housingApplicationsStore, previewModalStore],
    );

    return (
      <Styled.PageContainer>
        <AppHeader actions={headerActions} />
        <ProviderHeading
          title={currentProvider?.name}
          onSearchChange={handleSearchChange}
        />
        <ApplicationsTable
          applications={applications}
          columns={PROVIDER_COLUMNS}
          emptyState={<ProviderEmptyState />}
          isLoading={isLoading || isProviderLoading || showFetching}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          pagination={pagination.getProps({
            data,
            pageSize: PAGE_SIZE,
            isNavigating: isFetching && isPlaceholderData,
          })}
          filters={filters}
          hasSearch={hasSearch}
          onFiltersChange={handleFiltersChange}
          onClick={handleRowClick}
          hideDraftStageFilter
          statusFilterOptions={PROVIDER_STATUS_FILTER_OPTIONS}
          showHomePlanFilter
        />
        {isPreviewModalOpen && (
          <ProviderPreviewModal
            isOpen={isPreviewModalOpen}
            application={selectedApplication}
            onClose={handleClosePreviewModal}
          />
        )}
        {isSettingsModalOpen && (
          <ProviderSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />
        )}
      </Styled.PageContainer>
    );
  },
);
