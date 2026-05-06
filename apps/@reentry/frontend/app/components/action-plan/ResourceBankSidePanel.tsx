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

"use client";

import { useState } from "react";

import AddressSection from "~@reentry/frontend/components/action-plan/AddressSection";
import ProfileDetail from "~@reentry/frontend/components/action-plan/ProfileDetail";
import type { ResourceSearchPanelProps } from "~@reentry/frontend/components/action-plan/resource-bank/ResourceSearchPanel";
import ResourceSearchPanel from "~@reentry/frontend/components/action-plan/resource-bank/ResourceSearchPanel";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { AIDisclosure, AIDisclosureType } from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

import styles from "./styles/ResourceBankSidePanel.module.css";

interface ResourceBankSidePanelProps {
  clientRecord:
    | components["schemas"]["ClientRecordResponse"]
    | null
    | undefined;
  onAddressSave: (address: {
    street_address: string | null;
    city: string;
    state: string;
  }) => Promise<void>;
  disabled?: boolean;
  resourcesPipelineEnabled?: boolean;
  digitalResourcesEnabled?: boolean;
  searchPanelProps: ResourceSearchPanelProps;
}

const ResourceBankSidePanel = ({
  clientRecord,
  onAddressSave,
  disabled = false,
  searchPanelProps,
  resourcesPipelineEnabled,
  digitalResourcesEnabled,
}: ResourceBankSidePanelProps) => {
  const { getAccessToken } = useAuth();

  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return false;
  });

  return (
    <div className={styles["container"]}>
      <div className={styles["inner"]}>
        <ProfileDetail
          clientRecord={clientRecord}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />

        {isExpanded && (
          <>
            {resourcesPipelineEnabled && (
              <ResourceSearchPanel
                {...searchPanelProps}
                digitalResourcesEnabled={digitalResourcesEnabled}
              />
            )}
            <AddressSection
              initialAddress={clientRecord?.address}
              onSave={onAddressSave}
              getAccessToken={getAccessToken}
              disabled={disabled}
            />
          </>
        )}
      </div>

      {isExpanded && (
        <div className={styles["aiDisclosure"]}>
          <AIDisclosure type={AIDisclosureType.Sidebar} />
        </div>
      )}
    </div>
  );
};

export default ResourceBankSidePanel;
