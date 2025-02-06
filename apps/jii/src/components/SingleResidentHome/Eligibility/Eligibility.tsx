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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, Fragment } from "react";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { ComparisonTeaser } from "../../OpportunityComparison/ComparisonTeaser";
import { useResidentsContext } from "../../ResidentsHydrator/context";
import { useSingleResidentContext } from "../../SingleResidentHydrator/context";
import { EligibilityPresenter } from "./EligibilityPresenter";
import { OpportunityCard } from "./OpportunityCard";

const Divider = styled.hr`
  border: 1px solid ${palette.slate20};
  margin: ${rem(spacing.xl)} 0;
`;

const ManagedComponent: FC<{ presenter: EligibilityPresenter }> = observer(
  function Eligibility({ presenter }) {
    const { opportunities, comparison } = presenter;
    return (
      <div>
        {opportunities.map((data, i, { length }) => (
          <Fragment key={data.opportunityId}>
            <OpportunityCard {...data} />
            {i + 1 < length ? <Divider /> : null}
          </Fragment>
        ))}
        {comparison && <ComparisonTeaser config={comparison} />}
      </div>
    );
  },
);

function usePresenter() {
  const { opportunities } = useSingleResidentContext();
  const {
    residentsStore: { config },
  } = useResidentsContext();

  return new EligibilityPresenter(opportunities, config);
}

export const Eligibility = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
