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

import moment from "moment";
import { useState } from "react";

import * as Styled from "./CaseDetails.styles";
import EditCaseDetailsModal from "./EditCaseDetailsModal";
import { CaseDetailsForm } from "./Form/CaseDetailsForm";
import { Attributes } from "./types";

type CaseAttributesProps = {
  caseAttributes: Attributes;
  form?: CaseDetailsForm;
};

type AttributeLabelValue = {
  label: string;
  value: string | number;
};

// TODO(Recidiviz/recidiviz-data#30649) Implement Case Attributes flow
export const CaseAttributes: React.FC<CaseAttributesProps> = ({
  caseAttributes,
  form,
}) => {
  const [showEditCaseDetailsModal, setShowEditCaseDetailsModal] =
    useState(false);

  const showModal = () => setShowEditCaseDetailsModal(true);
  const hideModal = () => setShowEditCaseDetailsModal(false);

  const {
    id,
    dueDate,
    reportType,
    county,
    primaryCharge,
    lsirScore,
    birthDate,
    fullName,
    gender,
  } = caseAttributes;

  const attributesRow: AttributeLabelValue[] = [
    { label: "Report Type", value: reportType },
    { label: "County", value: county },
    { label: "Gender", value: gender },
    { label: "Age", value: moment().diff(birthDate, "years") },
    { label: "Offense", value: primaryCharge, isEditable: true },
    { label: "LSI-R Score", value: lsirScore, isEditable: true },
  ].map((attribute) => {
    return { ...attribute, value: attribute.value ?? "-" };
  });

  const firstName = fullName?.split(" ")[0];

  return (
    <Styled.CaseAttributes>
      {/* Name, ID, Due Date */}
      <Styled.HeaderWrapper>
        <Styled.Name>{fullName}</Styled.Name>
        <Styled.ID>{id}</Styled.ID>
        <Styled.DueDate>
          Due {moment(dueDate).format("MM/DD/YYYY")}
        </Styled.DueDate>
        <Styled.EditCaseDetailsButton onClick={showModal}>
          Edit Case Details
        </Styled.EditCaseDetailsButton>
      </Styled.HeaderWrapper>

      {/* Case Details Subheader (Report Type, County, Gender, Age, Offense, LSI-R Score) */}
      <Styled.CaseAttributesWrapper>
        {attributesRow.map((attribute) => (
          <Styled.AttributeValueWrapper key={attribute.label}>
            <Styled.Attribute>{attribute.label}:</Styled.Attribute>
            <Styled.Value>{attribute.value}</Styled.Value>
          </Styled.AttributeValueWrapper>
        ))}
      </Styled.CaseAttributesWrapper>

      {/* Modals */}
      {form && (
        <EditCaseDetailsModal
          firstName={firstName}
          form={form}
          hideModal={hideModal}
          isOpen={showEditCaseDetailsModal}
        />
      )}
    </Styled.CaseAttributes>
  );
};