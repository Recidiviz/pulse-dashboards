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

import { useUserContext } from "~@meetings/app/context/UserContext";
import { IS_PROD } from "~@meetings/app/shared/config";
import type {
  FeatureVariant,
  FeatureVariantValue,
} from "~@meetings/trpc-types";

export type ProcessedFeatureVariantValue = {
  active: boolean;
} & FeatureVariantValue;

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

  const processedVariants = Object.fromEntries(
    Object.entries(featureVariants).map(([key, variant]) => {
      const defaultValue = IS_PROD
        ? DEFAULT_FEATURE_VARIANTS.includes(key as FeatureVariant)
        : true;

      const isActive = variant.activeDate
        ? new Date(variant.activeDate) <= new Date()
        : defaultValue;

      return [
        key as FeatureVariant,
        {
          ...variant,
          active: isRecidivizUser || isActive,
        } as ProcessedFeatureVariantValue,
      ];
    }),
  );

  const isVariantActive = (variant: FeatureVariant) => {
    if (processedVariants?.[variant] === undefined) {
      return false;
    }
    return processedVariants?.[variant]?.active;
  };

  return {
    isVariantActive,
  };
};
