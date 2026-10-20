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

import styled from "styled-components";

import {
  isParoleUnknownDate,
  PAROLE_UNKNOWN_TEXT,
  ParoleCase,
  ParoleLifeSentence,
} from "~datatypes";

import { formatDocId } from "../../../ParoleStore/utils";
import type { ParoleConfig } from "../../models/types";
import {
  ParoleFactLabel,
  ParoleFactStack,
  ParoleIdentityBlock,
  ParoleIdentityDetail,
  ParoleIdentityDetails,
  ParolePersonName,
  ParoleSidebarTitle,
  ParoleSmallFactValue,
} from "./ParoleCaseProfileStyles";
import {
  calculateAge,
  FactRow,
  formatDate,
  formatMonth,
  Hr,
  PAROLE_SIDEBAR_PADDING_HORIZONTAL,
  StackedFactRow,
  StackedFacts,
} from "./shared";

export type ParoleGeneralInfoProps = {
  caseDetail: ParoleCase;
  config: ParoleConfig;
};

export const FullWidthHr = styled(Hr)`
  width: auto;
  margin: 0 -${PAROLE_SIDEBAR_PADDING_HORIZONTAL};
`;

export function ParolePersonalDetails({
  caseDetail,
}: {
  caseDetail: ParoleCase;
}) {
  const isDobUnknown = isParoleUnknownDate(caseDetail.dob);
  const facts = [
    { label: "Gender", value: caseDetail.gender },
    {
      label: "Age",
      value: isDobUnknown ? PAROLE_UNKNOWN_TEXT : calculateAge(caseDetail.dob),
    },
    {
      label: "DOB",
      value: isDobUnknown ? PAROLE_UNKNOWN_TEXT : formatDate(caseDetail.dob),
    },
  ];

  return (
    <div>
      <ParoleSidebarTitle>Personal Details</ParoleSidebarTitle>
      <FactRow>
        {facts.map((fact) => (
          <ParoleFactStack key={fact.label}>
            <ParoleFactLabel>{fact.label}</ParoleFactLabel>
            <ParoleSmallFactValue>{fact.value}</ParoleSmallFactValue>
          </ParoleFactStack>
        ))}
      </FactRow>
    </div>
  );
}

// Same copy as the JII tablet's PED card.
const LIFE_SENTENCE_LABELS: Record<ParoleLifeSentence, string> = {
  WITH_PAROLE: "Life Sentence With Parole",
  WITHOUT_PAROLE: "Life Sentence Without Parole",
};

/**
 * Returns the PED to show: the life sentence status when there is one,
 * otherwise the date.
 *
 * @param caseDetail - The resident's case.
 */
function paroleEligibilityLabel(caseDetail: ParoleCase): string {
  if (caseDetail.lifeSentence) {
    return LIFE_SENTENCE_LABELS[caseDetail.lifeSentence];
  }
  return isParoleUnknownDate(caseDetail.paroleEligibilityDate)
    ? PAROLE_UNKNOWN_TEXT
    : formatDate(caseDetail.paroleEligibilityDate);
}

/**
 * Returns the hearing date to show: the month alone when only the month is
 * known, otherwise the full date.
 *
 * @param caseDetail - The resident's case.
 */
function hearingDateLabel(caseDetail: ParoleCase): string {
  if (!caseDetail.hearingDate) return "Not scheduled";
  return caseDetail.hearingDateIsPlaceholder
    ? formatMonth(caseDetail.hearingDate)
    : formatDate(caseDetail.hearingDate);
}

const FactRowItem = styled(StackedFactRow)`
  align-items: center;
`;

export function ParoleSentenceInfo({ caseDetail }: { caseDetail: ParoleCase }) {
  const facts = [
    {
      label: "Sentence Start Date",
      value: isParoleUnknownDate(caseDetail.sentenceStartDate)
        ? PAROLE_UNKNOWN_TEXT
        : formatDate(caseDetail.sentenceStartDate),
    },
    {
      label: "Parole Eligibility Date (PED)",
      value: paroleEligibilityLabel(caseDetail),
    },
    {
      label: "Mandatory Release Date (MRD)",
      value: isParoleUnknownDate(caseDetail.mandatoryReleaseDate)
        ? PAROLE_UNKNOWN_TEXT
        : formatDate(caseDetail.mandatoryReleaseDate),
    },
  ];

  return (
    <div>
      <ParoleSidebarTitle>Sentence Info</ParoleSidebarTitle>
      <StackedFacts>
        {facts.map((fact) => (
          <FactRowItem key={fact.label}>
            <ParoleFactLabel>{fact.label}</ParoleFactLabel>
            <ParoleSmallFactValue>{fact.value}</ParoleSmallFactValue>
          </FactRowItem>
        ))}
      </StackedFacts>
    </div>
  );
}

export function DefaultParoleGeneralInfo({
  caseDetail,
}: ParoleGeneralInfoProps) {
  const hearingFacts = [
    { label: "Hearing Date", value: hearingDateLabel(caseDetail) },
    { label: "Facility", value: caseDetail.currentFacility },
    { label: "Case Manager", value: caseDetail.caseManagerName },
  ];

  return (
    <>
      <ParoleIdentityBlock>
        <ParolePersonName>{caseDetail.name}</ParolePersonName>
        <ParoleIdentityDetails>
          <ParoleIdentityDetail>
            {formatDocId(caseDetail.displayId)}
          </ParoleIdentityDetail>
          <ParoleIdentityDetail>
            Incarcerated | {caseDetail.custodyLevel}
          </ParoleIdentityDetail>
        </ParoleIdentityDetails>
      </ParoleIdentityBlock>

      <FullWidthHr />

      <ParolePersonalDetails caseDetail={caseDetail} />

      <Hr />

      <div>
        <ParoleSidebarTitle>Hearing Info</ParoleSidebarTitle>
        <StackedFacts>
          {hearingFacts.map((fact) => (
            <FactRowItem key={fact.label}>
              <ParoleFactLabel>{fact.label}</ParoleFactLabel>
              <ParoleSmallFactValue>{fact.value}</ParoleSmallFactValue>
            </FactRowItem>
          ))}
        </StackedFacts>
      </div>

      <Hr />

      <ParoleSentenceInfo caseDetail={caseDetail} />
    </>
  );
}
