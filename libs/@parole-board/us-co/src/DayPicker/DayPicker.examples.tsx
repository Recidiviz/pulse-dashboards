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

import {
  type CalendarMonthRef,
  type CalendarWeekday,
  semantics,
} from "~@parole-board/common";

import { isAllowedDay } from "../model/isAllowedDay";
import { DayPicker } from "./DayPicker";

export default {};

// The standard Modal is 462px wide with 40px of padding each side, so its
// content is 382px wide.
const ModalContent = styled.div`
  width: ${rem(382)};
  background: ${semantics.surface.bg};
`;

const MONDAY_TO_FRIDAY: CalendarWeekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

function Example({
  month,
  initial,
  weekdaysOnly = false,
}: {
  month: CalendarMonthRef;
  initial: string | null;
  weekdaysOnly?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ModalContent>
      <DayPicker
        month={month}
        value={value}
        onChange={setValue}
        isDisabled={
          weekdaysOnly
            ? (date) => !isAllowedDay(date, MONDAY_TO_FRIDAY)
            : undefined
        }
        legend="Day"
      />
    </ModalContent>
  );
}

export const September2026 = () => (
  <Example month={{ year: 2026, month: 9 }} initial="2026-09-16" />
);

export const February2027 = () => (
  <Example month={{ year: 2027, month: 2 }} initial={null} />
);

export const WithDisabledDays = () => (
  <Example month={{ year: 2026, month: 9 }} initial="2026-09-14" weekdaysOnly />
);
