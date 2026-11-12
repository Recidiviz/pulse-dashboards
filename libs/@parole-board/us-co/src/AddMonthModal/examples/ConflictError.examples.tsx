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

import { injectable, withDi } from "react-magnetic-di";

import {
  useAddMonthOptions,
  useCalendarConfig,
  useCreateMonths,
  useCurrentPatterns,
} from "~@parole-board/common";
import {
  addMonthChoices,
  calendarApiError,
  mutationResult,
  queryResult,
} from "~@parole-board/common/fixtures";

import { useCurrentYearMonth } from "../../model/useCurrentYearMonth";
import { AddMonthModal } from "../AddMonthModal";
import { SubmitOnOpen } from "./support/SubmitOnOpen";

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
const createDi = injectable(
  useCreateMonths,
  (): ReturnType<typeof useCreateMonths> => ({
    ...mutationResult(),
    mutateAsync: () =>
      Promise.reject(
        calendarApiError(
          "CONFLICT",
          "October 2026 already exists. Refresh to see it.",
        ),
      ),
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

// The example presses Generate as the dialog opens, and the server refuses
// the create because a month already exists, so its message shows above the
// buttons. The design has no error state.
export const Default = () => (
  <>
    <Injected isOpen onClose={() => undefined} />
    <SubmitOnOpen />
  </>
);
