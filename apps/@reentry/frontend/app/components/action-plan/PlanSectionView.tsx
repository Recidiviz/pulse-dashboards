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
import MdxEditor from "~@reentry/frontend/components/mdxEditor/MdxEditor";

import ResourceBankViewer from "./ResourceBankViewer";
import styles from "./styles/PlanContent.module.css";
import { PlanSection } from "./types";

interface PlanSectionViewProps {
  section: PlanSection;
  currentMarkdown: string;
  onSave: (sectionId: string, markdown: string) => void;
}

const PlanSectionView = ({
  section,
  currentMarkdown,
  onSave,
}: PlanSectionViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditorMarkdown, setCurrentEditorMarkdown] = useState("");

  const handleEdit = () => {
    setCurrentEditorMarkdown(currentMarkdown);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(section.id, currentEditorMarkdown);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const markdownForViewer = currentMarkdown.replace(/^# .+\n/, "").trimStart();

  return (
    <div className={styles["section"]}>
      <div className={styles["sectionHeader"]}>
        <div className={styles["sectionTitle"]}>{section.title}</div>
        <div className={styles["sectionToolbar"]}>
          {isEditing ? (
            <>
              <PrimaryButton buttonText="Save" onClick={handleSave} />
              <PrimaryButton buttonText="Cancel" onClick={handleCancel} />
            </>
          ) : (
            <PrimaryButton buttonText="Edit" onClick={handleEdit} />
          )}
        </div>
      </div>
      {isEditing ? (
        <div className={styles["editorWrapper"]} data-color-mode="light">
          <MdxEditor
            markDownPlan={currentMarkdown}
            internalMarkdown={currentEditorMarkdown}
            setInternalMarkdown={setCurrentEditorMarkdown}
          />
        </div>
      ) : (
        <ResourceBankViewer markDownPlan={markdownForViewer} />
      )}
      <div className={styles["resourcesPlaceholder"]}>
        {section.id} resources placeholder
      </div>
    </div>
  );
};

export default PlanSectionView;
