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

import { spacing, typography } from "@recidiviz/design-system";
import { formatISO } from "date-fns";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { PAGE_LAYOUT_HEADER_GAP } from "../../../../components/AppLayout/constants";
import { GoButton } from "../../../../components/ButtonLink/GoButton";
import { CopyWrapper } from "../../../../components/CopyWrapper/CopyWrapper";
import { useRootStore } from "../../../../components/StoreProvider/useRootStore";
import { usePageTitle } from "../../../../components/usePageTitle/usePageTitle";
import { UserStore } from "../../../../datastores/UserStore";
import { useEGTDataContext } from "../EGTDataContext/context";

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  row-gap: ${rem(spacing.xxl)};
`;

const Disclaimer = styled(CopyWrapper)`
  ${typography.Body14}

  color: ${palette.slate85};
`;

function trackOnboardingSeen(userStore: UserStore) {
  if (!userStore.getUserProperty("egtOnboardingSeen")) {
    userStore.setUserProperty("egtOnboardingSeen", formatISO(Date.now()));
  }
}

export const Onboarding = observer(function Onboarding() {
  const {
    copy: { onboarding },
  } = useEGTDataContext();
  const { uiStore, userStore } = useRootStore();

  usePageTitle(onboarding.heading);
  useEffect(() => trackOnboardingSeen(userStore), [userStore]);

  return (
    <Wrapper
      style={{
        minHeight: `calc(100vh - ${uiStore.stickyHeaderHeight}px - ${rem(PAGE_LAYOUT_HEADER_GAP)})`,
      }}
    >
      <div>
        <CopyWrapper>
          {`# ${onboarding.heading}\n\n${onboarding.body}`}
        </CopyWrapper>
        <GoButton to="../">{onboarding.continueLink}</GoButton>
      </div>
      <Disclaimer>{onboarding.disclaimer}</Disclaimer>
    </Wrapper>
  );
});
