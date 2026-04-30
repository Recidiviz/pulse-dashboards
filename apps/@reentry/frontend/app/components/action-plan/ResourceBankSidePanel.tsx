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

import { $api } from "~@reentry/frontend/api";
import AddressSection from "~@reentry/frontend/components/action-plan/AddressSection";
import ProfileDetail from "~@reentry/frontend/components/action-plan/ProfileDetail";
import ResourceSearchPanel from "~@reentry/frontend/components/action-plan/resource-bank/ResourceSearchPanel";
import { ResourceWithMeta } from "~@reentry/frontend/hooks/resourceBank.types";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { AIDisclosure, AIDisclosureType } from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

import styles from "./styles/ResourceBankSidePanel.module.css";
import { SectionTitle } from "./types";

type ResourceBankSidePanelProps = {
  addResource: (sectionTitle: string, resource: ResourceWithMeta) => void;
  clientRecord: components["schemas"]["ClientRecordResponse"] | null;
  disabled?: boolean;
  planId: string;
  sectionTitles: SectionTitle[];
};

const ResourceBankSidePanel = ({
  addResource,
  clientRecord,
  disabled = false,
  planId,
  sectionTitles,
}: ResourceBankSidePanelProps) => {
  const { getAccessToken } = useAuth();

  const { data: addressData } = $api.useQuery(
    "get",
    "/plan/{plan_id}/address",
    {
      params: { path: { plan_id: planId } },
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    },
  );

  const clientAddress = [
    addressData?.street_address,
    addressData?.city,
    addressData?.state,
  ]
    .filter(Boolean)
    .join(", ");

  const handleAddressSave = (address: {
    street_address: string | null;
    city: string;
    state: string;
  }) => {
    // TODO: Wire to PATCH /plans/{id}/address in a future ticket
    console.log("Address saved:", address);
    // TODO: invalidate /plan/{planId}/address query here after address change
  };

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
            <ResourceSearchPanel
              addResource={addResource}
              sectionTitles={sectionTitles}
              clientAddress={clientAddress}
            />
            <AddressSection
              initialAddress={clientRecord?.address}
              onSave={handleAddressSave}
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
