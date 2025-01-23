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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { State } from "../../../routes/routes";
import { GoButton } from "../../ButtonLink/GoButton";
import { EligibilityStatusChip } from "../../EligibilityStatusChip/EligibilityStatusChip";
import { OpportunityData } from "../../SingleResidentHydrator/context";

const Wrapper = styled.article`
  align-items: start;
  column-gap: ${rem(spacing.lg)};
  display: grid;
  grid-template-columns: 1fr auto;
  text-wrap: balance;

  h3 {
    ${typography.Sans24}
  }

  p {
    ${typography.Sans14}

    color: ${palette.slate85};
    margin: ${rem(spacing.md)} 0 ${rem(spacing.lg)};
  }
`;

export const OpportunityCard: FC<OpportunityData> = ({
  eligibilityReport,
  opportunityConfig: { urlSlug },
}) => {
  return (
    <Wrapper>
      <h3>{eligibilityReport.name}</h3>
      <EligibilityStatusChip {...eligibilityReport.status} />
      <div>
        <p>{eligibilityReport.description}</p>
        <GoButton
          to={State.Resident.$.Eligibility.Opportunity.buildRelativePath({
            opportunitySlug: urlSlug,
          })}
        >
          Learn more
        </GoButton>
      </div>
    </Wrapper>
  );
};
