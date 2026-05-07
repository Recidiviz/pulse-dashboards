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

import { observer } from "mobx-react-lite";

import { useResidentsContext, useSingleResidentContext } from "~@jii/data";
import { withPresenterManager } from "~hydration-utils";

import { AboutVideoCtaCard } from "./AboutVideoCard";
import { AboutVideoModal } from "./AboutVideoModal";
import { AboutVideoPresenter } from "./AboutVideoPresenter";

const ManagedComponent = observer(function ManagedComponent({
  presenter,
}: {
  presenter: AboutVideoPresenter;
}) {
  if (presenter.ctaIsHidden) return null;

  return (
    <>
      <AboutVideoCtaCard presenter={presenter} />
      <AboutVideoModal presenter={presenter} />
    </>
  );
});

function usePresenter({ onHomepage }: { onHomepage: boolean }) {
  const { residentFlags } = useSingleResidentContext();
  const { residentsStore } = useResidentsContext();

  return new AboutVideoPresenter(
    onHomepage,
    residentFlags.usAzFslImprovements,
    residentsStore,
  );
}

export const AboutVideoCta = withPresenterManager({
  ManagedComponent,
  usePresenter,
  managerIsObserver: true,
});
