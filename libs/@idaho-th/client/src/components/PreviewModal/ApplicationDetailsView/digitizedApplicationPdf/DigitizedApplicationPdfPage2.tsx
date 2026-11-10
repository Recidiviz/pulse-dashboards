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

export type DigitizedApplicationPdfPage2Props =
  DigitizedApplicationPdfPageProps & {
    /** Resolved provider names for formData.preferredProviders (which holds ids). */
    preferredProviderNames: string[];
  };

export const DigitizedApplicationPdfPage2: React.FC<DigitizedApplicationPdfPage2Props> =
  function DigitizedApplicationPdfPage2({
    formData: values,
    preferredProviderNames,
  }) {
    const {
      militaryService,
      vaEnrolled,
      employmentOnRelease,
      employer,
      employerContact,
      medicalMhSupportNeeded,
      contagiousDisease,
      prescribedMedications,
      ssiSsdiSsrbMedicareMedicaid,
      benefitsReinstatementDate,
      benefitsDuration,
      addictions,
      substances,
      lastUseDate,
      underInfluenceAtCrime,
      faithBasedPreferred,
      previousTransitionalHome,
      previousHomeName,
      previousHomeCity,
      preferredDistrict,
    } = values;

    return (
      <Styled.MainColumn>
        <Styled.Section>
          <Styled.SectionTitle>Employment &amp; Military</Styled.SectionTitle>
          <FieldRow cols={3}>
            <Field
              label={PAPER_FORM_FIELD_LABELS.militaryService}
              value={militaryService}
            />
            <Field
              label={PAPER_FORM_FIELD_LABELS.vaEnrolled}
              value={vaEnrolled}
            />
            <Field
              label={PAPER_FORM_FIELD_LABELS.employmentOnRelease}
              value={employmentOnRelease}
            />
          </FieldRow>
          <FieldRow cols={3}>
            <Field label={PAPER_FORM_FIELD_LABELS.employer} value={employer} />
            <Field
              label={PAPER_FORM_FIELD_LABELS.employerContact}
              value={employerContact}
            />
          </FieldRow>
        </Styled.Section>

        <Styled.Section>
          <Styled.SectionTitle>Health &amp; Support</Styled.SectionTitle>
          <Styled.SubsectionWrapper>
            <Styled.Subsection>
              <Styled.SubsectionTitle>Medical Info</Styled.SubsectionTitle>
              <FieldRow cols={2}>
                <Field
                  label={PAPER_FORM_FIELD_LABELS.medicalMhSupportNeeded}
                  value={medicalMhSupportNeeded}
                />
                <Field
                  label={PAPER_FORM_FIELD_LABELS.contagiousDisease}
                  value={contagiousDisease}
                />
              </FieldRow>
              <Field
                long
                label={PAPER_FORM_FIELD_LABELS.prescribedMedications}
                value={prescribedMedications}
              />
            </Styled.Subsection>
            <Styled.HRule />
            <Styled.Subsection>
              <Styled.SubsectionTitle>Financial Info</Styled.SubsectionTitle>
              <FieldRow cols={3}>
                <Field
                  label={PAPER_FORM_FIELD_LABELS.ssiSsdiSsrbMedicareMedicaid}
                  value={ssiSsdiSsrbMedicareMedicaid}
                />
                <Field
                  label={PAPER_FORM_FIELD_LABELS.benefitsReinstatementDate}
                  value={benefitsReinstatementDate}
                />
                <Field
                  label={PAPER_FORM_FIELD_LABELS.benefitsDuration}
                  value={benefitsDuration}
                />
              </FieldRow>
            </Styled.Subsection>
            <Styled.HRule />
            <Styled.Subsection>
              <Styled.SubsectionTitle>Substance Use</Styled.SubsectionTitle>
              <FieldRow cols={3}>
                <Field
                  label={PAPER_FORM_FIELD_LABELS.addictions}
                  value={addictions}
                />
                <Field
                  label={PAPER_FORM_FIELD_LABELS.substances}
                  value={substances}
                />
                <Field
                  label={PAPER_FORM_FIELD_LABELS.lastUseDate}
                  value={lastUseDate}
                />
              </FieldRow>
              <FieldRow cols={1}>
                <Field
                  label={PAPER_FORM_FIELD_LABELS.underInfluenceAtCrime}
                  value={underInfluenceAtCrime}
                />
              </FieldRow>
            </Styled.Subsection>
          </Styled.SubsectionWrapper>
        </Styled.Section>

        <Styled.Section>
          <Styled.SectionTitle>Preferences</Styled.SectionTitle>
          <FieldRow cols={3}>
            <Field
              label={PAPER_FORM_FIELD_LABELS.faithBasedPreferred}
              value={faithBasedPreferred}
            />
            <Field
              label={PAPER_FORM_FIELD_LABELS.previousTransitionalHome}
              value={previousTransitionalHome}
            />
            <Field
              label={PAPER_FORM_FIELD_LABELS.previousHomeName}
              value={previousHomeName}
            />
          </FieldRow>
          <FieldRow cols={3}>
            <Field
              label={PAPER_FORM_FIELD_LABELS.previousHomeCity}
              value={previousHomeCity}
            />
            <FieldList
              label={PAPER_FORM_FIELD_LABELS.preferredDistrict}
              value={preferredDistrict}
            />
          </FieldRow>
          <FieldList
            long
            label={PAPER_FORM_FIELD_LABELS.preferredProviders}
            value={preferredProviderNames}
          />
        </Styled.Section>
      </Styled.MainColumn>
    );
  };
