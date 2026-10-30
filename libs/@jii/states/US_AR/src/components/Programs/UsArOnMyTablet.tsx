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

import { FC } from "react";

import { HomepageSectionHeading } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { LastUpdatedBanner } from "~@jii/layout";
import { useUsArTranslations } from "~@jii/translation";

import { isPaaResident } from "../../isPaaResident";
import { IneligibleCard } from "./IneligibleCard";
import { PolicyExplainerCard } from "./PolicyExplainerCard";
import { PROGRAMS_NAV_BAR_HEIGHT } from "./ProgramsNavBar/ProgramsNavBar.styles";

export const UsArOnMyTablet: FC = () => {
  const metadata = useResidentMetadata("US_AR");
  const { t } = useUsArTranslations();

  return (
    <>
      <LastUpdatedBanner
        lastUpdatedDate={metadata.edovoLastRefreshedAt}
        stickyOffset={PROGRAMS_NAV_BAR_HEIGHT}
      />
      <HomepageSectionHeading>
        {t(($) => $.programs.onMyTablet.title)}
      </HomepageSectionHeading>
      {isPaaResident(metadata) ? <PolicyExplainerCard /> : <IneligibleCard />}
    </>
  );
};
