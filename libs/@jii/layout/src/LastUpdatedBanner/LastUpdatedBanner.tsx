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

import { observer } from "mobx-react-lite";

import { useCommonTranslations } from "~@jii/translation";

import { FullWidthBanner } from "./FullWidthBanner";

type LastUpdatedBannerProps =
  | {
      lastUpdatedDate: Date | undefined;
      noDateCopy?: string;
      overrideCopy?: never;
    }
  | {
      lastUpdatedDate?: never;
      noDateCopy?: never;
      overrideCopy: string;
    };

/**
 * A top-of-page banner about when information was last updated.
 *
 * By default, displays a locale-aware message from the common translations
 * including the `lastUpdatedDate` if defined. If the date is not defined, either
 * displays `noDateCopy` instead of the message or, if there is no copy provided,
 * the banner is hidden.
 *
 * Alternatively, if `overrideCopy` is provided, displays that instead, e.g. where
 * the default message from the common translations doesn't work well for a state.
 */
export const LastUpdatedBanner = observer(function LastUpdatedBanner({
  lastUpdatedDate,
  noDateCopy,
  overrideCopy,
}: LastUpdatedBannerProps) {
  const { t } = useCommonTranslations();

  if (overrideCopy) {
    return <FullWidthBanner>{overrideCopy}</FullWidthBanner>;
  }

  if (!lastUpdatedDate) {
    if (!noDateCopy) return null;

    return <FullWidthBanner>{noDateCopy}</FullWidthBanner>;
  }

  return (
    <FullWidthBanner>
      {t(($) => $.lastUpdated, { lastUpdatedDate })}
    </FullWidthBanner>
  );
});
