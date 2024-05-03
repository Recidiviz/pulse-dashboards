// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import "vitest-canvas-mock";
import "jest-styled-components";

import { ResizeObserver } from "@juggle/resize-observer";
import { cleanup } from "@testing-library/react";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { configure } from "enzyme";
import { toHaveNoViolations } from "jest-axe";
import * as jestExtendedMatchers from "jest-extended";
import { configure as configureMobx } from "mobx";
import { createMocks } from "react-idle-timer";
import createFetchMock from "vitest-fetch-mock";
import { MessageChannel } from "worker_threads";

import { initI18n } from "./utils/i18nSettings";

const fetchMocker = createFetchMock(vi);

beforeAll(() => {
  createMocks();
  fetchMocker.enableMocks();

  // prevents `ReferenceError: MessageChannel is not defined`
  // @ts-expect-error
  global.MessageChannel = MessageChannel;
});

beforeEach(() => {
  // because mocks are reset globally between tests we do have to re-enable
  fetchMock.doMock();
});

afterAll(cleanup);

expect.extend(jestExtendedMatchers);
expect.extend(toHaveNoViolations);

configureMobx({
  enforceActions: "never",
});

initI18n();

configure({ adapter: new Adapter() });

process.env = {
  ...process.env,
  VITE_TEST_ENV: "true",
  VITE_METADATA_NAMESPACE: "test-metadata-namespace/",
};

// mock analytics configuration
window.analytics = {
  track: vi.fn(),
  page: vi.fn(),
};

// @ts-expect-error
window.scrollTo = vi.fn();

window.prompt = vi.fn();

window.ResizeObserver = ResizeObserver;
