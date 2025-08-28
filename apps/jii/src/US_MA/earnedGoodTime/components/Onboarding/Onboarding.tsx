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

import { formatISO } from "date-fns";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

import { GoButton } from "~@jii/common-ui";

import { ScreenFillingWrapper } from "../../../../common/components/ScreenFillingWrapper/ScreenFillingWrapper";
import { CopyWrapper } from "../../../../components/CopyWrapper/CopyWrapper";
import { useRootStore } from "../../../../components/StoreProvider/useRootStore";
import { usePageTitle } from "../../../../components/usePageTitle/usePageTitle";
import { UserStore } from "../../../../datastores/UserStore";
import { Disclaimer } from "../Disclaimer/Disclaimer";
import { useEGTDataContext } from "../EGTDataContext/context";

function trackOnboardingSeen(userStore: UserStore) {
  if (!userStore.getUserProperty("egtOnboardingSeen")) {
    userStore.setUserProperty("egtOnboardingSeen", formatISO(Date.now()));
  }
}

export const Onboarding = observer(function Onboarding() {
  const {
    copy: { onboarding },
  } = useEGTDataContext();
  const { userStore } = useRootStore();

  usePageTitle(onboarding.heading);
  useEffect(() => trackOnboardingSeen(userStore), [userStore]);

  return (
    <ScreenFillingWrapper
      top={
        <>
          <CopyWrapper>
            {`# ${onboarding.heading}\n\n${onboarding.body}`}
          </CopyWrapper>
          <GoButton to="../">{onboarding.continueLink}</GoButton>
        </>
      }
      bottom={<Disclaimer />}
    />
  );
});
