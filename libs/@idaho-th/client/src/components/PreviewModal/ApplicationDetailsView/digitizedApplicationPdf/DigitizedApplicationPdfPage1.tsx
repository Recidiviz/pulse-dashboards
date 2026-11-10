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

import { formatCalendarDate } from "~@idaho-th/client/utils/date";

import {
  PAPER_FORM_FIELD_LABELS,
  paperFormDobWithAgeLabel,
} from "../../../../components/HousingApplicationForm/constants/paperFormFieldLabels";
import type { HousingApplicationForm } from "../../../../components/HousingApplicationForm/types";
import { formatDobWithAge } from "../ApplicationDetailsView.utils";
import { displayValue } from "./digitizedApplicationPdfDisplay";
import { Field, FieldList, FieldRow } from "./DigitizedApplicationPdfField";
import * as Styled from "./DigitizedApplicationPdfTemplate.styles";

export interface DigitizedApplicationPdfPageProps {
  formData: Partial<HousingApplicationForm>;
}

export const DigitizedApplicationPdfPage1: React.FC<DigitizedApplicationPdfPageProps> =
  function DigitizedApplicationPdfPage1({ formData: values }) {
    const {
      clientFullName,
      idocNumber,
      cmEmailOnFile,
      cmPoName,
      cmPoEmail,
      cmPoPhone,
      currentFacilityLocation,
      dob,
      age,
      ssnLast4,
      gender,
      personalPhoneNumber,
      idsOnFile,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      legalCurrentStatus,
      legalMostRecentConviction,
      legalCountyOfCrime,
      legalSexOffenderRegistry,
      legalBackupForIcOrIce,
      housingProbationParoleAtRelease,
      childVisitationRequired,
      priorInvoluntaryDischarge,
      violenceHistoryDors,
      paroleHearingCompleted,
      vehicleOnSite,
      tpdHousingNeededDate,
    } = values;

    const expectedRelease = formatCalendarDate(tpdHousingNeededDate ?? null);

    return (
      <>
        <Styled.Hero>
          <Styled.HeroName>
            {displayValue(clientFullName || "")}
          </Styled.HeroName>
          <Styled.HeroLine>
            IDOC# {displayValue(idocNumber || "")}
          </Styled.HeroLine>
          <Styled.HeroLine>
            Original Release Date:
            {` ${displayValue(expectedRelease)}`}
          </Styled.HeroLine>
        </Styled.Hero>

        <Styled.MainColumn>
          <Styled.Section>
            <Styled.SectionTitle>Personal info</Styled.SectionTitle>
            <Styled.SubsectionWrapper>
              <Styled.Subsection>
                <Styled.SubsectionTitle>CM/PO Contact</Styled.SubsectionTitle>
                <FieldRow cols={3}>
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.cmPoName}
                    value={cmPoName}
                  />
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.cmEmailOnFile}
                    value={cmEmailOnFile}
                  />
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.cmPoEmail}
                    value={cmPoEmail}
                  />
                </FieldRow>
                <FieldRow cols={1}>
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.cmPoPhone}
                    value={cmPoPhone}
                  />
                </FieldRow>
              </Styled.Subsection>
              <Styled.HRule />
              <Styled.Subsection>
                <Styled.SubsectionTitle>
                  Client Information
                </Styled.SubsectionTitle>
                <FieldRow cols={3}>
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.currentFacilityLocation}
                    value={currentFacilityLocation}
                  />
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.clientFullName}
                    value={clientFullName}
                  />
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.idocNumber}
                    value={idocNumber}
                  />
                </FieldRow>
                <FieldRow cols={3}>
                  <Field
                    label={paperFormDobWithAgeLabel}
                    value={formatDobWithAge(dob, age) || undefined}
                  />
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.ssnLast4}
                    value={ssnLast4}
                  />
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.gender}
                    value={gender}
                  />
                </FieldRow>
                <FieldRow cols={3}>
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.personalPhoneNumber}
                    value={personalPhoneNumber}
                  />
                  <FieldList
                    label={PAPER_FORM_FIELD_LABELS.idsOnFile}
                    value={idsOnFile}
                  />
                </FieldRow>
              </Styled.Subsection>
              <Styled.HRule />
              <Styled.Subsection $gap="1.875rem">
                <Styled.SubsectionTitle>
                  Emergency Contact
                </Styled.SubsectionTitle>
                <FieldRow cols={3}>
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.emergencyContactName}
                    value={emergencyContactName}
                  />
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.emergencyContactRelationship}
                    value={emergencyContactRelationship}
                  />
                  <Field
                    label={PAPER_FORM_FIELD_LABELS.emergencyContactPhone}
                    value={emergencyContactPhone}
                  />
                </FieldRow>
              </Styled.Subsection>
            </Styled.SubsectionWrapper>
          </Styled.Section>

          <Styled.Section>
            <Styled.SectionTitle>Legal Status</Styled.SectionTitle>
            <FieldRow cols={3}>
              <Field
                label={PAPER_FORM_FIELD_LABELS.legalCurrentStatus}
                value={legalCurrentStatus}
              />
              <Field
                label={PAPER_FORM_FIELD_LABELS.legalMostRecentConviction}
                value={legalMostRecentConviction}
              />
              <Field
                label={PAPER_FORM_FIELD_LABELS.legalCountyOfCrime}
                value={legalCountyOfCrime}
              />
            </FieldRow>
            <FieldRow cols={3}>
              <Field
                label={PAPER_FORM_FIELD_LABELS.legalSexOffenderRegistry}
                value={legalSexOffenderRegistry}
              />
              <Field
                label={PAPER_FORM_FIELD_LABELS.legalBackupForIcOrIce}
                value={legalBackupForIcOrIce}
              />
              <Field
                label={PAPER_FORM_FIELD_LABELS.housingProbationParoleAtRelease}
                value={housingProbationParoleAtRelease}
              />
            </FieldRow>
          </Styled.Section>

          <Styled.Section>
            <Styled.SectionTitle>Housing Requirements</Styled.SectionTitle>
            <FieldRow cols={3}>
              <Field
                label={PAPER_FORM_FIELD_LABELS.childVisitationRequired}
                value={childVisitationRequired}
              />
              <Field
                label={PAPER_FORM_FIELD_LABELS.priorInvoluntaryDischarge}
                value={priorInvoluntaryDischarge}
              />
              <Field
                label={PAPER_FORM_FIELD_LABELS.violenceHistoryDors}
                value={violenceHistoryDors}
              />
            </FieldRow>
            <FieldRow cols={3}>
              <Field
                label={PAPER_FORM_FIELD_LABELS.paroleHearingCompleted}
                value={paroleHearingCompleted}
              />
              <Field
                label={PAPER_FORM_FIELD_LABELS.vehicleOnSite}
                value={vehicleOnSite}
              />
            </FieldRow>
          </Styled.Section>
        </Styled.MainColumn>
      </>
    );
  };
