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

import { FC, useEffect } from "react";

import { AnnouncementBanner } from "~@jii/common-ui";
import { useRootStore } from "~@jii/data";
import { useUsMaTranslations } from "~@jii/translation";

/**
 * Announces that the Program List is now available in Spanish.
 */
export const SpanishLaunchBanner: FC = () => {
  const { t } = useUsMaTranslations();
  const {
    userStore: { segmentClient },
  } = useRootStore();

  useEffect(() => {
    segmentClient.trackUsMaSpanishLaunchBannerViewed();
  }, [segmentClient]);

  return (
    <AnnouncementBanner message={t(($) => $.spanishLaunchBanner.message)} />
  );
};
