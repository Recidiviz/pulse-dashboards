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

import { withShadowDOM } from "~@jii/common-ui";
import { useResidentsContext } from "~@jii/data";
import { State } from "~@jii/paths";

import { TeaserLink } from "../TeaserLink/TeaserLink";
import calendarImgUrl from "./calendar-clock.svg";

export const ProgressPageTeaser: FC = withShadowDOM(() => {
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
});
