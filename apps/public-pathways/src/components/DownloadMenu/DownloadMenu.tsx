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
import { useState } from "react";

import { Dropdown } from "~design-system";

import { useRootStore } from "../StoreProvider";
import {
  DownloadMenuItem,
  DownloadMenuItemDivider,
  DownloadMenuItemHeading,
  DownloadMenuItemSubheading,
  DownloadMenuLabel,
  DownloadMenuPanel,
  DownloadToggle,
} from "./DownloadMenu.styles";
import { IndividualLevelDataFlow } from "./IndividualLevelDataFlow";

export const DownloadMenu = observer(function DownloadMenu() {
  const { analyticsStore, metricsStore } = useRootStore();
  const [isIndividualLevelFlowOpen, setIsIndividualLevelFlowOpen] =
    useState(false);

  const handleDownloadChartData = () => {
    metricsStore.download();
    analyticsStore.trackDownloadClicked({
      metricId: metricsStore.current.id,
      downloadType: "chart_data",
    });
  };

  const handleAgreeAndDownload = (snapshotDate: Date | null) => {
    setIsIndividualLevelFlowOpen(false);
    analyticsStore.trackDownloadClicked({
      metricId: metricsStore.current.id,
      downloadType: "individual_level_data",
    });
    metricsStore
      .downloadIndividualLevelData(snapshotDate)
      .catch((error: unknown) => {
        console.error(error);
      });
  };

  return (
    <>
      <Dropdown>
        <DownloadToggle type="button" kind="primary" shape="pill" showCaret>
          Download
        </DownloadToggle>
        <DownloadMenuPanel alignment="right" ariaLabel="Download options">
          <DownloadMenuLabel>Download</DownloadMenuLabel>
          <DownloadMenuItem onClick={handleDownloadChartData}>
            <DownloadMenuItemHeading>Chart data</DownloadMenuItemHeading>
            <DownloadMenuItemSubheading>
              What&apos;s shown now, with your filters applied.
            </DownloadMenuItemSubheading>
          </DownloadMenuItem>
          <DownloadMenuItemDivider />
          <DownloadMenuItem onClick={() => setIsIndividualLevelFlowOpen(true)}>
            <DownloadMenuItemHeading>
              Individual-level data
            </DownloadMenuItemHeading>
            <DownloadMenuItemSubheading>
              Every record we receive — all data dimensions, unfiltered.
            </DownloadMenuItemSubheading>
          </DownloadMenuItem>
        </DownloadMenuPanel>
      </Dropdown>
      <IndividualLevelDataFlow
        isOpen={isIndividualLevelFlowOpen}
        onCancel={() => setIsIndividualLevelFlowOpen(false)}
        onAgree={handleAgreeAndDownload}
      />
    </>
  );
});
