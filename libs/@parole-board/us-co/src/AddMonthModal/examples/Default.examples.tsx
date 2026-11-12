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

import "./support/setModalAppElement";

import { useState } from "react";
import { injectable, withDi } from "react-magnetic-di";

import {
  type CreateMonthsResult,
  useAddMonthOptions,
  useCalendarConfig,
  useCreateMonths,
  useCurrentPatterns,
} from "~@parole-board/common";
import {
  addMonthChoices,
  mutationResult,
  queryResult,
} from "~@parole-board/common/fixtures";
import { Button } from "~design-system";

import { useCurrentYearMonth } from "../../model/useCurrentYearMonth";
import { AddMonthModal } from "../AddMonthModal";

// The clock at 2026-10-08 in Denver, with the fixture's patterns and config.
const inOctoberDi = injectable(
  useCurrentYearMonth,
  () => addMonthChoices.currentMonth,
);
const patternsDi = injectable(
  useCurrentPatterns,
  (): ReturnType<typeof useCurrentPatterns> =>
    queryResult(addMonthChoices.currentPatterns),
);
const configDi = injectable(
  useCalendarConfig,
  (): ReturnType<typeof useCalendarConfig> =>
    queryResult(addMonthChoices.config),
);
const optionsDi = injectable(
  useAddMonthOptions,
  (): ReturnType<typeof useAddMonthOptions> =>
    queryResult(addMonthChoices.options),
);
// months.create answers after a second and a half, creating every month sent.
const createDi = injectable(
  useCreateMonths,
  (): ReturnType<typeof useCreateMonths> => ({
    ...mutationResult(),
    mutateAsync: ({ months }) =>
      new Promise<CreateMonthsResult>((resolve) => {
        setTimeout(
          () =>
            resolve({
              created: months.map(({ year, month }) => ({
                id: `month-${year}-${month}`,
                year,
                month,
                entryCount: 40,
                notices: [],
              })),
            }),
          1500,
        );
      }),
  }),
);

const Injected = withDi(AddMonthModal, [
  inOctoberDi,
  patternsDi,
  configDi,
  optionsDi,
  createDi,
]);

export default {};

/** The dialog, open at first, with a button that opens it again. */
function DefaultDialog() {
  const [isOpen, setOpen] = useState(true);
  return (
    <>
      <Button kind="secondary" shape="block" onClick={() => setOpen(true)}>
        + Add month
      </Button>
      <Injected isOpen={isOpen} onClose={() => setOpen(false)} />
    </>
  );
}

// The design's "Add a month, default" state: October 2026 to October 2027,
// the earliest month selected and Facility patterns collapsed. Generate
// creates the selected months a second and a half later and closes the
// dialog.
export const Default = () => <DefaultDialog />;
