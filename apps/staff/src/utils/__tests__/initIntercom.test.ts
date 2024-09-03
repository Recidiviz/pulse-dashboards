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

import Intercom from "@intercom/messenger-js-sdk";
import { vi } from "vitest";

import initIntercomSettings from "../initIntercom";

const mockIntercomAppId = "some app id";

vi.mock("@intercom/messenger-js-sdk");

describe("initIntercomSettings tests", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("VITE_INTERCOM_APP_ID", mockIntercomAppId);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should set intercom app id and boot hidden intercom with settings", () => {
    initIntercomSettings();

    expect(Intercom).toHaveBeenCalledWith({
      app_id: mockIntercomAppId,
      hide_default_launcher: true,
    });
  });
});
