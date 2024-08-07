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

import { observer } from "mobx-react-lite";
import moment from "moment";
import { useState } from "react";

import { Case } from "../../api";
import * as Styled from "./CaseDetails.styles";
import EditCaseDetailsModal from "./EditCaseDetailsModal";
import { CaseDetailsForm } from "./Form/CaseDetailsForm";
type CaseAttributesProps = {
  caseAttributes: Case;
  firstName?: string;
  form?: CaseDetailsForm;
  saveAttributes: (options?: { showToast: boolean }) => void;
};

type AttributeLabelValue = {
  label: string;
  value: string | number;
};

export const CaseAttributes: React.FC<CaseAttributesProps> = observer(
  function CaseAttributes({ firstName, caseAttributes, form, saveAttributes }) {
    const [showEditCaseDetailsModal, setShowEditCaseDetailsModal] =
      useState(false);

    const showModal = () => setShowEditCaseDetailsModal(true);
    const hideModal = () => setShowEditCaseDetailsModal(false);

    const {
      externalId,
      dueDate,
      reportType,
      county,
      offense,
      lsirScore,
      Client,
    } = caseAttributes;

    const { birthDate, fullName, gender } = Client || {};

    const attributesRow: AttributeLabelValue[] = [
      { label: "Report Type", value: reportType },
      { label: "County", value: county },
      {
        label: "Gender",
        value:
          gender === "EXTERNAL_UNKNOWN"
            ? "Unknown"
            : gender?.toLocaleLowerCase(),
      },
      { label: "Age", value: moment().diff(birthDate, "years") },
      { label: "Offense", value: offense, isEditable: true },
      { label: "LSI-R Score", value: lsirScore, isEditable: true },
    ].map((attribute) => {
      return { ...attribute, value: attribute.value ?? "-" };
    });

    return (
      <Styled.CaseAttributes>
        {/* Name, ID, Due Date */}
        <Styled.HeaderWrapper>
          <Styled.Name>{fullName}</Styled.Name>
          <Styled.ID>{externalId}</Styled.ID>
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

        {/* Edit Case Details Modal */}
        {form && (
          <EditCaseDetailsModal
            firstName={firstName}
            form={form}
            hideModal={hideModal}
            isOpen={showEditCaseDetailsModal}
            saveAttributes={saveAttributes}
          />
        )}
      </Styled.CaseAttributes>
    );
  },
);
