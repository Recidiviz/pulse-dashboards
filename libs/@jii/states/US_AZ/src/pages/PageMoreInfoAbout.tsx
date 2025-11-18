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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { usePageTitle } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsAzTranslations } from "~@jii/translation";

import { DefinitionView } from "../components/DefinitionView";

export function PageMoreInfoAbout() {
  const { t } = useUsAzTranslations();

  usePageTitle(t(($) => $.about.heading));
  const pathParams = useTypedParams(State.Resident.UsAzMoreInformation);

  return (
    <DefinitionView
      heading={t(($) => $.about.heading)}
      body={t(($) => $.about.body)}
      moreInfoPageLinks={[
        {
          text: t(($) => $.homePageLinkText),
          url: State.Resident.buildPath(pathParams),
        },
        {
          text: t(($) => $.importantDates.moreInfo.heading),
          url: State.Resident.UsAzMoreInformation.ImportantDates.buildPath(
            pathParams,
          ),
        },
      ]}
    />
  );
}
