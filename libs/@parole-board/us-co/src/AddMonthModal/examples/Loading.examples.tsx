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
  mutationResult,
  queryResult,
  suspendedQuery,
} from "~@parole-board/common/fixtures";

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
const optionsDi = injectable(useAddMonthOptions, suspendedQuery);
const createDi = injectable(
  useCreateMonths,
  (): ReturnType<typeof useCreateMonths> => mutationResult(),
);

const Injected = withDi(AddMonthModal, [
  inOctoberDi,
  patternsDi,
  configDi,
  optionsDi,
  createDi,
]);

export default {};

// The skeleton while months.addOptions loads: the heading and subtitle, with
// placeholders for the tiles and Facility patterns, above Cancel and a
// disabled Generate.
export const Default = () => <Injected isOpen onClose={() => undefined} />;
