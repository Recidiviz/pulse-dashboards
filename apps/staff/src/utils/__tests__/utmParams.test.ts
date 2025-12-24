// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import {
  extractUTMParams,
  getStoredUTMParams,
  storeUTMParams,
} from "../utmParams";

describe("utmParams", () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  describe("extractUTMParams", () => {
    it("extracts all UTM parameters from a URL", () => {
      const url =
        "?utm_source=email&utm_medium=newsletter&utm_campaign=launch&utm_term=product&utm_content=header";
      const params = extractUTMParams(url);

      expect(params).toEqual({
        utm_source: "email",
        utm_medium: "newsletter",
        utm_campaign: "launch",
        utm_term: "product",
        utm_content: "header",
      });
    });

    it("extracts only present UTM parameters", () => {
      const url = "?utm_source=email&utm_campaign=campaign-1";
      const params = extractUTMParams(url);

      expect(params).toEqual({
        utm_source: "email",
        utm_campaign: "campaign-1",
      });
    });

    it("returns empty object when no UTM parameters present", () => {
      const url = "?foo=bar&baz=qux";
      const params = extractUTMParams(url);

      expect(params).toEqual({});
    });

    it("handles URLs without query prefix", () => {
      const url = "utm_source=google&utm_medium=cpc";
      const params = extractUTMParams(url);

      expect(params).toEqual({
        utm_source: "google",
        utm_medium: "cpc",
      });
    });

    it("ignores non-UTM parameters", () => {
      const url = "?utm_source=facebook&foo=bar&utm_campaign=awareness&baz=qux";
      const params = extractUTMParams(url);

      expect(params).toEqual({
        utm_source: "facebook",
        utm_campaign: "awareness",
      });
    });

    it("handles empty string", () => {
      const params = extractUTMParams("");

      expect(params).toEqual({});
    });

    it("ignores non-string parameter values", () => {
      // URLSearchParams can return arrays or objects for complex query strings
      const url = "?utm_source=test&utm_campaign[]=one&utm_campaign[]=two";
      const params = extractUTMParams(url);

      // Should only include utm_source since utm_campaign is an array
      expect(params).toEqual({
        utm_source: "test",
      });
    });
  });

  describe("storeUTMParams", () => {
    it("stores UTM parameters in sessionStorage", () => {
      const params = {
        utm_source: "email",
        utm_campaign: "test",
      };

      storeUTMParams(params);

      const stored = sessionStorage.getItem("utm_params");
      expect(stored).toBe(JSON.stringify(params));
    });

    it("does not store empty object", () => {
      storeUTMParams({});

      const stored = sessionStorage.getItem("utm_params");
      expect(stored).toBeNull();
    });

    it("overwrites existing stored parameters", () => {
      const params1 = { utm_source: "first" };
      const params2 = { utm_source: "second", utm_campaign: "new" };

      storeUTMParams(params1);
      storeUTMParams(params2);

      const stored = sessionStorage.getItem("utm_params");
      expect(stored).toBe(JSON.stringify(params2));
    });
  });

  describe("getStoredUTMParams", () => {
    it("retrieves stored UTM parameters", () => {
      const params = {
        utm_source: "email",
        utm_campaign: "test",
        utm_medium: "newsletter",
      };

      sessionStorage.setItem("utm_params", JSON.stringify(params));

      const retrieved = getStoredUTMParams();
      expect(retrieved).toEqual(params);
    });

    it("returns empty object when no parameters are stored", () => {
      const retrieved = getStoredUTMParams();

      expect(retrieved).toEqual({});
    });

    it("returns empty object and logs error when stored data is invalid JSON", () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      sessionStorage.setItem("utm_params", "invalid json{");

      const retrieved = getStoredUTMParams();

      expect(retrieved).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error parsing stored UTM parameters:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("integration: extract, store, and retrieve", () => {
    it("full flow works correctly", () => {
      // Extract from URL
      const url = "?utm_source=linkedin&utm_campaign=jobs&utm_medium=social";
      const extracted = extractUTMParams(url);

      // Store them
      storeUTMParams(extracted);

      // Retrieve them
      const retrieved = getStoredUTMParams();

      expect(retrieved).toEqual({
        utm_source: "linkedin",
        utm_campaign: "jobs",
        utm_medium: "social",
      });
    });
  });
});
