// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import * as Styled from "./CaseDetails.styles";
import { ProfileStrength } from "./types";

const ProfileStrengthIndicator = ({
  profileStrength,
}: {
  profileStrength: ProfileStrength;
}) => {
  return (
    <Styled.Indicator profileStrength={profileStrength}>
      <Styled.Carot profileStrength={profileStrength} />
    </Styled.Indicator>
  );
};

// TODO(Recidiviz/recidiviz-data#30649) Implement Case Attributes flow
export const CaseAttributes = () => {
  return (
    <Styled.CaseAttributes>
      {/* Name, ID, Due Date */}
      <Styled.HeaderWrapper>
        <Styled.Name>Joshua Abraham</Styled.Name>
        <Styled.ID>AB123456</Styled.ID>
        <Styled.DueDate>Due 5/27/24</Styled.DueDate>
      </Styled.HeaderWrapper>

      {/* Case Details (Report Type, County, Gender, Age) */}
      <Styled.CaseAttributesWrapper>
        <Styled.AttributeValueWrapper>
          <Styled.Attribute>Report Type:</Styled.Attribute>
          <Styled.Value>Full PSI</Styled.Value>
        </Styled.AttributeValueWrapper>
        <Styled.AttributeValueWrapper>
          <Styled.Attribute>County:</Styled.Attribute>
          <Styled.Value>Caribou</Styled.Value>
        </Styled.AttributeValueWrapper>
        <Styled.AttributeValueWrapper>
          <Styled.Attribute>Gender:</Styled.Attribute>
          <Styled.Value>Male</Styled.Value>
        </Styled.AttributeValueWrapper>
        <Styled.AttributeValueWrapper>
          <Styled.Attribute>Age:</Styled.Attribute>
          <Styled.Value>37</Styled.Value>
        </Styled.AttributeValueWrapper>
      </Styled.CaseAttributesWrapper>

      {/* Profile Strength, Edit Case Details */}
      <Styled.EditCaseDetails>
        <Styled.ProfileStrengthWrapper>
          <ProfileStrengthIndicator profileStrength={ProfileStrength.High} />
          <Styled.Content>
            <Styled.Text>
              Profile Strength: <span>High</span>
            </Styled.Text>
            <Styled.Caption>
              Adding case details will help enhance the accuracy of the insights
              and opportunities
            </Styled.Caption>
          </Styled.Content>
        </Styled.ProfileStrengthWrapper>
        <Styled.EditCaseDetailsButton>
          Edit case details
        </Styled.EditCaseDetailsButton>
      </Styled.EditCaseDetails>
    </Styled.CaseAttributes>
  );
};
