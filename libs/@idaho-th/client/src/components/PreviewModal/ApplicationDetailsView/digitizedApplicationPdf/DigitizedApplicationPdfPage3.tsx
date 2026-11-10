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

import { PAPER_FORM_FIELD_LABELS } from "../../../../components/HousingApplicationForm/constants/paperFormFieldLabels";
import { Field, FieldList, FieldRow } from "./DigitizedApplicationPdfField";
import type { DigitizedApplicationPdfPageProps } from "./DigitizedApplicationPdfPage1";
import * as Styled from "./DigitizedApplicationPdfTemplate.styles";

export const DigitizedApplicationPdfPage3: React.FC<DigitizedApplicationPdfPageProps> =
  function DigitizedApplicationPdfPage3({ formData: values }) {
    const {
      accommodations,
      otherAccommodations,
      accommodationsInfo,
      medicalAccommodations,
      otherMedicalAccommodation,
      additionalMedicalInfo,
      childFamilyServicesDocumentation,
      parentGuardianNames,
      child1Info,
      child2Info,
      child3Info,
      violenceDischargeDescription,
      ssi90DayCarePlan,
      faithBasedProviderInfo,
    } = values;

    return (
      <Styled.MainColumn>
        <Styled.Section>
          <Styled.SectionTitle>Accommodations</Styled.SectionTitle>
          <Styled.SubsectionWrapper>
            <Styled.Subsection>
              <Styled.SubsectionTitle>
                Assistance Accommodations
              </Styled.SubsectionTitle>
              <FieldRow cols={3}>
                <FieldList
                  label={PAPER_FORM_FIELD_LABELS.accommodations}
                  value={accommodations}
                />
                <Field
                  label={PAPER_FORM_FIELD_LABELS.otherAccommodations}
                  value={otherAccommodations}
                />
                <Field
                  label={PAPER_FORM_FIELD_LABELS.accommodationsInfo}
                  value={accommodationsInfo}
                />
              </FieldRow>
            </Styled.Subsection>
            <Styled.HRule />
            <Styled.Subsection>
              <Styled.SubsectionTitle>
                Medical Accommodations
              </Styled.SubsectionTitle>
              <FieldList
                long
                label={PAPER_FORM_FIELD_LABELS.medicalAccommodations}
                value={medicalAccommodations}
              />
              <FieldRow cols={2}>
                <Field
                  label={PAPER_FORM_FIELD_LABELS.otherMedicalAccommodation}
                  value={otherMedicalAccommodation}
                />
                <Field
                  label={PAPER_FORM_FIELD_LABELS.additionalMedicalInfo}
                  value={additionalMedicalInfo}
                />
              </FieldRow>
            </Styled.Subsection>
          </Styled.SubsectionWrapper>
        </Styled.Section>

        <Styled.Section>
          <Styled.SectionTitle>Child/Family Services</Styled.SectionTitle>
          <Styled.SubsectionWrapper $gap="1.875rem">
            <FieldRow cols={2}>
              <FieldList
                label={PAPER_FORM_FIELD_LABELS.childFamilyServicesDocumentation}
                value={childFamilyServicesDocumentation}
              />
              <Field
                label={PAPER_FORM_FIELD_LABELS.parentGuardianNames}
                value={parentGuardianNames}
              />
            </FieldRow>
            <Field
              long
              label={PAPER_FORM_FIELD_LABELS.child1Info}
              value={child1Info}
            />
            <Field
              long
              label={PAPER_FORM_FIELD_LABELS.child2Info}
              value={child2Info}
            />
            <Field
              long
              label={PAPER_FORM_FIELD_LABELS.child3Info}
              value={child3Info}
            />
          </Styled.SubsectionWrapper>
        </Styled.Section>

        <Styled.Section>
          <Styled.SectionTitle>Additional Info</Styled.SectionTitle>
          <Styled.SubsectionWrapper $gap="1.875rem">
            <Field
              long
              label={PAPER_FORM_FIELD_LABELS.violenceDischargeDescription}
              value={violenceDischargeDescription}
            />
            <Field
              long
              label={PAPER_FORM_FIELD_LABELS.ssi90DayCarePlan}
              value={ssi90DayCarePlan}
            />
            <Field
              long
              label={PAPER_FORM_FIELD_LABELS.faithBasedProviderInfo}
              value={faithBasedProviderInfo}
            />
          </Styled.SubsectionWrapper>
        </Styled.Section>
      </Styled.MainColumn>
    );
  };
