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

import { User } from "lucide-react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { GoLink } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { QUESTIONNAIRE_STATUS_COPY } from "../../../ctaConfigs";
import { Content, Description, Heading, Wrapper } from "./ReviewCard.styles";

export const ReviewCard = () => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);
  const { reviewProfile } = QUESTIONNAIRE_STATUS_COPY.completed(t);

  return (
    <Wrapper>
      <User size={20} />
      <Content>
        <Heading>{reviewProfile.heading}</Heading>
        <Description>{reviewProfile.description}</Description>
      </Content>
      <GoLink
        to={State.Resident.UsMaReentry.Questionnaire.buildPath(routeParams)}
      >
        {reviewProfile.cta}
      </GoLink>
    </Wrapper>
  );
};
