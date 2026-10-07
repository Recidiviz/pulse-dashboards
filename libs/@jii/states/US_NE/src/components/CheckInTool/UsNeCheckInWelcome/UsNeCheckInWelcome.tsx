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

import { useUsNeTranslations } from "~@jii/translation";

import { useResidentGivenNames } from "../hooks/useResidentGivenNames";
import { InfoBox } from "../styles";
import { useUsNeCheckInContext } from "../UsNeCheckInContext";
import { UsNeCheckInFooter } from "../UsNeCheckInFooter/UsNeCheckInFooter";
import {
  Description,
  WelcomeHeading,
  Wrapper,
} from "./UsNeCheckInWelcome.styles";

export const UsNeCheckInWelcome = () => {
  const { markSeen } = useUsNeCheckInContext();
  const { t } = useUsNeTranslations();

  const { heading, description, info } = t(($) => $.checkIn.welcome, {
    returnObjects: true,
    name: useResidentGivenNames(),
  });

  return (
    <Wrapper>
      <WelcomeHeading>{heading}</WelcomeHeading>

      <Description>{description}</Description>

      <InfoBox>
        <Description>{info}</Description>
      </InfoBox>

      <UsNeCheckInFooter
        onButtonClick={() => markSeen({ screenKind: "welcome" })}
        buttonText={t(($) => $.checkIn.footer.getStarted)}
      />
    </Wrapper>
  );
};
