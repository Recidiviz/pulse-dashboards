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

import { injectable, withDi } from "react-magnetic-di";

import { useAddEntry, useCalendarConfig } from "~@parole-board/common";
import {
  mutationResult,
  queryResult,
  september2026Config,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";

import { AddHearingModal } from "../AddHearingModal";
import { useExampleAppElement } from "./support/ExampleAddHearingModal";

const addEntryResult = (): ReturnType<typeof useAddEntry> => mutationResult();

const DefaultModal = withDi(AddHearingModal, [
  injectable(useCalendarConfig, () => queryResult(september2026Config)),
  injectable(useAddEntry, addEntryResult),
]);

export default {};

// The design's "Add a hearing, default" state from the container, with the September 2026 config and month: nothing chosen, and with no hearing selected the day starts on the month's first allowed day, Tuesday September 1.
export const Default = () => {
  useExampleAppElement();
  return (
    <DefaultModal
      isOpen
      month={september2026MonthDetail}
      selectedDate={null}
      onClose={() => undefined}
      onAdded={() => undefined}
    />
  );
};
