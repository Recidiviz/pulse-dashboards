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

import { FC } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import calendarImgUrl from "../../assets/images/calendar-clock.svg";
import { State } from "../../routes/routes";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { TeaserLink } from "../TeaserLink/TeaserLink";

export const ProgressPageTeaser: FC = () => {
  const {
    residentsStore: {
      config: { progress },
    },
  } = useResidentsContext();
  const urlParams = useTypedParams(State.Resident);

  const progressPage = progress?.progressPage;

  // not expected to render if this is missing, but we check for type safety
  if (!progressPage) return null;

  return (
    <TeaserLink
      teaserText={progressPage.teaserText}
      imageUrl={calendarImgUrl}
      linkProps={{
        children: progressPage.linkText,
        to: State.Resident.Progress.InfoPage.buildPath({
          ...urlParams,
          pageSlug: progressPage.urlSlug,
        }),
      }}
    />
  );
};
