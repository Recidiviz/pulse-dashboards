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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { Card, GoLink, HomepageSectionHeading } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsArTranslations } from "~@jii/translation";

import ProgramsCtaIllustration from "./ProgramsCtaIllustration";

const CtaCard = styled(Card)`
  padding: 0;
  display: flex;
`;

const Illustration = styled(ProgramsCtaIllustration)`
  flex-shrink: 0;
`;

const CardContent = styled.div`
  padding: ${rem(spacing.lg)};
`;

const CardHeading = styled.h3`
  ${typography.Sans24}
`;

const CardDescription = styled.p`
  ${typography.Sans16}
  color: black;
`;

export function ProgramsCta() {
  const { t } = useUsArTranslations();
  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.programs.homepageCta.sectionHeader)}
      </HomepageSectionHeading>
      <CtaCard>
        <Illustration />
        <CardContent>
          <CardHeading>{t(($) => $.programs.homepageCta.heading)}</CardHeading>
          <CardDescription>
            {t(($) => $.programs.homepageCta.description)}
          </CardDescription>
          <GoLink to={State.Resident.$.UsArPrograms.buildRelativePath({})}>
            {t(($) => $.programs.homepageCta.link)}
          </GoLink>
        </CardContent>
      </CtaCard>
    </section>
  );
}
