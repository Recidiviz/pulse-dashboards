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

import { matchPath, useLocation } from "react-router-dom";

import { useResidentMetadata } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsAzTranslations } from "~@jii/translation";

export function useInfoPageFooterLinks(): { text: string; url: string }[] {
  const { isDprEligible } = useResidentMetadata("US_AZ");
  const { t } = useUsAzTranslations();
  const { pathname } = useLocation();

  const links: { text: string; url: string }[] = [];
  if (!matchPath(State.Resident.UsAzMoreInformation.About.path, pathname)) {
    links.push({
      url: `../${State.Resident.$.UsAzMoreInformation.About.buildRelativePath({})}`,
      text: t(($) => $.about.heading),
    });
  }
  if (
    !matchPath(State.Resident.UsAzMoreInformation.ImportantDates.path, pathname)
  ) {
    links.push({
      url: `../${State.Resident.$.UsAzMoreInformation.ImportantDates.buildRelativePath({})}`,
      text: t(($) => $.importantDates.moreInfo.heading),
    });
  }
  if (
    isDprEligible &&
    !matchPath(State.Resident.UsAzMoreInformation.DPR.path, pathname)
  ) {
    links.push({
      url: `../${State.Resident.$.UsAzMoreInformation.DPR.buildRelativePath({})}`,
      text: t(($) => $.dprInfoPage.heading),
    });
  }
  return links;
}
