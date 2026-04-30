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

import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import type { ResourceSection } from "~@reentry/frontend/hooks/resourceBank.types";

import MdxEditor from "../mdxEditor/BankMdxEditor";
import styles from "./styles/PlanContent.module.css";

interface PlanEditProps {
  internalMarkdown: string;
  setInternalMarkdown: (markdown: string) => void;
  allResources?: ResourceSection[];
  clientFirstName: string;
  onResourceRemove: (id: string, name: string, sectionTitle: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const PlanEdit = ({
  internalMarkdown,
  setInternalMarkdown,
  allResources,
  clientFirstName,
  onResourceRemove,
  onSave,
  onCancel,
  isSaving = false,
}: PlanEditProps) => {
  return (
    <div className={styles["container"]}>
      <div className={styles["inner"]}>
        <div className={`${styles["buttonRow"]} ${styles["edit"]}`}>
          <PrimaryButton
            buttonText="Cancel"
            onClick={onCancel}
            ignoreCapabilities={true}
            className={styles["actionButton"]}
          />
          <PrimaryButton
            buttonText={isSaving ? "Saving..." : "Save"}
            onClick={onSave}
            disabled={isSaving}
            ignoreCapabilities={true}
            className={styles["actionButton"]}
          />
        </div>
        <div className={styles["editorWrapper"]}>
          <MdxEditor
            internalMarkdown={internalMarkdown}
            setInternalMarkdown={setInternalMarkdown}
            allResources={allResources}
            clientFirstName={clientFirstName}
            onResourceRemove={onResourceRemove}
          />
        </div>
      </div>
    </div>
  );
};

export default PlanEdit;
