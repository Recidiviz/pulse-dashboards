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

import { typography } from "@recidiviz/design-system";
import styled from "styled-components";

import { ParoleCase } from "~datatypes";
import { palette } from "~design-system";

import { formatDocId } from "../../../ParoleStore/utils";
import type { ParoleConfig } from "../../models/types";
import {
  calculateAge,
  FactLabel,
  FactRow,
  FactRowStack,
  formatDate,
  Hr,
  StackedFactRow,
  StackedFacts,
  SubsectionTitle,
} from "./shared";

export type ParoleGeneralInfoProps = {
  caseDetail: ParoleCase;
  config: ParoleConfig;
};

const NameHeading = styled.div`
  ${typography.Serif24}
  color: ${palette.pine2};
  margin-bottom: 0.5rem;
`;

const DocId = styled.div`
  margin-bottom: 1rem;
`;

export const FullWidthHr = styled(Hr)`
  width: auto;
  margin: 0 -1rem;
`;

export function ParoleNameHeading({
  name,
  docId,
}: {
  name: string;
  docId: string;
}) {
  return (
    <>
      <NameHeading>{name}</NameHeading>
      <DocId>{formatDocId(docId)}</DocId>
    </>
  );
}

export function ParolePersonalDetails({
  caseDetail,
}: {
  caseDetail: ParoleCase;
}) {
  return (
    <div>
      <SubsectionTitle>Personal Details</SubsectionTitle>
      <FactRow>
        <FactRowStack>
          <div>Gender</div>
          <FactLabel>{caseDetail.gender}</FactLabel>
        </FactRowStack>
        <FactRowStack>
          <div>Age</div>
          <FactLabel>{calculateAge(caseDetail.dob)}</FactLabel>
        </FactRowStack>
        <FactRowStack>
          <div>DOB</div>
          <FactLabel>{formatDate(caseDetail.dob)}</FactLabel>
        </FactRowStack>
      </FactRow>
    </div>
  );
}

export function ParoleSentenceInfo({ caseDetail }: { caseDetail: ParoleCase }) {
  return (
    <div>
      <SubsectionTitle>Sentence Info</SubsectionTitle>
      <StackedFacts>
        <StackedFactRow>
          <div>Sentence Start Date</div>
          <FactLabel>{formatDate(caseDetail.sentenceStartDate)}</FactLabel>
        </StackedFactRow>
        <StackedFactRow>
          <div>Parole Eligibility Date (PED)</div>
          <FactLabel>{formatDate(caseDetail.paroleEligibilityDate)}</FactLabel>
        </StackedFactRow>
        <StackedFactRow>
          <div>Mandatory Release Date (MRD)</div>
          <FactLabel>{formatDate(caseDetail.mandatoryReleaseDate)}</FactLabel>
        </StackedFactRow>
      </StackedFacts>
    </div>
  );
}

export function DefaultParoleGeneralInfo({
  caseDetail,
}: ParoleGeneralInfoProps) {
  return (
    <>
      <div>
        <ParoleNameHeading name={caseDetail.name} docId={caseDetail.docId} />
        <FactLabel>Incarcerated | {caseDetail.custodyLevel}</FactLabel>
      </div>

      <FullWidthHr />

      <ParolePersonalDetails caseDetail={caseDetail} />

      <Hr />

      <div>
        <SubsectionTitle>Hearing Info</SubsectionTitle>
        <StackedFacts>
          <StackedFactRow>
            <div>Hearing Date</div>
            <FactLabel>
              {caseDetail.hearingDate
                ? formatDate(caseDetail.hearingDate)
                : "Not scheduled"}
            </FactLabel>
          </StackedFactRow>
          <StackedFactRow>
            <div>Facility</div>
            <FactLabel>{caseDetail.currentFacility}</FactLabel>
          </StackedFactRow>
          <StackedFactRow>
            <div>Case Manager</div>
            <FactLabel>{caseDetail.caseManagerName}</FactLabel>
          </StackedFactRow>
        </StackedFacts>
      </div>

      <Hr />

      <ParoleSentenceInfo caseDetail={caseDetail} />
    </>
  );
}
