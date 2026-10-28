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
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { Redirect } from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { withPresenterManager } from "~hydration-utils";

import { UsNycHomePresenter } from "../PageUsNyc/UsNycHomePresenter";
import {
  PageContainer,
  PageHeader,
  SpacedSection,
} from "./PageUsNycHome.styles";

const COPY = {
  title: "Learn more about your case",
};

const ManagedComponent: React.FC<{ presenter: UsNycHomePresenter }> = observer(
  function PageUsNycHome({ presenter }) {
    const residentUrlParams = useTypedParams(State.Resident);

    // Residents without usNycSentenceDatesV1 keep the redirect until a US_NYC
    // home page is designed.
    if (!presenter.shouldShowusNycSentenceDatesV1) {
      return (
        <Redirect
          to={State.Resident.ResourceExplorer.buildPath(residentUrlParams)}
        />
      );
    }

    return (
      <PageContainer>
        <SpacedSection>
          <PageHeader>{COPY.title}</PageHeader>
        </SpacedSection>
      </PageContainer>
    );
  },
);

function usePresenter() {
  const {
    residentFlags: { usNycSentenceDatesV1 },
  } = useSingleResidentContext();
  return new UsNycHomePresenter(!!usNycSentenceDatesV1);
}

export const PageUsNycHome = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
