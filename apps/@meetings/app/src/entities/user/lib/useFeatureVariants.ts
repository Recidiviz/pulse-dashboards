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

import { IS_PROD } from "~@meetings/app/shared/config";
import type { FeatureVariant } from "~@meetings/trpc-types";

import { useUserContext } from "../model/UserContext";

const DEFAULT_FEATURE_VARIANTS: FeatureVariant[] = [];

export const useFeatureVariants: () => {
  isVariantActive: (variant: FeatureVariant) => boolean;
} = () => {
  const { featureVariants, isRecidivizUser, isSkipAuthUser } = useUserContext();

  if (!featureVariants) {
    return {
      featureVariants: {},
      isVariantActive: () => (isSkipAuthUser ? true : false),
    };
  }

  const isVariantActive = (variant: FeatureVariant) => {
    if (isRecidivizUser) return true;

    const value = featureVariants[variant];
    if (value === undefined) {
      return IS_PROD && DEFAULT_FEATURE_VARIANTS.includes(variant);
    }

    if (typeof value === "object" && value.activeDate)
      return new Date(value.activeDate) <= new Date();
    return !!value;
  };

  return {
    isVariantActive,
  };
};
