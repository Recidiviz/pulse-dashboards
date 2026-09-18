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

import { AnnouncementBanner } from "~@jii/common-ui";
import { AboutVideoCta } from "~@jii/onboarding-video";
import { useCommonTranslations } from "~@jii/translation";

import { UsAzLastUpdatedBanner } from "../UsAzLastUpdatedBanner";
import { UsAzImportantDates } from "./UsAzImportantDates";
import { UsAzImportantDatesLink } from "./UsAzImportantDatesLink";

export function UsAzSingleResidentHome() {
  const { t } = useCommonTranslations();

  return (
    <>
      <UsAzLastUpdatedBanner />
      <AnnouncementBanner message={t(($) => $.homepageAnnouncement)} />
      <AboutVideoCta onHomepage={true} />
      <UsAzImportantDates />
      <UsAzImportantDatesLink />
    </>
  );
}
