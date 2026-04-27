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

import PlanContent from "~@reentry/frontend/components/action-plan/PlanContent";
import {
  PlanContentSkeleton,
  PlanErrorContent,
  SidePanelSkeleton,
} from "~@reentry/frontend/components/action-plan/PlanContentSkeleton";
import PlanEdit from "~@reentry/frontend/components/action-plan/PlanEdit";
import ResourceBankSidePanel from "~@reentry/frontend/components/action-plan/ResourceBankSidePanel";
import { useMockResourceBankPlan } from "~@reentry/frontend/hooks/useMockRessourceAPICall";
import { usePlanMarkdown } from "~@reentry/frontend/hooks/usePlanMarkdown";
import { useResourceBank } from "~@reentry/frontend/hooks/useResourceBank";

import RemoveResourceDialog from "./RemoveResourceDialog";
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
type PendingRemoval = { id: string; name: string; sectionTitle: string };

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
  } = useResourceBank(planDetail?.latest_generation?.id ?? undefined);

  const {
    displayMarkdown,
    draftMarkdown,
    setDraftMarkdown,
    isEditing,
    isSaving,
    startEdit,
    cancelEdit,
    saveMarkdown,
  } = usePlanMarkdown(planDetail?.latest_generation?.markdown_result);

  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(
    null,
  );

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

  const clientFirstName =
    planDetail?.client_record?.full_name?.given_names ?? "the client";

  return (
    <div className={styles["container"]}>
      <div className={styles["sidebar"]}>
        <ResourceBankSidePanel
          clientRecord={planDetail?.client_record}
          onAddressSave={handleAddressSave}
          searchPanelProps={resourceSearchPanelProps}
        />
      </div>
      <div className={styles["content"]}>
        {!isEditing ? (
          <PlanContent
            planDetail={planDetail}
            setMarkdownEdit={startEdit}
            internalMarkdown={displayMarkdown}
            onResourceRemove={(id, name, sectionTitle) =>
              setPendingRemoval({ id, name, sectionTitle })
            }
            allResources={sections}
            isErrorResources={didResourceBankError}
            isResourceBankLoading={isResourceBankLoading}
          />
        ) : (
          <PlanEdit
            internalMarkdown={draftMarkdown}
            setInternalMarkdown={setDraftMarkdown}
            allResources={sections}
            clientFirstName={clientFirstName}
            onResourceRemove={(id, name, sectionTitle) =>
              setPendingRemoval({ id, name, sectionTitle })
            }
            onSave={saveMarkdown}
            onCancel={cancelEdit}
            isSaving={isSaving}
          />
        )}
        <RemoveResourceDialog
          isOpen={pendingRemoval !== null}
          resourceName={pendingRemoval?.name ?? ""}
          sectionTitle={pendingRemoval?.sectionTitle ?? ""}
          onClose={() => setPendingRemoval(null)}
          onConfirm={() => {
            if (pendingRemoval) {
              removeResource(pendingRemoval.sectionTitle, pendingRemoval.id);
            }
            setPendingRemoval(null);
          }}
        />
      </div>
    </div>
  );
};

export default ResourceBankLayout;
