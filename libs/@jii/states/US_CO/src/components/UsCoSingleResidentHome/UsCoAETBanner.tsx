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
import { State } from "~@jii/paths";
import { useUsCoTranslations } from "~@jii/translation";

export const AETBanner: FC = () => {
  const { t } = useUsCoTranslations();
  const {
    userStore: { segmentClient },
  } = useRootStore();

  useEffect(() => {
    segmentClient.trackAetCalloutImpression({
      placement: "homepage",
    });
  }, [segmentClient]);

  const handleLinkClick = () => {
    segmentClient.trackAetCalloutClicked({ placement: "homepage" });
  };
  const copy = t(($) => $.aetBanner.edovoCredits, { returnObjects: true });

  return (
    <AnnouncementBanner
      message={copy.message}
      linkText={copy.linkText}
      to={State.Resident.$.ProgramCatalog.buildRelativePath({})}
      onLinkClick={handleLinkClick}
    />
  );
};
