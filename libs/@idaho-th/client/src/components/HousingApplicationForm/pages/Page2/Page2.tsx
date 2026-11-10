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

import React from "react";

import useIsMobile from "../../../../hooks/useIsMobile";
import * as Styled from "../../HousingApplicationForm.styles";
import { EmploymentDetails } from "./sections/EmploymentDetails";
import { FinancialInfo } from "./sections/FinancialInfo";
import { MedicalInfo } from "./sections/MedicalInfo";
import { Page2ImportantFields } from "./sections/Page2ImportantFields";
import { Preferences } from "./sections/Preferences";
import { SubstanceUse } from "./sections/SubstanceUse";

export const Page2: React.FC = () => {
  const { isTablet } = useIsMobile(true);
  return (
    <Styled.TabletView $isTablet={isTablet}>
      <Page2ImportantFields />
      <EmploymentDetails />
      <MedicalInfo />
      <FinancialInfo />
      <SubstanceUse />
      <Preferences />
    </Styled.TabletView>
  );
};
