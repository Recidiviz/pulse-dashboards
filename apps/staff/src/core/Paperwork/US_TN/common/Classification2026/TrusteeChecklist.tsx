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

import { observer } from "mobx-react-lite";
import { ChangeEventHandler } from "react";
import styled from "styled-components";

import { TrusteeFormSchema } from "~datatypes";

import { UsTnDiagnosticClassification2026Form } from "../../../../../WorkflowsStore/Opportunity/Forms/UsTnDiagnosticClassification2026Form";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { PrintablePage } from "../../../styles";
import { Bold, Header, TrusteeFormPage } from "./styles";
import { TextboxWithHeader } from "./TextboxWithHeader";

const CriteriaTable = styled.table`
  border-collapse: collapse;
  border: 1px solid black;

  & th,
  td {
    border: 1px solid black;
    padding: 0.25rem;

    &:last-child,
    &:nth-last-child(2) {
      width: 8%;
      text-align: center;
    }
  }

  & tbody th {
    font-weight: 500;
  }
`;

const TrusteeCriteriaRow = observer(function TrusteeCriteriaRow({
  dataKey,
  children,
}: {
  dataKey: keyof TrusteeFormSchema;
  children: React.ReactNode;
}) {
  const opportunityForm = useOpportunityFormContext();

  const selected = opportunityForm.formData[dataKey] ?? "";
  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    opportunityForm.updateDraftData(dataKey, event.target.value);
  };

  return (
    <tr>
      <th scope="row">{children}</th>
      <th>
        <input
          type="radio"
          checked={selected === "true"}
          value="true"
          onChange={onChange}
        />
      </th>
      <th>
        <input
          type="radio"
          checked={selected === "false"}
          value="false"
          onChange={onChange}
        />
      </th>
    </tr>
  );
});

const Approval = observer(function Approval() {
  const opportunityForm =
    useOpportunityFormContext() as UsTnDiagnosticClassification2026Form;
  const {
    formData: { trusteeCustodyApproved },
    derivedData: { trusteeEligible },
  } = opportunityForm;

  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    opportunityForm.updateDraftData(
      "trusteeCustodyApproved",
      event.target.value,
    );
  };

  const disabled = !trusteeEligible;

  return (
    <div>
      <Bold>
        Trustee Custody is
        <br />
        <input
          type="radio"
          checked={trusteeEligible && trusteeCustodyApproved === "true"}
          value="true"
          onChange={onChange}
          disabled={disabled}
        />{" "}
        Approved
        <br />
        <input
          type="radio"
          checked={trusteeEligible && trusteeCustodyApproved === "false"}
          value="false"
          onChange={onChange}
          disabled={disabled}
        />{" "}
        Denied
      </Bold>
    </div>
  );
});

export const TrusteeChecklist = observer(function TrusteeChecklist({
  display,
}: {
  display: boolean;
}) {
  const opportunityForm =
    useOpportunityFormContext() as UsTnDiagnosticClassification2026Form;

  const { trusteeEligible } = opportunityForm.derivedData;
  return (
    <>
      <PrintablePage stretchable hidden={!display}>
        <TrusteeFormPage>
          <Header>
            TENNESSEE CLASSIFICATION INSTRUMENT: TRUSTEE/ANNEX ASSESSMENT
          </Header>
          <div>
            <p>
              Five categories of low custody inmates shall be considered for
              placement on trustee custody:
            </p>
            <ol>
              <li>
                Inmates who score low custody on their most recent
                classification assessment{" "}
              </li>
              <li>
                Inmates who did not score low custody on their most recent
                classification assessment, but were recommended for a decrease
                override which places the inmate in low custody
              </li>
              <li>
                Inmates classified as low custody who have been selected for and
                assigned to the Special Alternative Incarceration Unit (SAIU) or
                the Technical Violator Unit (Parole/Probation)
              </li>
              <li>
                Inmates classified as low custody who have been granted parole
                and are within one year of the release date that has been
                approved by the Board of Parole
              </li>
              <li>
                Inmates classified as low custody who are within six (6) months
                of their sentence expiration date.
              </li>
            </ol>
            <p>
              Use the assessment form below to determine whether a low custody
              inmate may be placed on trustee custody.{" "}
              <Bold>
                All criteria listed must be true for placement on trustee
                custody. Trustee custody inmates should be placed in an annex.
              </Bold>
            </p>

            <p>
              <Bold>NOTE:</Bold> Warden approval is required for all trustee
              custody placements. In private facilities, contract monitor
              approval is also required. Additionally, approval from the
              Assistant Commissioner of Prison Operations or their designee is
              required for trustee custody placement of an inmate that (1) has a
              disciplinary conviction for certain assaultive behavior resulting
              in serious injury or death, committed more than five years ago, OR
              (2) scores as high risk of violence on the risk assessment.{" "}
            </p>
          </div>
          <CriteriaTable>
            <thead>
              <tr>
                <th scope="col">
                  CRITERIA – All must be true for placement on TRUSTEE custody
                </th>
                <th scope="col">True</th>
                <th scope="col">False</th>
              </tr>
            </thead>
            <tbody>
              <TrusteeCriteriaRow dataKey="trusteeHas10YearsOrLessRemaining">
                Time to release requirement is met: Inmate has 10 years or less
                remaining on their sentence
                <br />
                <br />
                NOTE: This automatically excludes inmates serving life or death
                sentences.
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody">
                <Bold>If</Bold> inmate was convicted of a violent offenses (see
                Classification User’s Guide, Appendix VI), the inmate has been
                in TDOC custody for a <Bold>minimum</Bold> of 12 months
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeNotConvictedOfFirstDegreeMurder">
                Inmate was not convicted of first degree murder
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeNotServingForSexualOffense">
                Inmate is not a sex offender
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeNoFelonyDetainers">
                Inmate has no felony detainers and/or active warrants{" "}
                <Bold>AND</Bold>
                <br />
                <br />
                <Bold>If</Bold> the inmate has misdemeanor detainers and/or
                active warrants, the Warden has approved trustee custody
                placement
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeNoPendingFelonyCharges">
                Inmate has no pending felony charges
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeNoPendingImmigrationActions">
                Inmate has no pending immigration deportation actions
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeNoAssaultiveDisciplinaryWithSeriousInjuryLast5Years">
                Inmate has no disciplinary convictions for assaultive conduct
                that resulted in serious injury or the death of another
                individual within the past 5 years of incarceration{" "}
                <Bold>AND</Bold>
                <br />
                <br />
                <Bold>If</Bold> the inmate has disciplinary convictions for
                assaultive conduct that resulted in serious injury or the death
                of another individual <Bold>more than</Bold> 5 years ago, the
                Assistant Commissioner for Prison Operations or their designee
                has approved trustee custody placement (signature required
                below)
              </TrusteeCriteriaRow>
            </tbody>
          </CriteriaTable>
        </TrusteeFormPage>
      </PrintablePage>
      <PrintablePage stretchable hidden={!display}>
        <TrusteeFormPage>
          <CriteriaTable>
            <tbody>
              <TrusteeCriteriaRow dataKey="trusteeNoViolentFelonyConvictionPast5YearsIncarceration">
                Inmate has no court-prosecuted felony convictions for a violent
                offense committed during the past 5 years of incarceration
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeNoEscapeFromMediumCloseMaxPast10Years">
                Inmate has no escape or attempted escape from medium, close, or
                maximum custody within the last 10 years of incarceration.
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeNoEscapeFromLowTrusteePast5Years">
                Inmate has no escape on record from low or trustee custody
                within the last 5 years of incarceration. “Low custody” includes
                prior placements at minimum direct, minimum restrict, or minimum
                trustee custody levels.
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeNotScoredHighForViolence">
                Inmate has not scored high for violence on the risk assessment,{" "}
                <Bold>AND</Bold>
                <br />
                <br />
                <Bold>If</Bold> inmate has scored high for violence on the risk
                assessment, the Assistant Commissioner for Prison Operations or
                their designee has approved trustee custody placement (signature
                required below)
              </TrusteeCriteriaRow>

              <TrusteeCriteriaRow dataKey="trusteeWardenHasApproved">
                Warden has approved trustee custody placement (signature
                required below)
                <br />
                <br />
                NOTE: In private facilities, Contract Monitor must{" "}
                <Bold>also</Bold> approve trustee custody placement (signature
                required below).
              </TrusteeCriteriaRow>
            </tbody>
          </CriteriaTable>
          <div>
            <Bold>
              TRUSTEE CUSTODY ELIGIBLE YES
              <input type="radio" checked={trusteeEligible} disabled /> NO
              <input type="radio" checked={!trusteeEligible} disabled />
            </Bold>
          </div>
          <Approval />
          <div>
            <Bold>Reasons for Denial:</Bold>
            <TextboxWithHeader header="" name="trusteeDenialReasons" />
          </div>
        </TrusteeFormPage>
      </PrintablePage>
    </>
  );
});
