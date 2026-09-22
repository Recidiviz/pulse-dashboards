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

import { AnnouncementBanner } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsAzTranslations } from "~@jii/translation";

import { useShowIONBanner } from "./useShowIONBanner";

export const IONBanner = observer(function IONBanner() {
  const { t } = useUsAzTranslations();
  if (!useShowIONBanner()) return null;

  return (
    <AnnouncementBanner
      message={t(($) => $.ion.banner.message)}
      linkText={t(($) => $.ion.banner.linkText)}
      to={State.Resident.$.UsAzMoreInformation.ION.buildRelativePath({})}
    />
  );
});
