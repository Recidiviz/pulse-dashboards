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

import { FC } from "react";

import { withPresenterManager } from "~hydration-utils";

import { ComparisonTeaser } from "../OpportunityComparison/ComparisonTeaser";
import { useResidentsContext } from "../ResidentsHydrator/context";
import {
  ComparisonTeaserInCopyPresenter,
  ComparisonTeaserInCopyProps,
} from "./ComparisonTeaserInCopyPresenter";
import { ShadowDOM } from "./ShadowDOM";

/**
 * Validates non-typesafe props from free-text copy fields
 * and uses it to render a {@link ComparisonTeaser}, if possible. Otherwise,
 * gracefully falls back to rendering nothing.
 */
const ManagedComponent: FC<{
  presenter: ComparisonTeaserInCopyPresenter;
}> = ({ presenter }) => {
  return presenter.linkProps ? (
    <ShadowDOM>
      <ComparisonTeaser {...presenter.linkProps} />
    </ShadowDOM>
  ) : null;
};

function usePresenter(props: ComparisonTeaserInCopyProps) {
  const {
    residentsStore: { config },
  } = useResidentsContext();
  return new ComparisonTeaserInCopyPresenter(props, config);
}

export const ComparisonTeaserInCopy = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
