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

import React from "react";

import { SelectableChip } from "../../../common/inputs";
import * as Styled from "./Approvals.styles";
import { useDecisionDraft } from "./approvals.utils";

export type DecisionOption<T extends string> = { value: T; label: string };

interface DecisionGroupProps<T extends string> {
  title: string;
  /** Shown next to the title, e.g. the saved decision's badge. */
  badge?: React.ReactNode;
  name: string;
  options: DecisionOption<T>[];
  persisted: T | null;
  editable: boolean;
  /** Any save in flight: one mutation at a time blocks every group. */
  isSaving: boolean;
  /** Only the group a save came from shows the in-flight label. */
  isSavingThisGroup: boolean;
  onSave: (value: T) => void;
}

/** One decision: a chip per option and a Save that enables once it changes. */
export function DecisionGroup<T extends string>({
  title,
  badge,
  name,
  options,
  persisted,
  editable,
  isSaving,
  isSavingThisGroup,
  onSave,
}: DecisionGroupProps<T>) {
  const { draft, setDraft, isDirty } = useDecisionDraft<T>(persisted);

  return (
    <Styled.DecisionGroup>
      <Styled.ApprovalsSummaryRow>
        <Styled.SectionSubtitle>{title}</Styled.SectionSubtitle>
        {badge}
      </Styled.ApprovalsSummaryRow>
      <Styled.ChipRow $disabled={!editable}>
        {options.map((option) => (
          <SelectableChip
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            checked={draft === option.value}
            disabled={!editable || isSaving}
            onSelect={() => setDraft(option.value)}
          />
        ))}
      </Styled.ChipRow>
      {editable && (
        <Styled.ApprovalsSaveButton
          type="button"
          $active={isDirty && !isSaving}
          disabled={!isDirty || isSaving}
          onClick={() => draft != null && onSave(draft)}
        >
          {isSavingThisGroup ? "Saving..." : "Save"}
        </Styled.ApprovalsSaveButton>
      )}
    </Styled.DecisionGroup>
  );
}
