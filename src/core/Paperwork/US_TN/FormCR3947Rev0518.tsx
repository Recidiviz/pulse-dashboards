// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import React, { useContext } from "react";
import styled from "styled-components/macro";

import { FormViewerContext } from "../FormViewer";
import { PrintablePage, PrintablePageMargin } from "../styles";
import FormCheckbox from "./FormCheckbox";
import FormFooter from "./FormFooter";
import FormHeader from "./FormHeader";
import FormInput from "./FormInput";
import {
  Emphasize,
  FormBox,
  FormContainer,
  FormSignatureGrid,
  FormSignatureInput,
  Grid,
  HeaderRow,
  Item,
  Row,
} from "./styles";

const SpecialConditionsCheckbox = styled(FormCheckbox)`
  margin-right: 0;
`;
const FormCR3947Rev0518: React.FC = () => {
  const formViewerContext = useContext(FormViewerContext);

  return (
    <PrintablePageMargin>
      <PrintablePage>
        <FormContainer {...formViewerContext}>
          <FormHeader title="Telephone Reporting Referral" />
          <Row>
            <Item>
              <strong>Offender Name: </strong>
              <FormInput
                name="clientFullName"
                placeholder="Enter First, Last Name"
                style={{ width: 300 }}
              />
            </Item>
            <Item>
              <strong>TDOC ID #: </strong>
              <FormInput name="tdocId" placeholder="Enter TDOC ID#" />
            </Item>
          </Row>
          <strong>Referral Type: </strong>
          <Item as="label">
            <FormCheckbox name="iotSanctioning" />
            <strong> IOT sanctioning</strong>
          </Item>
          <Item as="label">
            <FormCheckbox name="atrSupervisionTransfer" />
            <strong> ATR Supervision Transfer</strong>
          </Item>
          <hr
            style={{
              borderStyle: "solid",
              borderWidth: 2,
              borderColor: "black",
              margin: "1px 0",
            }}
          />
          <FormBox>
            <Grid columns="90px 1fr 50px 100px">
              <Item as="label" htmlFor="address">
                Physical Address
              </Item>
              <FormInput
                placeholder="Street., City., State"
                id="address"
                name="physicalAddress"
              />
              <Item as="label">Phone #:</Item>
              <FormInput placeholder="(###) ###-####" name="telephoneNumber" />
            </Grid>
            <Grid columns="90px 1fr">
              <Item as="label" htmlFor="employer">
                Current Employer
              </Item>
              <FormInput
                placeholder="Company Name, Company Address"
                id="employer"
                name="currentEmployer"
              />
            </Grid>
            <Grid columns="90px 1fr 90px 1fr">
              <Item as="label" center htmlFor="driversLicense">
                Driver’s License #
              </Item>
              <FormInput placeholder="DL #" name="driversLicense" />
              <Grid rows="1fr 1fr">
                <Item as="label">
                  <FormCheckbox name="driversLicenseSuspended" /> Suspended
                </Item>
                <Item as="label">
                  <FormCheckbox name="driversLicenseRevoked" /> Revoked
                </Item>
              </Grid>
              <Item center>
                <Item as="label">
                  for <FormInput placeholder="Number" name="licenseYears" />{" "}
                  years.
                </Item>
              </Item>
            </Grid>
            <Grid columns="100px 1fr 30px 1fr">
              <Item as="label" htmlFor="county">
                County of Conviction
              </Item>
              <FormInput
                placeholder="County"
                name="convictionCounty"
                id="county"
              />
              <Item as="label" htmlFor="court_name">
                Court
              </Item>
              <FormInput
                placeholder="Court Name"
                name="courtName"
                id="court_name"
              />
            </Grid>
            <Grid columns="100px 1fr">
              <Item as="label" center>
                <span>
                  Docket #{" "}
                  <Emphasize>
                    <strong>List all </strong>
                  </Emphasize>
                </span>
              </Item>
              <FormInput placeholder="Docket(s)" name="allDockets" />
            </Grid>
            <Grid columns="100px 1fr">
              <Item>
                Conviction Offenses
                <br />
                <Item
                  center={false}
                  as="label"
                  style={{ whiteSpace: "normal" }}
                >
                  <FormCheckbox name="seeAdditionalOffenses" />
                  <Emphasize as="strong">
                    See additional offenses on reverse side.
                  </Emphasize>
                </Item>
              </Item>
              <Grid rows="repeat(5, 1fr)">
                <FormInput name="currentOffenses0" placeholder="Offenses" />
                <FormInput name="currentOffenses1" placeholder="Offenses" />
                <FormInput name="currentOffenses2" placeholder="Offenses" />
                <FormInput name="currentOffenses3" placeholder="Offenses" />
                <FormInput name="currentOffenses4" placeholder="Offenses" />
              </Grid>
            </Grid>
            <Grid columns="75px 1fr 1fr 1fr 1fr">
              <Item>Case Type</Item>
              <Item as="label">
                <FormCheckbox name="isProbation" />{" "}
                <strong>Regular Probation</strong>
              </Item>
              <Item as="label">
                <FormCheckbox name="is4035313" /> <strong>40-35-313</strong>
              </Item>
              <Item as="label">
                <FormCheckbox name="isIsc" /> <strong>ISC</strong>
              </Item>
              <Item as="label">
                <FormCheckbox name="isParole" /> <strong>Parole</strong>
              </Item>
            </Grid>
            <Grid columns="75px 75px 80px 1fr 70px 65px">
              <Item as="label"> Sentence Date</Item>
              <FormInput placeholder="Date" name="sentenceStartDate" />
              <Item as="label">Sentence Length</Item>
              <FormInput placeholder="Length" name="sentenceLengthDaysText" />
              <Item as="label">Expiration Date</Item>
              <FormInput placeholder="Date" name="expirationDate" />
            </Grid>
            <Grid columns="100px 121px 196px 1fr" rows="60px">
              <Item style={{ textAlign: "center" }}>
                Supervision Fees Status <br />
                <Emphasize as="small">
                  <strong>
                    All exemptions must <br />
                    be completed prior <br />
                    to submission
                  </strong>
                </Emphasize>
              </Item>
              <Grid columns="121px" rows="19px 1fr">
                <Grid as="label">
                  <FormInput
                    placeholder="Assessed Amount"
                    name="supervisionFeeAssessed"
                  />
                </Grid>
                <Grid columns="60px 60px">
                  <Item center>
                    <Item as="label">
                      <FormCheckbox name="supervisionFeeArrearaged" /> Arrearage
                    </Item>
                  </Item>
                  <Grid as="label" columns="60px">
                    <FormInput
                      placeholder="Amount"
                      name="supervisionFeeArrearagedAmount"
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid columns="75px 120px" rows="19px 1fr">
                <Item as="label" center>
                  Exemption type:
                </Item>
                <FormInput
                  placeholder="Type"
                  name="supervisionFeeExemptionType"
                />
                <Item center>
                  Exemption
                  <br />
                  Expiration Date:
                </Item>
                <FormInput
                  placeholder="Date"
                  name="supervisionFeeExemptionExpirDate"
                />
              </Grid>
              <Item center>
                <Item as="label">
                  <FormCheckbox name="supervisionFeeWaived" /> Waived
                </Item>
              </Item>
            </Grid>
            <Grid columns="100px 50px 90px 90px 1fr">
              <Item>
                Court Costs
                <br />
                <Item as="label">
                  <FormCheckbox name="courtCostsPaid" />
                  <Emphasize as="strong">Paid in Full</Emphasize>
                </Item>
              </Item>
              <Item center as="label">
                Balance
              </Item>
              <FormInput
                placeholder="Court Cost Balance"
                name="courtCostsBalance"
              />
              <Item center as="label">
                Monthly Payment
              </Item>
              <FormInput placeholder="Amount" name="courtCostsMonthlyAmt1" />
            </Grid>
            <Grid columns="100px 50px 90px 2fr">
              <Item center>Restitution:</Item>
              <Item center as="label">
                Amount:
              </Item>
              <FormInput placeholder="Total Amount" name="restitutionAmt" />
              <Grid rows="1fr 1fr" columns="90px 1fr">
                <Item as="label" center>
                  Monthly Payment
                </Item>
                <FormInput
                  placeholder="Amount"
                  name="restitutionMonthlyPayment"
                />
                <Item as="label" center>
                  Payment made to:
                </Item>
                <FormInput
                  placeholder="Recipient"
                  name="restitutionMonthlyPaymentTo"
                />
              </Grid>
            </Grid>
          </FormBox>
          <HeaderRow>
            <Item>
              Special Conditions <Emphasize>Check all that apply </Emphasize>
            </Item>
          </HeaderRow>
          <FormBox>
            <Grid columns="20px 180px 1fr 1fr" rows="15px">
              <Item as="label" center>
                <SpecialConditionsCheckbox name="specialConditionsAlcDrugScreen" />
              </Item>
              <Item>Alcohol and Drug Screen</Item>
              <Item as="label">Date of last drug screen</Item>
              <FormInput
                placeholder="Date"
                name="specialConditionsAlcDrugScreenDate"
              />
            </Grid>
            <Grid columns="20px 180px 1fr 1fr" rows="15px">
              <Item as="label" center>
                <SpecialConditionsCheckbox name="specialConditionsAlcDrugAssessment" />
              </Item>
              <Item>Alcohol and Drug Assessment</Item>
              <Item>
                <Item as="label">
                  <FormCheckbox name="specialConditionsAlcDrugAssessmentPending" />{" "}
                  Pending
                </Item>
                <Item as="label">
                  <FormCheckbox name="specialConditionsAlcDrugAssessmentComplete" />{" "}
                  Complete
                </Item>
              </Item>
              <FormInput
                placeholder="Completion Date"
                name="specialConditionsAlcDrugAssessmentCompleteDate"
              />
            </Grid>
            <Grid columns="20px 180px 1fr 1fr" rows="30px">
              <Item as="label" center>
                <SpecialConditionsCheckbox name="specialConditionsAlcDrugTreatment" />
              </Item>
              <Grid rows="1fr 1fr">
                <Item>Alcohol and Drug Treatment</Item>
                <Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsAlcDrugTreatmentIsInpatient" />{" "}
                    In-patient{" "}
                  </Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsAlcDrugTreatmentIsOutpatient" />{" "}
                    Out-patient
                  </Item>
                </Item>
              </Grid>
              <Item center style={{ alignItems: "flex-start", padding: 0 }}>
                <Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsAlcDrugTreatmentCurrent" />{" "}
                    Current
                  </Item>{" "}
                  <Item as="label">
                    <FormCheckbox name="specialConditionsAlcDrugTreatmentComplete" />{" "}
                    Complete
                  </Item>
                </Item>
              </Item>
              <FormInput
                placeholder="Completion Date"
                name="specialConditionsAlcDrugTreatmentCompleteDate"
              />
            </Grid>
            <Grid columns="20px 75px 104px 1fr 1fr" rows="30px">
              <Item as="label" center>
                <SpecialConditionsCheckbox name="specialConditionsCounseling" />
              </Item>
              <Item center>Counseling</Item>
              <Grid rows="1fr 1fr">
                <Item as="label">
                  <FormCheckbox name="specialConditionsCounselingAngerManagement" />{" "}
                  Anger Management
                </Item>
                <Item as="label">
                  <FormCheckbox name="specialConditionsCounselingMentalHealth" />{" "}
                  Mental Health
                </Item>
              </Grid>
              <Grid rows="1fr 1fr">
                <Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsCounselingAngerManagementCurrent" />{" "}
                    Current
                  </Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsCounselingAngerManagementComplete" />{" "}
                    Complete
                  </Item>
                </Item>
                <Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsCounselingMentalHealthCurrent" />{" "}
                    Current
                  </Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsCounselingMentalHealthComplete" />{" "}
                    Complete
                  </Item>
                </Item>
              </Grid>
              <Grid rows="1fr 1fr">
                <FormInput
                  placeholder="Completion Date"
                  name="specialConditionsCounselingAngerManagementCompleteDate"
                />
                <FormInput
                  placeholder="Completion Date"
                  name="specialConditionsCounselingMentalHealthCompleteDate"
                />
              </Grid>
            </Grid>
            <Grid columns="20px 180px 1fr 1fr" rows="30px">
              <Item as="label" center>
                <SpecialConditionsCheckbox name="specialConditionsCommunityService" />
              </Item>
              <Item>
                Community Service Work
                <br /># of hours:{" "}
                <FormInput
                  placeholder="hours"
                  name="specialConditionsCommunityServiceHours"
                />
              </Item>

              <Item center style={{ alignItems: "flex-start", padding: 0 }}>
                <Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsCommunityServiceCurrent" />{" "}
                    Current
                  </Item>
                  <Item as="label">
                    <Item>
                      <FormCheckbox name="specialConditionsCommunityServiceComplete" />{" "}
                      Complete
                    </Item>
                  </Item>
                </Item>
              </Item>
              <FormInput
                placeholder="Completion Date"
                name="specialConditionsCommunityServiceCompletionDate"
              />
            </Grid>
            <Grid columns="20px 1fr" rows="15px">
              <Item as="label" center>
                <SpecialConditionsCheckbox name="specialConditionsNoContact" />
              </Item>
              <Item as="label">
                No Contact with{" "}
                <FormInput
                  placeholder="Name"
                  name="specialConditionsNoContactName"
                  style={{ width: 300 }}
                />
              </Item>
            </Grid>
            <Grid columns="20px 75px 1fr 1fr 1fr">
              <Item as="label" center>
                <SpecialConditionsCheckbox name="specialConditionsProgramming" />
              </Item>
              <Item center>Programming</Item>
              <Grid rows="1fr 1fr 1fr">
                <Item as="label">
                  <FormCheckbox name="specialConditionsProgrammingCognitiveBehavior" />
                  Cognitive Behavior
                </Item>
                <Item as="label">
                  <FormCheckbox name="specialConditionsProgrammingSafe" />
                  Batterer’s Intervention (SAFE)
                </Item>
                <Item as="label">
                  <FormCheckbox name="specialConditionsProgrammingVictimImpact" />
                  Victim Impact
                </Item>
              </Grid>
              <Grid rows="1fr 1fr 1fr">
                <Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsProgrammingCognitiveBehaviorCurrent" />{" "}
                    Current
                  </Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsProgrammingCognitiveBehaviorComplete" />{" "}
                    Complete
                  </Item>
                </Item>
                <Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsProgrammingSafeCurrent" />{" "}
                    Current
                  </Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsProgrammingSafeComplete" />{" "}
                    Complete
                  </Item>
                </Item>
                <Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsProgrammingVictimImpactCurrent" />{" "}
                    Current
                  </Item>
                  <Item as="label">
                    <FormCheckbox name="specialConditionsProgrammingVictimImpactComplete" />{" "}
                    Complete
                  </Item>
                </Item>
              </Grid>
              <Grid rows="1fr 1fr 1fr">
                <FormInput
                  placeholder="Completion Date"
                  name="specialConditionsProgrammingCognitiveBehaviorCompletionDate"
                />
                <FormInput
                  placeholder="Completion Date"
                  name="specialConditionsProgrammingSafeCompletionDate"
                />
                <FormInput
                  placeholder="Completion Date"
                  name="specialConditionsProgrammingVictimImpactCompletionDate"
                />
              </Grid>
            </Grid>
            <Grid columns="20px 180px 1fr 1fr">
              <Item as="label" center>
                <SpecialConditionsCheckbox name="specialConditionsProgrammingFsw" />
              </Item>
              <Item>Forensic Social Worker Referral</Item>
              <Item>
                <Item as="label">
                  <FormCheckbox name="specialConditionsProgrammingFswCurrent" />{" "}
                  Current
                </Item>
                <Item as="label">
                  <FormCheckbox name="specialConditionsProgrammingFswComplete" />{" "}
                  Complete
                </Item>
              </Item>
              <FormInput
                placeholder="Completion Date"
                name="specialConditionsProgrammingFswCompletionDate"
              />
            </Grid>
          </FormBox>
          <FormSignatureGrid>
            <FormSignatureInput name="poFullName" />
            <FormSignatureInput name="dateToday" />
            <FormSignatureInput name="supervisorFullName" />
            <FormSignatureInput name="dateToday" />
            <span>Probation Parole Officer</span>
            <span>Date</span>
            <span>Supervisor</span>
            <span>Date</span>
          </FormSignatureGrid>
          <Emphasize as="strong">Attach all applicable paperwork</Emphasize>
          <FormFooter />
        </FormContainer>
      </PrintablePage>
    </PrintablePageMargin>
  );
};

export default FormCR3947Rev0518;
