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

import { palette, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, memo } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import compareIconUrl from "../../assets/images/compare-arrows.svg";
import { ComparisonPageConfig } from "../../configs/types";
import { State } from "../../routes/routes";
import { GoButton } from "../ButtonLink/GoButton";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { ComparisonLinkPresenter } from "./ComparisonLinkPresenter";

const Wrapper = styled.article`
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(spacing.sm)};
  display: flex;
  gap: ${rem(spacing.lg)};
  margin: ${rem(spacing.xl)} 0;
  padding: ${rem(spacing.xl)};
  text-wrap: balance;

  p {
    margin-top: 0;
  }
`;

const ManagedComponent: FC<{ presenter: ComparisonLinkPresenter }> = memo(
  function ComparisonLink({ presenter }) {
    const personParams = useTypedParams(State.Resident);
    return (
      <Wrapper>
        <img src={compareIconUrl} width={40} height={40} alt="" />
        <div>
          <p>{presenter.text}</p>
          <GoButton
            to={State.Resident.Eligibility.Comparison.buildPath({
              ...personParams,
              ...presenter.link.params,
            })}
          >
            {presenter.link.text}
          </GoButton>
        </div>
      </Wrapper>
    );
  },
);

export type ComparisonLinkProps = { config: ComparisonPageConfig };

function usePresenter({ config }: ComparisonLinkProps) {
  const {
    residentsStore: {
      config: { incarcerationOpportunities },
    },
  } = useResidentsContext();
  return new ComparisonLinkPresenter(config, incarcerationOpportunities);
}

export const ComparisonLink = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
