/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { toTitleCase } from "../../../../utils";
import { UsIdEarnedDischargeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsIdEarnedDischargeForm";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import idocLogo from "./assets/idocLogo.png";
import {
  FORM_US_ID_EARLY_DISCHARGE_FORM_FONT_FAMILY,
  FORM_US_ID_EARLY_DISCHARGE_LETTER_SPACING,
} from "./FormComponents";

const Logo = styled.img`
  width: 200px;
`;

const ContentContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: ${rem(18)};
`;

const HeadingText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 800px;
`;

const MainHeading = styled.h1`
  font-family: ${FORM_US_ID_EARLY_DISCHARGE_FORM_FONT_FAMILY};
  letter-spacing: ${FORM_US_ID_EARLY_DISCHARGE_LETTER_SPACING};
`;

const Subheading = styled.h2`
  font-family: ${FORM_US_ID_EARLY_DISCHARGE_FORM_FONT_FAMILY};
  letter-spacing: ${FORM_US_ID_EARLY_DISCHARGE_LETTER_SPACING};
`;

const HeadingSeparator = styled.hr`
  border: 1px solid black;
`;

const FormHeading: React.FC = () => {
  const form = useOpportunityFormContext() as UsIdEarnedDischargeForm;

  const supervisionType = toTitleCase(
    form.formData.supervisionType || "Supervision"
  );

  return (
    <div>
      <ContentContainer>
        <Logo src={idocLogo} alt="IDOC Logo" />
        <HeadingText>
          <MainHeading>Idaho Department of Correction</MainHeading>
          <Subheading>Earned Discharge from {supervisionType}</Subheading>
        </HeadingText>
      </ContentContainer>
      <HeadingSeparator />
    </div>
  );
};

export default observer(FormHeading);
