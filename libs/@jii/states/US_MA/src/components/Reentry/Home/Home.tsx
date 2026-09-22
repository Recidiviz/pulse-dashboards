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

import { usePageTitle } from "~@jii/common-ui";
import { firstNameLastName, useSingleResidentContext } from "~@jii/data";
import { useUsMaTranslations } from "~@jii/translation";

import { GuideCta } from "./GuideCta/GuideCta";
import { Greeting, Wrapper } from "./Home.styles";
import { QuestionnaireCta } from "./QuestionnaireCta/QuestionnaireCta";
import { ResourceCategoryCta } from "./ResourceCategoryCta/ResourceCategoryCta";

export const Home = () => {
  const { t } = useUsMaTranslations();
  const { resident } = useSingleResidentContext();

  usePageTitle(t(($) => $.reentry.overview.pageTitle));

  return (
    <Wrapper>
      <Greeting>
        {t(($) => $.reentry.overview.greeting, {
          name: firstNameLastName(resident),
        })}
      </Greeting>
      <QuestionnaireCta />
      <ResourceCategoryCta />
      <GuideCta />
    </Wrapper>
  );
};
