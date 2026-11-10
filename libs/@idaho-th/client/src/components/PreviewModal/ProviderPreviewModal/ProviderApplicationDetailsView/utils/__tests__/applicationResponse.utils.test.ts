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

import { getLatestProviderMessage } from "../applicationResponse.utils";

describe("getLatestProviderMessage", () => {
  it("returns the provider-authored message in the thread", () => {
    const messages = [
      {
        senderType: "STAFF",
        body: "CM reply",
        createdAt: new Date("2026-01-02"),
      },
      {
        senderType: "PROVIDER",
        body: "Need criminal history",
        createdAt: new Date("2026-01-01"),
      },
    ];

    expect(getLatestProviderMessage(messages)?.body).toBe(
      "Need criminal history",
    );
  });

  it("returns the latest provider message when several exist", () => {
    const msgs = [
      {
        senderType: "PROVIDER",
        body: "first",
        createdAt: new Date("2026-01-01"),
      },
      {
        senderType: "STAFF",
        body: "staff reply",
        createdAt: new Date("2026-01-02"),
      },
      {
        senderType: "PROVIDER",
        body: "second",
        createdAt: new Date("2026-01-03"),
      },
    ];

    expect(getLatestProviderMessage(msgs)?.body).toBe("second");
  });

  it("picks by createdAt even when a newer provider message appears earlier in the array", () => {
    const msgs = [
      {
        senderType: "PROVIDER",
        body: "newer",
        createdAt: new Date("2026-01-03"),
      },
      {
        senderType: "PROVIDER",
        body: "older",
        createdAt: new Date("2026-01-01"),
      },
    ];

    expect(getLatestProviderMessage(msgs)?.body).toBe("newer");
  });

  it("returns null when the provider has not left an info-request message", () => {
    expect(
      getLatestProviderMessage([
        {
          senderType: "STAFF",
          body: "Reply only",
          createdAt: new Date(),
        },
      ]),
    ).toBeNull();
    expect(getLatestProviderMessage([])).toBeNull();
  });
});
