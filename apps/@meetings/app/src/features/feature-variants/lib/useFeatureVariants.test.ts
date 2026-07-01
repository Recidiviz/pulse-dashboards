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

import { renderHook } from "@testing-library/react-native";

import { useFeatureVariants } from "./useFeatureVariants";

const mockUseUserContext = jest.fn();

jest.mock("~@meetings/app/entities/user", () => ({
  useUserContext: () => mockUseUserContext(),
}));

jest.mock("~@meetings/app/shared/config", () => ({
  IS_PROD: false,
}));

const PAST_DATE = "2020-01-01T00:00:00.000Z";
const FUTURE_DATE = "2099-01-01T00:00:00.000Z";

describe("useFeatureVariants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when featureVariants is undefined", () => {
    it("returns false for any variant when not a skip-auth user", () => {
      mockUseUserContext.mockReturnValue({
        featureVariants: undefined,
        isRecidivizUser: false,
        isSkipAuthUser: false,
      });

      const { result } = renderHook(() => useFeatureVariants());

      expect(result.current.isVariantActive("TEST")).toBe(false);
      expect(result.current.isVariantActive("feedbackTab")).toBe(false);
    });

    it("returns true for any variant when skip-auth user", () => {
      mockUseUserContext.mockReturnValue({
        featureVariants: undefined,
        isRecidivizUser: false,
        isSkipAuthUser: true,
      });

      const { result } = renderHook(() => useFeatureVariants());

      expect(result.current.isVariantActive("TEST")).toBe(true);
      expect(result.current.isVariantActive("feedbackTab")).toBe(true);
    });
  });

  describe("when featureVariants is defined", () => {
    it("returns false for a variant not present in featureVariants", () => {
      mockUseUserContext.mockReturnValue({
        featureVariants: {},
        isRecidivizUser: false,
        isSkipAuthUser: false,
      });

      const { result } = renderHook(() => useFeatureVariants());

      expect(result.current.isVariantActive("TEST")).toBe(false);
    });

    it("returns true for a variant with a past activeDate", () => {
      mockUseUserContext.mockReturnValue({
        featureVariants: { TEST: { activeDate: PAST_DATE } },
        isRecidivizUser: false,
        isSkipAuthUser: false,
      });

      const { result } = renderHook(() => useFeatureVariants());

      expect(result.current.isVariantActive("TEST")).toBe(true);
    });

    it("returns false for a variant with a future activeDate", () => {
      mockUseUserContext.mockReturnValue({
        featureVariants: { TEST: { activeDate: FUTURE_DATE } },
        isRecidivizUser: false,
        isSkipAuthUser: false,
      });

      const { result } = renderHook(() => useFeatureVariants());

      expect(result.current.isVariantActive("TEST")).toBe(false);
    });

    it("returns true for any variant when isRecidivizUser, regardless of activeDate", () => {
      mockUseUserContext.mockReturnValue({
        featureVariants: { TEST: { activeDate: FUTURE_DATE } },
        isRecidivizUser: true,
        isSkipAuthUser: false,
      });

      const { result } = renderHook(() => useFeatureVariants());

      expect(result.current.isVariantActive("TEST")).toBe(true);
    });

    it("returns true for a variant with no activeDate in non-prod", () => {
      mockUseUserContext.mockReturnValue({
        featureVariants: { feedbackTab: {} },
        isRecidivizUser: false,
        isSkipAuthUser: false,
      });

      const { result } = renderHook(() => useFeatureVariants());

      expect(result.current.isVariantActive("feedbackTab")).toBe(true);
    });

    describe("in production", () => {
      let useFeatureVariantsProd: typeof useFeatureVariants;

      beforeEach(() => {
        jest.resetModules();
        jest.doMock("~@meetings/app/shared/config", () => ({ IS_PROD: true }));
        jest.doMock("~@meetings/app/entities/user", () => ({
          useUserContext: () => mockUseUserContext(),
        }));

        useFeatureVariantsProd =
          require("./useFeatureVariants").useFeatureVariants;
      });

      afterEach(() => {
        jest.resetModules();
      });

      it("returns false for a variant with no activeDate since none are in DEFAULT_FEATURE_VARIANTS", () => {
        mockUseUserContext.mockReturnValue({
          featureVariants: { feedbackTab: {} },
          isRecidivizUser: false,
          isSkipAuthUser: false,
        });

        const { result } = renderHook(() => useFeatureVariantsProd());

        expect(result.current.isVariantActive("feedbackTab")).toBe(false);
      });

      it("returns true for a variant with a past activeDate in production", () => {
        mockUseUserContext.mockReturnValue({
          featureVariants: { feedbackTab: { activeDate: PAST_DATE } },
          isRecidivizUser: false,
          isSkipAuthUser: false,
        });

        const { result } = renderHook(() => useFeatureVariantsProd());

        expect(result.current.isVariantActive("feedbackTab")).toBe(true);
      });
    });
  });
});
