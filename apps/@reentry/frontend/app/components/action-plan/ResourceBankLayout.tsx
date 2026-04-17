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
import ResourceBankSidePanel from "~@reentry/frontend/components/action-plan/ResourceBankSidePanel";
import LoadingState from "~@reentry/frontend/components/auth/LoadingState";
import { useMockResourceBankPlan } from "~@reentry/frontend/hooks/useMockRessourceAPICall";

import styles from "./styles/ResourceBankLayout.module.css";
import usePlanSections from "./usePlanSections";

interface ResourceBankLayoutProps {
  planId: string;
}

const ResourceBankLayout = ({ planId }: ResourceBankLayoutProps) => {
  const planSections = usePlanSections(planId);

  const {
    data: planDetail,
    isLoading,
    isError,
  } = useMockResourceBankPlan(planId);

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
  if (isError || !planDetail) return null;

  return (
    <div className={styles["container"]}>
      <div className={styles["sidebar"]}>
        <ResourceBankSidePanel
          clientRecord={planDetail?.client_record}
          onAddressSave={handleAddressSave}
        />
      </div>
      <div className={styles["content"]}>
        <PlanContent planDetail={planDetail} planSections={planSections} />
      </div>
    </div>
  );
};

export default ResourceBankLayout;
