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
import moment from "moment";
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { GenderToDisplayName } from "../CaseDetails/constants";
import * as Styled from "./CaseInformation.styles";
import { EditableChargeField } from "./constants";
import { OffenseCard } from "./OffenseCard";

interface CaseInformationProps {
  presenter: SARDetailsPresenter;
}

export const CaseInformation: React.FC<CaseInformationProps> = observer(
  function CaseInformation({ presenter }) {
    const { clientAttributes, charges, defendantDeclinedToParticipate } =
      presenter;

    const handleChargeUpdate = async (
      chargeId: string,
      fieldId: EditableChargeField,
      value: string,
    ) => {
      await presenter.updateChargeField(chargeId, fieldId, value);
    };

    const handleDeclinedToggle = () => {
      presenter.updateDefendantDeclined(!defendantDeclinedToParticipate);
    };

    // Format birth date for display (using PSI pattern)
    const formattedBirthDate = clientAttributes?.birthDate
      ? moment(clientAttributes.birthDate).utc().format("MM/DD/YYYY")
      : undefined;

    // Format gender for display
    const formattedGender = clientAttributes?.gender
      ? GenderToDisplayName[clientAttributes.gender]
      : undefined;

    return (
      <Styled.Container>
        {/* Defendant declined checkbox */}
        <Styled.CheckboxContainer>
          <Styled.CheckboxLabel>
            Defendant declined to participate in the SAR process
          </Styled.CheckboxLabel>
          <Styled.Checkbox
            type="checkbox"
            checked={defendantDeclinedToParticipate}
            onChange={handleDeclinedToggle}
          />
        </Styled.CheckboxContainer>

        {/* Read-only client info - horizontal layout */}
        <Styled.ClientInfoRow>
          <Styled.ClientInfoColumn>
            <Styled.SubsectionTitle>Date of Birth</Styled.SubsectionTitle>
            {formattedBirthDate}
          </Styled.ClientInfoColumn>
          <Styled.ClientInfoColumn>
            <Styled.SubsectionTitle>Gender</Styled.SubsectionTitle>
            {formattedGender}
          </Styled.ClientInfoColumn>
          <Styled.ClientInfoColumn>
            <Styled.SubsectionTitle>Race</Styled.SubsectionTitle>
            {clientAttributes?.raceOrEthnicity}
          </Styled.ClientInfoColumn>
        </Styled.ClientInfoRow>

        {/* Each charge in its own card */}
        {charges.map((charge, index) => (
          <React.Fragment key={charge.id}>
            <OffenseCard
              showTitle={index === 0}
              charge={charge}
              onUpdate={handleChargeUpdate}
            />
          </React.Fragment>
        ))}
      </Styled.Container>
    );
  },
);
