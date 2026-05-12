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
import PlanContent from "~@reentry/frontend/components/action-plan/PlanContent";
import PlanEdit from "~@reentry/frontend/components/action-plan/PlanEdit";
import ResourceBankSidePanel from "~@reentry/frontend/components/action-plan/ResourceBankSidePanel";
import { usePlanMarkdown } from "~@reentry/frontend/hooks/usePlanMarkdown";
import { useResourceBank } from "~@reentry/frontend/hooks/useResourceBank";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { showErrorToast } from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

import RemoveResourceDialog from "./RemoveResourceDialog";
import { CATEGORY_SUBCATEGORY_MAP } from "./resource-bank/categorySubcategoryMap";
import styles from "./styles/ResourceBankLayout.module.css";

interface ResourceBankLayoutProps {
  planDetail: components["schemas"]["PlanResponseGet"];
}
type PendingRemoval = { id: string; name: string; sectionTitle: string };

const ResourceBankLayout = ({ planDetail }: ResourceBankLayoutProps) => {
  const { getAccessToken } = useAuth();
  const planGenerationId = planDetail.latest_generation?.id;

  const {
    sections,
    addResource,
    removeResource,
    refetch: refetchResourceBank,
    isLoading: isResourceBankLoading,
    isError: didResourceBankError,
  } = useResourceBank(planGenerationId ?? undefined);

  const { mutateAsync: updateAddress } = $api.useMutation(
    "patch",
    "/plans/{id}/address",
  );

  const { data: addressData, refetch: refetchAddress } = $api.useQuery(
    "get",
    "/plan/{plan_id}/address",
    {
      params: { path: { plan_id: planDetail.id ?? "" } },
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    },
    { enabled: Boolean(planDetail.id) },
  );

  const clientAddress = [
    addressData?.street_address,
    addressData?.city,
    addressData?.state,
  ]
    .filter(Boolean)
    .join(", ");

  const {
    displayMarkdown,
    draftMarkdown,
    setDraftMarkdown,
    isEditing,
    isSaving,
    startEdit,
    cancelEdit,
    saveMarkdown,
  } = usePlanMarkdown(
    planDetail.id,
    planDetail.latest_generation?.markdown_result,
    { planGenerationId },
  );

  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(
    null,
  );

  const handleAddressSave = async (address: {
    street_address: string | null;
    city: string;
    state: string;
  }) => {
    try {
      await updateAddress({
        params: { path: { id: planDetail.id ?? "" } },
        body: address,
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      await refetchAddress();
      refetchResourceBank();
    } catch {
      showErrorToast("Failed to update address. Please try again.");
      throw new Error("Address update failed");
    }
  };

  const resourceSearchPanelProps = {
    addResource,
    categorySubcategoryMap: CATEGORY_SUBCATEGORY_MAP,
    clientAddress,
    planGenerationId,
    sectionTitles: sections.map((item) => ({ title: item.title })),
  };

  const clientFirstName =
    planDetail.client_record?.full_name?.given_names ?? "the client";
  return (
    <div className={styles["container"]}>
      <div className={styles["sidebar"]}>
        <ResourceBankSidePanel
          clientRecord={planDetail.client_record}
          onAddressSave={handleAddressSave}
          searchPanelProps={resourceSearchPanelProps}
          resourcesPipelineEnabled={
            planDetail.resources_pipeline_enabled ?? false
          }
          digitalResourcesEnabled={
            planDetail.digital_resources_enabled ?? false
          }
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
