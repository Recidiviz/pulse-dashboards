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

import { CopyWrapper, GoButton } from "~@jii/common-ui";
import { usePageTitle } from "~@jii/common-ui";
import { useRootStore, UserStore } from "~@jii/data";
import { ScreenFillingWrapper } from "~@jii/layout";
import { useUsMaTranslations } from "~@jii/translation";

import { Disclaimer } from "../Disclaimer/Disclaimer";

function trackOnboardingSeen(userStore: UserStore) {
  if (!userStore.getUserProperty("egtOnboardingSeen")) {
    userStore.setUserProperty("egtOnboardingSeen", formatISO(Date.now()));
  }
}

export const Onboarding = observer(function Onboarding() {
  const { userStore } = useRootStore();
  const { t } = useUsMaTranslations();

  usePageTitle(t(($) => $.onboarding.heading));
  useEffect(() => trackOnboardingSeen(userStore), [userStore]);

  return (
    <ScreenFillingWrapper
      top={
        <>
          <CopyWrapper>
            {`# ${t(($) => $.onboarding.heading)}\n\n${t(($) => $.onboarding.body)}`}
          </CopyWrapper>
          <GoButton to="../">{t(($) => $.onboarding.continueLink)}</GoButton>
        </>
      }
      bottom={<Disclaimer />}
    />
  );
});
