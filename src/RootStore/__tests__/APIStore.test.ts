// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import API from "../APIStore";

const MockUserStore = jest.fn(() => {
  return {
    getToken: () => "token",
    stateCode: "US_TN",
  };
}) as jest.Mock;

afterEach(() => {
  jest.resetAllMocks();
});

describe("Testing APIStore", () => {
  const api = new API(MockUserStore());

  it("testing csrf token updated", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          ok: () => Promise.resolve(true),
          json: () =>
            Promise.resolve({
              json: () =>
                Promise.resolve({
                  csrf: "a1b2c3",
                }),
            }),
        })
      ) as jest.Mock
    );

    await api.initializeSession();

    expect(api.csrfToken).toBe("a1b2c3");
  });
});
