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
import { useRootStore, useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsCoTranslations } from "~@jii/translation";

export const AETBanner: FC = () => {
  const { t } = useUsCoTranslations();
  const { residentFlags } = useSingleResidentContext();
  const {
    userStore: { segmentClient },
  } = useRootStore();

  const showEdovoCredits = residentFlags.usCoEdovoCredits;

  useEffect(() => {
    if (!showEdovoCredits) return;
    segmentClient.trackAetCalloutImpression({
      placement: "homepage",
    });
  }, [showEdovoCredits, segmentClient]);

  const handleLinkClick = () => {
    if (!showEdovoCredits) return;
    segmentClient.trackAetCalloutClicked({ placement: "homepage" });
  };
  // TODO(OBT-49104) remove policyPage copy
  const { message, linkText } = showEdovoCredits
    ? t(($) => $.aetBanner.edovoCredits, { returnObjects: true })
    : t(($) => $.aetBanner.policyPage, { returnObjects: true });

  return (
    <AnnouncementBanner
      message={message}
      linkText={linkText}
      // TODO(OBT-49104) remove AETChanges route and page
      to={
        showEdovoCredits
          ? State.Resident.$.ProgramCatalog.buildRelativePath({})
          : State.Resident.$.UsCoMoreInformation.AETChanges.buildRelativePath(
              {},
            )
      }
      onLinkClick={handleLinkClick}
    />
  );
};
