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
import PlanEdit from "~@reentry/frontend/components/action-plan/PlanEdit";
import ResourceBankSidePanel from "~@reentry/frontend/components/action-plan/ResourceBankSidePanel";
import { usePlanMarkdown } from "~@reentry/frontend/hooks/usePlanMarkdown";
import { useResourceBank } from "~@reentry/frontend/hooks/useResourceBank";
import type { components } from "~@reentry/openapi-types";

import RemoveResourceDialog from "./RemoveResourceDialog";
import styles from "./styles/ResourceBankLayout.module.css";

interface ResourceBankLayoutProps {
  planDetail: components["schemas"]["PlanResponseGet"];
}
type PendingRemoval = { id: string; name: string; sectionTitle: string };

const ResourceBankLayout = ({ planDetail }: ResourceBankLayoutProps) => {
  const {
    sections,
    addResource,
    removeResource,
    isLoading: isResourceBankLoading,
    isError: didResourceBankError,
  } = useResourceBank(planDetail.latest_generation?.id ?? undefined);

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
  );

  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(
    null,
  );

  const clientFirstName =
    planDetail.client_record?.full_name?.given_names ?? "the client";
  return (
    <div className={styles["container"]}>
      <div className={styles["sidebar"]}>
        <ResourceBankSidePanel
          planId={planDetail?.id}
          clientRecord={planDetail?.client_record ?? null}
          addResource={addResource}
          sectionTitles={sections.map((item) => ({ title: item.title }))}
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
