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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { useRef, useState } from "react";
import styled from "styled-components";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  palette,
} from "~design-system";

import { ParoleBoardReportMode } from "../../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import { AUTOSAVE_FAILED_MESSAGE, MISSING_VALUE_TEXT } from "./constants";

const Field = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(spacing.xs)};
`;

const Toggle = styled(DropdownToggle).attrs({ showCaret: true })`
  gap: ${rem(spacing.md)};
  color: ${palette.pine2};
`;

const Menu = styled(DropdownMenu).attrs({ alignment: "left" })`
  width: max-content;
`;

const ReadValue = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
`;

const ErrorText = styled.div`
  ${typography.Sans12}
  color: ${palette.signal.error};
`;

export type ReportDropdownOption<Value extends string> = {
  value: Value;
  label: string;
};

/**
 * A report field where the PHI picks one option from a list, such as the
 * Summary's 4th Amendment Waiver answer. Picking an option saves it. The
 * toggle shows the latest picked option while its save is in flight, even
 * if an earlier pick's save finishes first, and an error if the latest save
 * fails, in which case picking again tries again.
 *
 * In read mode it shows the picked option's label as plain text.
 *
 * @param mode - EDIT or READ. The report presenter picks it.
 * @param label - Names the field for screen readers, such as "4th Amendment
 *   Waiver".
 * @param options - The options, in the order the menu lists them.
 * @param value - The saved option, or null when the PHI hasn't picked one.
 * @param onSave - Saves the option the PHI picked.
 * @param placeholder - Shows on the toggle before the PHI picks an option.
 */
export function ReportDropdown<Value extends string>({
  mode,
  label,
  options,
  value,
  onSave,
  placeholder = "Select",
}: {
  mode: ParoleBoardReportMode;
  label: string;
  options: Array<ReportDropdownOption<Value>>;
  value: Value | null;
  onSave: (value: Value) => Promise<void>;
  placeholder?: string;
}) {
  const [pending, setPending] = useState<Value>();
  const [saveFailed, setSaveFailed] = useState(false);
  // Numbers each pick, so only the latest pick's save clears the pending
  // option or shows an error.
  const latestPick = useRef(0);

  const shown = pending ?? value;
  const shownLabel = options.find((option) => option.value === shown)?.label;

  if (mode === "READ") {
    return <ReadValue>{shownLabel ?? MISSING_VALUE_TEXT}</ReadValue>;
  }

  const pick = async (picked: Value) => {
    latestPick.current += 1;
    const thisPick = latestPick.current;
    setPending(picked);
    setSaveFailed(false);
    try {
      await onSave(picked);
    } catch {
      if (thisPick === latestPick.current) setSaveFailed(true);
    } finally {
      if (thisPick === latestPick.current) setPending(undefined);
    }
  };

  return (
    <Field>
      <Dropdown>
        <Toggle aria-label={`${label}: ${shownLabel ?? placeholder}`}>
          {shownLabel ?? placeholder}
        </Toggle>
        <Menu ariaLabel={label}>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => pick(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </Menu>
      </Dropdown>
      {saveFailed && (
        <ErrorText role="alert">{AUTOSAVE_FAILED_MESSAGE}</ErrorText>
      )}
    </Field>
  );
}
