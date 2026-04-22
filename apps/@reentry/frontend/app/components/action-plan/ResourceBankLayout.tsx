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

import PlanContent from "~@reentry/frontend/components/action-plan/PlanContent";
import {
  PlanContentSkeleton,
  PlanErrorContent,
  SidePanelSkeleton,
} from "~@reentry/frontend/components/action-plan/PlanContentSkeleton";
import ResourceBankSidePanel from "~@reentry/frontend/components/action-plan/ResourceBankSidePanel";
import { useMockResourceBankPlan } from "~@reentry/frontend/hooks/useMockRessourceAPICall";
import { useResourceBank } from "~@reentry/frontend/hooks/useResourceBank";

import { CATEGORY_SUBCATEGORY_MAP } from "./resource-bank/categorySubcategoryMap";
import styles from "./styles/ResourceBankLayout.module.css";

const LoadingState = () => (
  <div className={styles["container"]}>
    <div className={styles["sidebar"]}>
      <SidePanelSkeleton />
    </div>
    <div className={styles["content"]}>
      <PlanContentSkeleton />
    </div>
  </div>
);

const ErrorState = () => (
  <div className={styles["container"]}>
    <div className={styles["sidebar"]}>
      <SidePanelSkeleton />
    </div>
    <div className={styles["content"]}>
      <PlanErrorContent />
    </div>
  </div>
);

interface ResourceBankLayoutProps {
  planId: string;
}

const ResourceBankLayout = ({ planId }: ResourceBankLayoutProps) => {
  const {
    data: planDetail,
    isLoading,
    isError,
  } = useMockResourceBankPlan(planId);

  const {
    sections,
    addResource,
    removeResource,
    isLoading: isResourceBankLoading,
    isError: didResourceBankError,
  } = useResourceBank();

  const handleAddressSave = (address: {
    street_address: string | null;
    city: string;
    state: string;
  }) => {
    // TODO: Wire to PATCH /plans/{id}/address in a future ticket
    console.log("Address saved:", address);
    // TODO: refresh resources after address change in a future ticket - update distances
  };

  if (isLoading) return <LoadingState />;

  const resourceSearchPanelProps = {
    addResource,
    categorySubcategoryMap: CATEGORY_SUBCATEGORY_MAP,
    sectionTitles: sections.map((item) => ({ title: item.title })),
  };
  if (isError || !planDetail) return <ErrorState />;

  return (
    <div className={styles["container"]}>
      <div className={styles["sidebar"]}>
        <ResourceBankSidePanel
          clientRecord={planDetail.client_record}
          onAddressSave={handleAddressSave}
          searchPanelProps={resourceSearchPanelProps}
        />
      </div>
      <div className={styles["content"]}>
        <PlanContent
          isResourceBankLoading={isResourceBankLoading}
          isErrorResources={didResourceBankError}
          planDetail={planDetail}
          removeResource={removeResource}
          sections={sections}
        />
      </div>
    </div>
  );
};

export default ResourceBankLayout;
