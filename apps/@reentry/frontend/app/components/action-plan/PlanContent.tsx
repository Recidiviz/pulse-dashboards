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

import { useRef, useState } from "react";

import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { ResourceSection } from "~@reentry/frontend/hooks/resourceBank.types";
import { usePlanPdf } from "~@reentry/frontend/hooks/usePlanPdf";
import { components } from "~@reentry/openapi-types";

import PlanSectionView from "./PlanSectionView";
import RemoveResourceDialog from "./RemoveResourceDialog";
import ResourceBank, { ResourceBankSectionSkeleton } from "./ResourceBank";
import styles from "./styles/PlanContent.module.css";
import { PlanSection } from "./types";

interface PlanContentProps {
  isResourceBankLoading: boolean;
  planDetail: components["schemas"]["PlanResponseGet"];
  planSections: PlanSection[];
  removeResource: (sectionTitle: string, resourceId: string) => void;
  sections: ResourceSection[];
}

type PendingRemoval = { id: string; name: string; sectionTitle: string };

const PlanContent = ({
  isResourceBankLoading,
  planDetail,
  planSections,
  removeResource,
  sections,
}: PlanContentProps) => {
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(
    null,
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const clientFullName = planDetail.client_record?.full_name
    ? `${planDetail.client_record.full_name.given_names} ${planDetail.client_record.full_name.surname}`
    : "";
  const clientFirstName =
    planDetail?.client_record?.full_name?.given_names ?? "the client";
  const { generatePdf, isGenerating } = usePlanPdf(
    contentRef,
    `${clientFullName}_action_plan.pdf`,
  );
  const [savedMarkdownBySectionId, setSavedMarkdownBySectionId] = useState<
    Record<string, string>
  >({});

  const handleSave = (sectionId: string, markdown: string) => {
    setSavedMarkdownBySectionId((prev) => ({ ...prev, [sectionId]: markdown }));
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["inner"]}>
        <div className={styles["buttonRow"]}>
          <PrimaryButton
            buttonText={isGenerating ? "Generating..." : "Download PDF"}
            onClick={generatePdf}
            disabled={isGenerating}
            ignoreCapabilities={true}
            className={styles["downloadButton"]}
          />
        </div>
        <div className={styles["planHeader"]}>
          <div className={styles["planLabel"]}>Action plan</div>
          <div className={styles["planTitle"]}>{clientFullName}</div>
        </div>

        <div id="contentToDownload" ref={contentRef}>
          {planSections.map((section) => (
            <PlanSectionView
              key={section.id}
              section={section}
              currentMarkdown={
                savedMarkdownBySectionId[section.id] ?? section.markdown
              }
              onSave={handleSave}
            />
          ))}
          <div className={styles["header"]}>
            <div className={styles["subtitle"]}>Action plan</div>
            <div className={styles["title"]}>{clientFullName}</div>
          </div>
          {/* Resource sections will be rendered here in future tickets */}
          <div className={styles["placeholder"]}>
            Resource bank content placeholder
          </div>
          <div className={styles["sections"]}>
            {isResourceBankLoading ? (
              <>
                <ResourceBankSectionSkeleton />
                <ResourceBankSectionSkeleton />
                <ResourceBankSectionSkeleton />
              </>
            ) : (
              sections.map((section) => (
                <ResourceBank
                  key={section.title}
                  title={section.title}
                  resources={section.resources}
                  clientFirstName={clientFirstName}
                  onRemove={(id, name, sectionTitle) =>
                    setPendingRemoval({ id, name, sectionTitle })
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

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
  );
};

export default PlanContent;
