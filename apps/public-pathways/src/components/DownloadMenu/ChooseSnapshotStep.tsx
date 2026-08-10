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

import { getYear, subYears } from "date-fns";

import { Icon, Radio } from "~design-system";

import { MonthYearPicker } from "../DatePicker";
import {
  CancelButton,
  ContinueButton,
  SnapshotActionRow,
  SnapshotDatePickerRow,
  SnapshotDivider,
  SnapshotHeading,
  SnapshotOptionHeading,
  SnapshotOptionRow,
  SnapshotOptionSubheading,
  SnapshotRadioGroup,
  SnapshotSubheading,
} from "./ChooseSnapshotStep.styles";
import { InfoBanner } from "./InfoBanner";

export type SnapshotOption = "single" | "bulk";

const MAX_SNAPSHOT_HISTORY_YEARS = 5;

type ChooseSnapshotStepProps = {
  snapshotOption: SnapshotOption | undefined;
  onSnapshotOptionChange: (option: SnapshotOption) => void;
  selectedDate: Date | null;
  onSelectedDateChange: (date: Date | null) => void;
  onCancel: () => void;
  onContinue: () => void;
};

export function ChooseSnapshotStep({
  snapshotOption,
  onSnapshotOptionChange,
  selectedDate,
  onSelectedDateChange,
  onCancel,
  onContinue,
}: ChooseSnapshotStepProps) {
  const today = new Date();
  const minSelectableDate = subYears(today, MAX_SNAPSHOT_HISTORY_YEARS);
  const isContinueDisabled =
    snapshotOption === undefined ||
    (snapshotOption === "single" && selectedDate === null);

  // Picking a date implies the user intends the single-snapshot option, even
  // if "bulk" was previously selected (or nothing was selected yet).
  const handleDateChange = (date: Date | null) => {
    onSelectedDateChange(date);
    onSnapshotOptionChange("single");
  };

  return (
    <>
      <SnapshotHeading>Individual-level data</SnapshotHeading>
      <SnapshotSubheading>
        Choose the monthly snapshot(s) to export. Each snapshot is the full
        under-custody population for that month.
      </SnapshotSubheading>
      <InfoBanner>
        <Icon kind="Info" size={14} />
        <span>
          This dataset is completely unfiltered — chart filters do not affect
          it.
        </span>
      </InfoBanner>
      <SnapshotRadioGroup
        value={snapshotOption}
        onChange={(value) => onSnapshotOptionChange(value as SnapshotOption)}
        ariaLabel="Snapshot type"
      >
        <SnapshotOptionRow
          data-testid="snapshot-option-row-single"
          $isSelected={snapshotOption === "single"}
          onClick={() => onSnapshotOptionChange("single")}
        >
          <Radio value="single">
            <SnapshotOptionHeading>
              A single month&apos;s snapshot
            </SnapshotOptionHeading>
            <SnapshotOptionSubheading>
              One CSV for the month and year you select.
            </SnapshotOptionSubheading>
          </Radio>
          {snapshotOption === "single" && (
            <>
              <SnapshotDivider />
              <SnapshotDatePickerRow>
                <MonthYearPicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  minDate={minSelectableDate}
                  maxDate={today}
                />
              </SnapshotDatePickerRow>
            </>
          )}
        </SnapshotOptionRow>
        <SnapshotOptionRow
          data-testid="snapshot-option-row-bulk"
          $isSelected={snapshotOption === "bulk"}
          onClick={() => onSnapshotOptionChange("bulk")}
        >
          <Radio value="bulk">
            <SnapshotOptionHeading>
              Every month, last {MAX_SNAPSHOT_HISTORY_YEARS} years
            </SnapshotOptionHeading>
            <SnapshotOptionSubheading>
              One snapshot per month, {getYear(minSelectableDate)}-
              {getYear(today)} — about 60 CSV files, delivered as a single .zip.
            </SnapshotOptionSubheading>
          </Radio>
        </SnapshotOptionRow>
      </SnapshotRadioGroup>
      <SnapshotActionRow>
        <CancelButton kind="borderless" onClick={onCancel}>
          Cancel
        </CancelButton>
        <ContinueButton
          kind="primary"
          disabled={isContinueDisabled}
          onClick={onContinue}
        >
          Continue
        </ContinueButton>
      </SnapshotActionRow>
    </>
  );
}
