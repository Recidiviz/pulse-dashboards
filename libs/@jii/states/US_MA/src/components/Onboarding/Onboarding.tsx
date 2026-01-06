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

import { observer } from "mobx-react-lite";

import { CopyWrapper, GoButton } from "~@jii/common-ui";
import { usePageTitle } from "~@jii/common-ui";
import { ScreenFillingWrapper, useTrackOnboardingSeen } from "~@jii/layout";
import { useUsMaTranslations } from "~@jii/translation";

import { Disclaimer } from "../Disclaimer/Disclaimer";

export const Onboarding = observer(function Onboarding() {
  const { t } = useUsMaTranslations();

  usePageTitle(t(($) => $.onboarding.heading));

  const trackOnboarding = useTrackOnboardingSeen();

  return (
    <ScreenFillingWrapper
      top={
        <>
          <CopyWrapper>
            {`# ${t(($) => $.onboarding.heading)}\n\n${t(($) => $.onboarding.body)}`}
          </CopyWrapper>
          <GoButton onClick={() => trackOnboarding()} to="../">
            {t(($) => $.onboarding.continueLink)}
          </GoButton>
        </>
      }
      bottom={<Disclaimer />}
    />
  );
});
