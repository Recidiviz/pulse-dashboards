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

const mockIntercomAppId = "some app id";

describe("initIntercomSettings tests", () => {
  const intercom = vi.fn();
  let initIntercomSettings;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("Intercom", intercom);
    vi.stubEnv("VITE_INTERCOM_APP_ID", mockIntercomAppId);

    initIntercomSettings = (await import("../initIntercomSettings")).default;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should set intercom app id and boot hidden intercom with settings", () => {
    initIntercomSettings();

    expect(window.intercomSettings.app_id).toBe(mockIntercomAppId);
    expect(intercom).toHaveBeenCalledWith("boot", {
      app_id: mockIntercomAppId,
      hide_default_launcher: true,
    });
  });
});
