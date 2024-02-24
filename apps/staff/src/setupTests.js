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
import "@testing-library/jest-dom/extend-expect";
import "@testing-library/react-hooks/dont-cleanup-after-each";
import "jest-canvas-mock";
import "jest-styled-components";

import { ResizeObserver } from "@juggle/resize-observer";
import { cleanup } from "@testing-library/react";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { configure } from "enzyme";
import { toHaveNoViolations } from "jest-axe";
import * as matchers from "jest-extended";
import { configure as configureMobx } from "mobx";
import { createMocks } from "react-idle-timer";
import { MessageChannel } from "worker_threads";

import { initI18n } from "./utils/i18nSettings";

jest.mock("./assets/static/images/tealStar.svg", () => ({
  ReactComponent: () => {
    return <div />;
  },
}));

beforeAll(() => {
  createMocks();
  // prevents `ReferenceError: MessageChannel is not defined`
  global.MessageChannel = MessageChannel;
});

afterAll(cleanup);

expect.extend(matchers);

expect.extend(toHaveNoViolations);

configureMobx({
  enforceActions: "never",
});

initI18n();

configure({ adapter: new Adapter() });

process.env = {
  ...process.env,
  REACT_APP_TEST_ENV: true,
  REACT_APP_METADATA_NAMESPACE: "test-metadata-namespace/",
};

// mock analytics configuration
window.analytics = {
  track: jest.fn(),
};

window.scrollTo = jest.fn();

window.prompt = jest.fn();

window.ResizeObserver = ResizeObserver;
