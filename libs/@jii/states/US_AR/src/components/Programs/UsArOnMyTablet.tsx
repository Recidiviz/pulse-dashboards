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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components";

import { BackLink } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { LastUpdatedBanner } from "~@jii/layout";
import { State } from "~@jii/paths";
import { useUsArTranslations } from "~@jii/translation";

import { isPaaResident } from "../../isPaaResident";
import { EdovoProgressCard } from "./EdovoProgressCard/EdovoProgressCard";
import { GoToCoursesButton } from "./GoToCoursesButton";
import { IneligibleCard } from "./IneligibleCard";
import { PolicyExplainerCard } from "./PolicyExplainerCard";
import { PROGRAMS_NAV_BAR_HEIGHT } from "./ProgramsNavBar/ProgramsNavBar.styles";

const Header = styled.header`
  margin-top: ${rem(spacing.lg)};
`;

export const UsArOnMyTablet: FC = () => {
  const metadata = useResidentMetadata("US_AR");
  const { t } = useUsArTranslations();
  const pathParams = useTypedParams(State.Resident);

  return (
    <>
      <LastUpdatedBanner
        lastUpdatedDate={metadata.edovoLastRefreshedAt}
        stickyOffset={PROGRAMS_NAV_BAR_HEIGHT}
      />
      <Header>
        <BackLink to={State.Resident.buildPath(pathParams)}>
          {t(($) => $.programs.backLink)}
        </BackLink>
      </Header>
      {isPaaResident(metadata) ? (
        <>
          <EdovoProgressCard />
          <PolicyExplainerCard />
          <GoToCoursesButton />
        </>
      ) : (
        <IneligibleCard />
      )}
    </>
  );
};
