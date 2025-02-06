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

import { FC, memo } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { withPresenterManager } from "~hydration-utils";

import compareIconUrl from "../../assets/images/compare-arrows.svg";
import { ComparisonPageConfig } from "../../configs/types";
import { State } from "../../routes/routes";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { TeaserLink } from "../TeaserLink/TeaserLink";
import { ComparisonTeaserPresenter } from "./ComparisonTeaserPresenter";

const ManagedComponent: FC<{ presenter: ComparisonTeaserPresenter }> = memo(
  function ComparisonTeaser({ presenter }) {
    const personParams = useTypedParams(State.Resident);

    return (
      <TeaserLink
        teaserText={presenter.text}
        imageUrl={compareIconUrl}
        linkProps={{
          children: presenter.link.text,
          to: State.Resident.Eligibility.Comparison.buildPath({
            ...personParams,
            ...presenter.link.params,
          }),
        }}
      />
    );
  },
);

export type ComparisonTeaserProps = { config: ComparisonPageConfig };

function usePresenter({ config }: ComparisonTeaserProps) {
  const {
    residentsStore: {
      config: { incarcerationOpportunities },
    },
  } = useResidentsContext();
  return new ComparisonTeaserPresenter(config, incarcerationOpportunities);
}

export const ComparisonTeaser = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
