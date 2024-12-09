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

import { CaseStore } from "../../datastores/CaseStore";
import { filterExcludedAttributes } from "../../geoConfigs/utils";
import { displayReportType } from "../../utils/utils";
import * as Styled from "./CaseDetails.styles";
import {
  AGE_KEY,
  CLIENT_GENDER_KEY,
  COUNTY_KEY,
  GenderToDisplayName,
  LSIR_SCORE_KEY,
  OFFENSE_KEY,
  REPORT_TYPE_KEY,
} from "./constants";
import { AttributeLabelValue } from "./types";

type CaseAttributesProps = {
  caseAttributes: CaseStore["caseAttributes"];
  openEditCaseDetailsModal: () => void;
  analytics: { trackEditCaseDetailsClicked: () => void };
};

export const CaseAttributes: React.FC<CaseAttributesProps> = observer(
  function CaseAttributes({
    caseAttributes,
    openEditCaseDetailsModal,
    analytics,
  }) {
    const { trackEditCaseDetailsClicked } = analytics;

    const {
      age,
      dueDate,
      reportType,
      county: countyOfSentencing,
      offense,
      lsirScore,
      client,
      stateCode,
    } = caseAttributes;
    const {
      fullName,
      gender,
      externalId,
      county: countyOfResidence,
    } = client || {};

    const countyOfSentencingField = {
      key: COUNTY_KEY,
      label: "County",
      value: countyOfSentencing ?? "Unknown",
    };
    const countyOfResidenceField = {
      key: COUNTY_KEY,
      label: "County of Residence",
      value: countyOfResidence?.toLocaleLowerCase() ?? "Unknown",
    };

    const hasMatchingCountyOfResidenceAndSentencing =
      countyOfResidence?.toLocaleLowerCase() ===
      countyOfSentencing?.toLocaleLowerCase();

    /** If the county of residence and sentencing differ, display both counties in header */
    const countyField: AttributeLabelValue[] =
      hasMatchingCountyOfResidenceAndSentencing
        ? [countyOfSentencingField]
        : [countyOfSentencingField, countyOfResidenceField];

    const attributesRow: AttributeLabelValue[] = [
      {
        key: REPORT_TYPE_KEY,
        label: "Report Type",
        value: displayReportType(reportType),
      },
      ...countyField,
      {
        key: CLIENT_GENDER_KEY,
        label: "Gender",
        value: gender ? GenderToDisplayName[gender] : undefined,
      },
      { key: AGE_KEY, label: "Age", value: age },
      { key: OFFENSE_KEY, label: "Offense", value: offense },
      {
        key: LSIR_SCORE_KEY,
        label: "LSI-R Score",
        value: lsirScore ?? "No score provided",
      },
    ]
      .map((attribute) => {
        return {
          ...attribute,
          value: attribute.value,
        };
      })
      .filter(filterExcludedAttributes(stateCode));

    return (
      <Styled.CaseAttributes>
        {/* Name, ID, Due Date */}
        <Styled.HeaderWrapper>
          <Styled.Name>{fullName}</Styled.Name>
          <Styled.ID>{externalId}</Styled.ID>
          <Styled.DueDate>
            Due {moment(dueDate).utc().format("MM/DD/YYYY")}
          </Styled.DueDate>
          <Styled.EditCaseDetailsButton
            onClick={() => {
              openEditCaseDetailsModal();
              trackEditCaseDetailsClicked();
            }}
          >
            Edit Case Details
          </Styled.EditCaseDetailsButton>
        </Styled.HeaderWrapper>

        {/* Case Details Subheader (Report Type, County, Gender, Age, Offense, LSI-R Score) */}
        <Styled.CaseAttributesWrapper>
          {attributesRow.map((attribute) => (
            <Styled.AttributeValueWrapper key={attribute.label}>
              <Styled.Attribute>{attribute.label}:</Styled.Attribute>
              <Styled.Value>
                {attribute.value}
                <span>
                  {attribute.value !== 0 &&
                    !attribute.value &&
                    attribute.fallbackValue}
                </span>
              </Styled.Value>
            </Styled.AttributeValueWrapper>
          ))}
        </Styled.CaseAttributesWrapper>
      </Styled.CaseAttributes>
    );
  },
);
