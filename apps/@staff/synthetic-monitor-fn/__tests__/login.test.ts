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

import type { Page } from "playwright-core";

import { LOGIN_SELECTORS, signIn } from "../src/login";

function createFakePage() {
  return {
    goto: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue(undefined),
  };
}

const CONFIG = {
  url: "https://dashboard-staging.recidiviz.org",
  username: "synthetic@example.com",
  password: "hunter2",
  stateCode: "US_IA",
};

const ASSERTION = { authenticatedSelector: "[data-testid='us-ia-home']" };

describe("signIn", () => {
  it("drives the identifier-first Auth0 flow then asserts the state element", async () => {
    const page = createFakePage();

    await signIn(page as unknown as Page, CONFIG, ASSERTION);

    expect(page.goto).toHaveBeenCalledWith(
      CONFIG.url,
      expect.objectContaining({ waitUntil: "domcontentloaded" }),
    );
    // email first, then password — in that order.
    expect(page.fill).toHaveBeenNthCalledWith(
      1,
      LOGIN_SELECTORS.username,
      CONFIG.username,
    );
    expect(page.fill).toHaveBeenNthCalledWith(
      2,
      LOGIN_SELECTORS.password,
      CONFIG.password,
    );
    // continue clicked once after each field.
    expect(page.click).toHaveBeenCalledTimes(2);
    expect(page.click).toHaveBeenNthCalledWith(1, LOGIN_SELECTORS.submit);
    expect(page.click).toHaveBeenNthCalledWith(2, LOGIN_SELECTORS.submit);
    // success is gated on the state's assertion selector appearing.
    expect(page.waitForSelector).toHaveBeenCalledWith(
      ASSERTION.authenticatedSelector,
      expect.any(Object),
    );
  });

  it("propagates a failure when the assertion selector never appears", async () => {
    const page = createFakePage();
    page.waitForSelector.mockRejectedValueOnce(new Error("Timeout 45000ms"));

    await expect(
      signIn(page as unknown as Page, CONFIG, ASSERTION),
    ).rejects.toThrow("Timeout 45000ms");
  });
});
