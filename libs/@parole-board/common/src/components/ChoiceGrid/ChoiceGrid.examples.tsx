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

import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components";

import { semantics } from "../../theme";
import { CheckboxGrid, CheckboxGridItem } from "./CheckboxGrid";
import { RadioGrid, RadioGridItem } from "./RadioGrid";

export default {};

// The design's dialogs are white, so each example sits on white.
const Dialog = styled.div<{ $width: number }>`
  width: ${({ $width }) => rem($width)};
  background: ${semantics.surface.bg};
`;

// Each story sits at the width of its dialog's content in the Calendar Unit
// Dashboard design: 544px for Add a month, 524px for Add a hearing.

const MONTHS = [
  { value: "2026-11", name: "November", year: "2026" },
  { value: "2026-12", name: "December", year: "2026" },
  { value: "2027-01", name: "January", year: "2027" },
  { value: "2027-02", name: "February", year: "2027" },
  { value: "2027-03", name: "March", year: "2027" },
  { value: "2027-04", name: "April", year: "2027" },
  { value: "2027-05", name: "May", year: "2027" },
  { value: "2027-06", name: "June", year: "2027" },
  { value: "2027-07", name: "July", year: "2027" },
  { value: "2027-08", name: "August", year: "2027" },
  { value: "2027-09", name: "September", year: "2027" },
  { value: "2027-10", name: "October", year: "2027" },
];

// The design has no meeting type tiles; they follow the facility tiles.
const MEETING_TYPES = ["Full Board", "Business Meeting"];

const FACILITIES = Array.from(
  { length: 12 },
  (_, index) => `Facility ${String.fromCharCode(65 + index)}`,
);

const DAYS = Array.from({ length: 30 }, (_, index) => String(index + 1));

function MonthPicker({
  initial,
  alreadyAdded = [],
}: {
  initial: string[];
  alreadyAdded?: string[];
}) {
  const [value, setValue] = useState(initial);
  return (
    <Dialog $width={544}>
      <CheckboxGrid
        ariaLabel="Months to add"
        value={value}
        onChange={setValue}
        columns={4}
      >
        {MONTHS.map(({ value: month, name, year }) => {
          const added = alreadyAdded.includes(month);
          return (
            <CheckboxGridItem
              key={month}
              value={month}
              description={added ? "Already added" : year}
              disabled={added}
            >
              {name}
            </CheckboxGridItem>
          );
        })}
      </CheckboxGrid>
    </Dialog>
  );
}

export const Months = () => <MonthPicker initial={["2026-11"]} />;

export const MonthsSomeAlreadyAdded = () => (
  <MonthPicker initial={["2027-01"]} alreadyAdded={["2026-11", "2026-12"]} />
);

export const MeetingTypes = () => {
  const [value, setValue] = useState<string | undefined>("Full Board");
  return (
    <Dialog $width={524}>
      <RadioGrid
        ariaLabel="Meeting type"
        value={value}
        onChange={setValue}
        columns={2}
      >
        {MEETING_TYPES.map((meeting) => (
          <RadioGridItem key={meeting} value={meeting}>
            {meeting}
          </RadioGridItem>
        ))}
      </RadioGrid>
    </Dialog>
  );
};

export const Facilities = () => {
  const [value, setValue] = useState<string | undefined>("Facility A");
  return (
    <Dialog $width={524}>
      <RadioGrid
        ariaLabel="Facility"
        value={value}
        onChange={setValue}
        columns={3}
      >
        {FACILITIES.map((facility) => (
          <RadioGridItem key={facility} value={facility}>
            {facility}
          </RadioGridItem>
        ))}
      </RadioGrid>
    </Dialog>
  );
};

export const Days = () => {
  const [value, setValue] = useState<string | undefined>("1");
  return (
    <Dialog $width={524}>
      <RadioGrid
        ariaLabel="Day"
        value={value}
        onChange={setValue}
        columns={13}
        size="compact"
      >
        {DAYS.map((day) => (
          <RadioGridItem key={day} value={day}>
            {day}
          </RadioGridItem>
        ))}
      </RadioGrid>
    </Dialog>
  );
};

export const DisabledGroup = () => (
  <Dialog $width={524}>
    <RadioGrid
      ariaLabel="Meeting type"
      value="Business Meeting"
      onChange={() => undefined}
      columns={2}
      disabled
    >
      {MEETING_TYPES.map((meeting) => (
        <RadioGridItem key={meeting} value={meeting}>
          {meeting}
        </RadioGridItem>
      ))}
    </RadioGrid>
  </Dialog>
);
