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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { Card } from "../../../../../common/components/Card";
import { GoButton } from "../../../../../components/ButtonLink/GoButton";
import { hydrateTemplate } from "../../../../../configs/hydrateTemplate";
import { State } from "../../../../../routes/routes";
import { useEGTDataContext } from "../../EGTDataContext/context";
import { CardHeading, TwoColumnWrapper } from "../../styles";
import { CardValue, HomepageSectionHeading } from "../styles";

const Wrapper = styled.section`
  ${TwoColumnWrapper} {
    margin-bottom: ${rem(spacing.sm)};
  }
`;

export const TotalTimeEarnedSection = () => {
  const {
    data,
    copy: {
      home: { totalTimeEarned },
    },
  } = useEGTDataContext();

  return (
    <Wrapper>
      <HomepageSectionHeading>
        {totalTimeEarned.sectionTitle}
      </HomepageSectionHeading>
      <TwoColumnWrapper>
        <Card style={{ flex: "1" }}>
          <CardHeading>{totalTimeEarned.egt.label}</CardHeading>
          <CardValue>
            {hydrateTemplate(totalTimeEarned.egt.value, data)}
          </CardValue>
        </Card>
        <Card style={{ flex: "1" }}>
          <CardHeading>{totalTimeEarned.credits.label}</CardHeading>
          <CardValue>
            {hydrateTemplate(totalTimeEarned.credits.value, data)}
          </CardValue>
        </Card>
      </TwoColumnWrapper>
      <GoButton
        to={State.Resident.EGT.$.Definition.buildRelativePath({
          pageSlug: "credits",
        })}
      >
        {totalTimeEarned.learnMoreLink}
      </GoButton>
    </Wrapper>
  );
};
