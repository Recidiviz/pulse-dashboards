// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import "@testing-library/jest-dom";
import "jest-styled-components";

import { Globals } from "@react-spring/web";
import { toHaveNoViolations } from "jest-axe";
import jestExtendedMatchers from "jest-extended";
import { freeze } from "timekeeper";
import createFetchMock from "vitest-fetch-mock";

import { CURRENT_DATE_FIXTURE } from "~datatypes";

expect.extend(jestExtendedMatchers);

expect.extend(toHaveNoViolations);

const fetchMocker = createFetchMock(vi);

// stub ResizeObserver, which does not exist in JSDOM
class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserver;

beforeAll(() => {
  fetchMocker.enableMocks();

  // speeds up animated transitions in UI tests; they still happen async but complete immediately
  Globals.assign({
    skipAnimation: true,
  });
});

beforeEach(() => {
  freeze(CURRENT_DATE_FIXTURE);

  // because mocks are reset globally between tests we do have to re-enable
  fetchMock.doMock();
});
