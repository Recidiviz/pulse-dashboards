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
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import * as Styled from "./CaseInformation.styles";
import { EditableChargeField } from "./constants";
import { JudgeSelector } from "./JudgeSelector";
import { OffenseCard } from "./OffenseCard";
import { TieBreakerPicker } from "./TieBreakerPicker";

interface CaseInformationProps {
  presenter: SARDetailsPresenter;
}

export const CaseInformation: React.FC<CaseInformationProps> = observer(
  function CaseInformation({ presenter }) {
    const { charges, defendantDeclinedToParticipate } = presenter;
    const mostSevereOffenseName = presenter.SARData?.mostSevereOffenseName;

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

    return (
      <Styled.Container>
        {/* Defendant declined checkbox */}
        <Styled.StaffInformationContainer>
          <Styled.CheckboxContainer>
            <Styled.Checkbox
              type="checkbox"
              checked={defendantDeclinedToParticipate}
              onChange={handleDeclinedToggle}
              disabled={!!presenter.SARData?.completionDate}
            />
            <Styled.CheckboxLabel>
              Defendant declined to participate in the SAR process
            </Styled.CheckboxLabel>
          </Styled.CheckboxContainer>

          <JudgeSelector
            judgeOptions={presenter.judgeOptions}
            selectedJudgeName={presenter.SARData?.requestingJudgeName ?? null}
            selectedDivision={presenter.SARData?.division ?? null}
            onUpdate={presenter.updateJudgeSelection}
            disabled={!!presenter.SARData?.completionDate}
          />

          <Styled.OfficerInformationContainer>
            <Styled.StaffInfoColumn>
              <Styled.SubsectionTitle>Requested Of</Styled.SubsectionTitle>
            </Styled.StaffInfoColumn>
            <Styled.StaffInfoColumn>
              Date Requested: {presenter.formattedDateRequested ?? "—"}
            </Styled.StaffInfoColumn>
            <Styled.StaffInfoColumn>
              Officer: {presenter.officerInfo.name ?? "—"}
            </Styled.StaffInfoColumn>
            <Styled.StaffInfoColumn>
              District: {presenter.officerInfo.district ?? "—"}
            </Styled.StaffInfoColumn>
            <Styled.StaffInfoColumn>
              Address: {presenter.officerInfo.address ?? "—"}
            </Styled.StaffInfoColumn>
            <Styled.StaffInfoColumn>
              Phone: {presenter.officerInfo.phoneNumber ?? "—"}
            </Styled.StaffInfoColumn>
          </Styled.OfficerInformationContainer>
        </Styled.StaffInformationContainer>

        {/* Read-only client info - horizontal layout */}
        <Styled.ClientInfoRow>
          <Styled.ClientInfoColumn>
            <Styled.SubsectionTitle>Date of Birth</Styled.SubsectionTitle>
            {presenter.formattedBirthDate}
          </Styled.ClientInfoColumn>
          <Styled.ClientInfoColumn>
            <Styled.SubsectionTitle>Gender</Styled.SubsectionTitle>
            {presenter.formattedGender}
          </Styled.ClientInfoColumn>
          <Styled.ClientInfoColumn>
            <Styled.SubsectionTitle>Race</Styled.SubsectionTitle>
            {presenter.formattedRaceOrEthnicity}
          </Styled.ClientInfoColumn>
        </Styled.ClientInfoRow>

        {/* Each charge in its own card */}
        {charges.map((charge, index) => (
          <OffenseCard
            key={charge.id}
            showTitle={index === 0}
            isMostSevere={
              !!mostSevereOffenseName &&
              charge.offense === mostSevereOffenseName
            }
            charge={charge}
            onUpdate={handleChargeUpdate}
            disabled={!!presenter.SARData?.completionDate}
          />
        ))}
        {presenter.hasTie && !defendantDeclinedToParticipate && (
          <TieBreakerPicker
            candidates={presenter.mostSevereCharges}
            selectedOffenseName={mostSevereOffenseName}
            onSelect={presenter.updateMostSevereOffenseName}
          />
        )}
      </Styled.Container>
    );
  },
);
