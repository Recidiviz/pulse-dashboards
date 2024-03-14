/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import isIE11 from "../isIE11";

describe("isIE11", () => {
  let userAgentGetter;

  beforeEach(() => {
    userAgentGetter = vi.spyOn(window.navigator, "userAgent", "get");
  });

  it("returns true if the user agent is IE11", () => {
    userAgentGetter.mockReturnValue(
      "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; Touch; rv:11.0) like Gecko",
    );
    expect(isIE11()).toBe(true);
  });

  it("returns false if the user agent is Edge", () => {
    userAgentGetter.mockReturnValue(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36 Edg/99.0.1150.36",
    );
    expect(isIE11()).toBe(false);
  });

  it("returns false if the user agent is Chrome", () => {
    userAgentGetter.mockReturnValue(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36",
    );
    expect(isIE11()).toBe(false);
  });

  it("returns false if the user agent is Firefox", () => {
    userAgentGetter.mockReturnValue(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
    );
    expect(isIE11()).toBe(false);
  });

  it("returns false if the user agent is Opera", () => {
    userAgentGetter.mockReturnValue(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36 OPR/85.0.4341.18",
    );
    expect(isIE11()).toBe(false);
  });
});
