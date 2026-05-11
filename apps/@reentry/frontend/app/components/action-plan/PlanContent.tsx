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

import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { ResourceSection } from "~@reentry/frontend/hooks/resourceBank.types";
import { useActionPlanPDF } from "~@reentry/frontend/hooks/usePDFDownload";
import { components } from "~@reentry/openapi-types";

import DownloadConfirmModal from "./DownloadConfirmModal";
import ResourceBankViewer from "./ResourceBankViewer";
import styles from "./styles/PlanContent.module.css";

interface PlanContentProps {
  isResourceBankLoading: boolean;
  isErrorResources: boolean;
  planDetail: components["schemas"]["PlanResponseGet"];
  setMarkdownEdit: () => void;
  internalMarkdown: string;
  allResources?: ResourceSection[];
  onResourceRemove?: (id: string, name: string, sectionTitle: string) => void;
}

const PlanContent = ({
  planDetail,
  setMarkdownEdit,
  internalMarkdown,
  allResources,
  onResourceRemove,
  isResourceBankLoading,
  isErrorResources,
}: PlanContentProps) => {
  const clientFullName = planDetail.client_record?.full_name
    ? `${planDetail.client_record.full_name.given_names}_${planDetail.client_record.full_name.surname}`
    : "";

  const { handleDownload, isDownloading } = useActionPlanPDF(
    planDetail.id,
    `${clientFullName}_action_plan.pdf`,
  );

  const [showDownloadModal, setShowDownloadModal] = useState(false);

  return (
    <div className={styles["container"]}>
      <div className={styles["inner"]}>
        <div className={styles["buttonRow"]}>
          <PrimaryButton
            buttonText="Edit"
            onClick={setMarkdownEdit}
            disabled={isDownloading}
            ignoreCapabilities={true}
            className={styles["actionButton"]}
          />
          <PrimaryButton
            buttonText={isDownloading ? "Generating..." : "Download PDF"}
            onClick={() => setShowDownloadModal(true)}
            disabled={isDownloading}
            ignoreCapabilities={true}
            className={styles["actionButton"]}
          />
        </div>
        <DownloadConfirmModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          onConfirm={() => {
            setShowDownloadModal(false);
            handleDownload();
          }}
          isDownloading={isDownloading}
        />

        <div>
          <ResourceBankViewer
            clientName={planDetail?.client_record?.full_name}
            markDownPlan={internalMarkdown}
            onResourceRemove={onResourceRemove}
            allResources={allResources}
            isLoadingResources={isResourceBankLoading}
            isErrorResources={isErrorResources}
          />
        </div>
      </div>
    </div>
  );
};

export default PlanContent;
