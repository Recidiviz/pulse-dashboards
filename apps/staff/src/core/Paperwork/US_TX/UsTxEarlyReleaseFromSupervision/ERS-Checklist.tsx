// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { FormViewerContext } from "../../FormViewer";
import FormCheckbox from "../../shared/FormCheckbox";
import FormHeader from "../../shared/FormHeader";
import FormInput from "../../shared/FormInput";
import { ErsItem, FormContainer, Grid, Row } from "../../shared/styles";
import { PrintablePage, PrintablePageMargin } from "../../styles";

const ERSChecklist: React.FC = () => {
  const formViewerContext = useContext(FormViewerContext);

  return (
    <PrintablePageMargin>
      <PrintablePage lineHeight={1.25}>
        <FormContainer {...formViewerContext} style={{ fontSize: "8px" }}>
          <ErsItem style={{ padding: "unset" }}>
            <FormHeader
              titleLineOne="Early Release from Supervision (ERS)"
              titleLineTwo="Checklist, Recommendation, and Determination Form"
              subTitle="Clients who meet the following criteria may be recommended for ERS."
            />
            <Row paddingLeft>
              <ErsItem>
                Client's Name:
                <FormInput
                  name="clientName"
                  placeholder="Enter First, Last Name"
                  style={{ width: 412 }}
                />
              </ErsItem>
            </Row>
            <Row paddingLeft justifyContentStart>
              <ErsItem>
                TDCJ/SID #:
                <FormInput name="tdcjIdAndSid" style={{ width: 175 }} />
              </ErsItem>
              <ErsItem>
                Eligibility Month
                <FormInput
                  name="eligibilityMonthString"
                  style={{ width: 175 }}
                />
              </ErsItem>
            </Row>
          </ErsItem>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>Y</ErsItem>
            <ErsItem width={25}>N</ErsItem>
            <ErsItem width={508}>
              1. The client has been under supervision for at least one-half the
              time that remained on their current sentence when released from
              prison.
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>
              <FormCheckbox name="atLeastHalfTimeCheckYes"></FormCheckbox>
            </ErsItem>
            <ErsItem width={25}>
              <FormCheckbox name="atLeastHalfTimeCheckNo"></FormCheckbox>
            </ErsItem>
            <ErsItem>Comments:</ErsItem>
          </Row>
          <Row paddingLeft>
            <ErsItem>
              <FormInput name="comment1" style={{ width: 500 }} />
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>Y</ErsItem>
            <ErsItem width={25}>N</ErsItem>
            <ErsItem width={508}>
              2. The client has been under supervision for a minimum of three
              years on the current period of supervision to include at least
              three years on Low supervision level as determined by the TRAS.
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>
              <FormCheckbox name="minimumThreeYearsSupervisionCheckYes"></FormCheckbox>
            </ErsItem>
            <ErsItem width={25}>
              <FormCheckbox name="minimumThreeYearsSupervisionCheckNo"></FormCheckbox>
            </ErsItem>
            <ErsItem>Comments:</ErsItem>
          </Row>
          <Row paddingLeft>
            <ErsItem>
              <FormInput name="comment2" style={{ width: 500 }} />
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>Y</ErsItem>
            <ErsItem width={25}>N</ErsItem>
            <ErsItem width={508}>
              3. The client has demonstrated a good faith effort to comply with
              supervision, crime victim fees and Post Secondary Education
              Reimbursement required as of release, which will continue to be
              due monthly, unless paid in advance.
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>
              <FormCheckbox name="goodFaithFeesAndEducationCheckYes"></FormCheckbox>
            </ErsItem>
            <ErsItem width={25}>
              <FormCheckbox name="goodFaithFeesAndEducationCheckNo"></FormCheckbox>
            </ErsItem>
            <ErsItem>Comments:</ErsItem>
            <Row paddingLeft>
              <ErsItem>
                <FormInput name="comment3" style={{ width: 500 }} />
              </ErsItem>
            </Row>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>Y</ErsItem>
            <ErsItem width={25}>N</ErsItem>
            <ErsItem width={508}>
              4. The client has maintained compliance with all restitution
              obligations in accordance with PD/POP 3.1.6 for the preceding two
              years of supervision, which will continue to be due each month
              until paid in full. **The client's restitution obligations do not
              have to be paid in full to qualify**
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>
              <FormCheckbox name="restitutionObligationsCheckYes"></FormCheckbox>
            </ErsItem>
            <ErsItem width={25}>
              <FormCheckbox name="restitutionObligationsCheckNo"></FormCheckbox>
            </ErsItem>
            <ErsItem>Comments:</ErsItem>
          </Row>
          <Row paddingLeft>
            <ErsItem>
              <FormInput name="comment4" style={{ width: 500 }} />
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>Y</ErsItem>
            <ErsItem width={25}>N</ErsItem>
            <ErsItem width={508}>
              5. The client has not had a warrant issued within the preceding
              two years of supervision. This does not apply to a warrant issued
              in which a subsequent investigation or administrative review did
              not sustain the violation.
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>
              <FormCheckbox name="warrantCheckYes"></FormCheckbox>
            </ErsItem>
            <ErsItem width={25}>
              <FormCheckbox name="warrantCheckNo"></FormCheckbox>
            </ErsItem>
            <ErsItem>Comments:</ErsItem>
          </Row>
          <Row paddingLeft>
            <ErsItem>
              <FormInput name="comment5" style={{ width: 500 }} />
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>Y</ErsItem>
            <ErsItem width={25}>N</ErsItem>
            <ErsItem width={508}>
              6. The client has not committed any violation of rules or
              conditions of release as indicated on their Certificate of
              Parole/Mandatory Supervision, during the preceding two year period
              of supervision.
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>
              <FormCheckbox name="noViolationsCertificateCheckYes"></FormCheckbox>
            </ErsItem>
            <ErsItem width={25}>
              <FormCheckbox name="noViolationsCertificateCheckNo"></FormCheckbox>
            </ErsItem>
            <ErsItem>Comments:</ErsItem>
          </Row>
          <Row paddingLeft>
            <ErsItem>
              <FormInput name="comment6" style={{ width: 500 }} />
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>Y</ErsItem>
            <ErsItem width={25}>N</ErsItem>
            <ErsItem width={508}>
              7. It is in the best interest of society, per the supervising
              officer's discretion for the client's reporting status to be
              modified to ERS.
            </ErsItem>
          </Row>
          <Row justifyContentStart unsetMargin>
            <ErsItem width={25}>
              <FormCheckbox name="societyBestInterestCheckYes"></FormCheckbox>
            </ErsItem>
            <ErsItem width={25}>
              <FormCheckbox name="societyBestInterestCheckNo"></FormCheckbox>
            </ErsItem>
            <ErsItem>Comments:</ErsItem>
          </Row>
          <Row paddingLeft>
            <ErsItem>
              <FormInput name="comment7" style={{ width: 500 }} />
            </ErsItem>
          </Row>
          <Row style={{ fontSize: 8, fontWeight: "bold" }}>
            This form should be forwarded through the supervising officer's
            entire chain of command, regardless of the recommendation.
          </Row>
          <Row style={{ fontSize: 8, fontWeight: "bold" }}>
            The Region Director will make the final decision regarding the
            client's ERS eligibility
          </Row>
          <Grid columns="2.6fr 1.8fr 2.9fr">
            <ErsItem>
              Supervising Officer:
              <FormInput
                name="officerName"
                style={{
                  borderRight: "unset",
                  fontSize: "8px",
                  marginLeft: "5px",
                }}
              />
            </ErsItem>
            <ErsItem>
              Date:
              <FormInput
                name="supervisingOfficerDate"
                style={{ borderRight: "unset" }}
              />
            </ErsItem>
            <ErsItem textAlignCenter>
              Supervising Officer Recommend Client for ERS
            </ErsItem>
          </Grid>
          <Grid columns="4.44fr 1.45fr 1.45fr">
            <ErsItem>
              Signature confirms all checklist information has been thoroughly
              reviewed.
            </ErsItem>
            <ErsItem textAlignCenter>Yes</ErsItem>
            <ErsItem textAlignCenter>
              <FormCheckbox
                name="supervisingOfficerRecommendYes"
                style={{ height: "10px", verticalAlign: "middle" }}
              ></FormCheckbox>
            </ErsItem>
          </Grid>
          <Grid columns="0.75fr 3.67fr 1.45fr 1.45fr">
            <ErsItem>Signature:</ErsItem>
            <ErsItem></ErsItem>
            <ErsItem textAlignCenter>No</ErsItem>
            <ErsItem></ErsItem>
          </Grid>
          <Grid columns="0.745fr 6.5fr" style={{ borderBottom: "1px solid" }}>
            <ErsItem>Remarks:</ErsItem>
            <FormInput name="supervisingOfficerRemarks" />
          </Grid>
          <ErsItem
            style={{ lineHeight: "unset", height: "3px", display: "flex" }}
          ></ErsItem>
          <Grid columns="2.6fr 1.8fr 2.9fr">
            <ErsItem>
              Unit Supervisor:{" "}
              <FormInput
                name="unitSupervisorName"
                style={{ borderRight: "unset" }}
              />
            </ErsItem>
            <ErsItem>
              Date:
              <FormInput
                name="unitSupervisorDate"
                style={{ borderRight: "unset" }}
              />
            </ErsItem>
            <ErsItem textAlignCenter>
              Concur with Supervising Officer's Decision
            </ErsItem>
          </Grid>
          <Grid columns="4.44fr 1.45fr 1.45fr">
            <ErsItem>
              Signature confirms all checklist information has been thoroughly
              reviewed.
            </ErsItem>
            <ErsItem textAlignCenter>Yes</ErsItem>
            <ErsItem textAlignCenter>
              <FormCheckbox
                name="unitSupervisorConcurWithSupervisingOfficerYes"
                style={{ height: "10px", verticalAlign: "middle" }}
              ></FormCheckbox>
            </ErsItem>
          </Grid>
          <Grid columns="0.75fr 3.67fr 1.45fr 1.45fr">
            <ErsItem>Signature:</ErsItem>
            <ErsItem></ErsItem>
            <ErsItem textAlignCenter>No</ErsItem>
            <ErsItem></ErsItem>
          </Grid>
          <Grid columns="0.745fr 6.5fr" style={{ borderBottom: "1px solid" }}>
            <ErsItem>Remarks:</ErsItem>
            <FormInput name="unitSupervisorRemarks" />
          </Grid>
          <ErsItem
            style={{ lineHeight: "unset", height: "3px", display: "flex" }}
          ></ErsItem>
          <Grid columns="2.6fr 1.8fr 2.9fr">
            <ErsItem>Parole Supervisor:</ErsItem>
            <ErsItem>Date:</ErsItem>
            <ErsItem textAlignCenter>
              Concur with Supervising Officer's Decision
            </ErsItem>
          </Grid>
          <Grid columns="4.44fr 1.45fr 1.45fr">
            <ErsItem>
              Signature confirms all checklist information has been thoroughly
              reviewed.
            </ErsItem>
            <ErsItem textAlignCenter>Yes</ErsItem>
            <ErsItem></ErsItem>
          </Grid>
          <Grid columns="0.75fr 3.67fr 1.45fr 1.45fr">
            <ErsItem>Signature:</ErsItem>
            <ErsItem></ErsItem>
            <ErsItem textAlignCenter>No</ErsItem>
            <ErsItem></ErsItem>
          </Grid>
          <Grid
            columns="0.745fr 6.5fr"
            style={{ borderBottom: "1px solid", borderRight: "1px solid" }}
          >
            <ErsItem>Remarks:</ErsItem>
          </Grid>
          <ErsItem
            style={{ lineHeight: "unset", height: "3px", display: "flex" }}
          ></ErsItem>
          <Grid columns="2.6fr 1.8fr 2.9fr">
            <ErsItem>Assistant Region Director:</ErsItem>
            <ErsItem>Date:</ErsItem>
            <ErsItem textAlignCenter>
              Concur with Supervising Officer's Decision
            </ErsItem>
          </Grid>
          <Grid columns="4.44fr 1.45fr 1.45fr">
            <ErsItem>
              Signature confirms all checklist information has been thoroughly
              reviewed.
            </ErsItem>
            <ErsItem textAlignCenter>Yes</ErsItem>
            <ErsItem></ErsItem>
          </Grid>
          <Grid columns="0.75fr 3.67fr 1.45fr 1.45fr">
            <ErsItem>Signature:</ErsItem>
            <ErsItem></ErsItem>
            <ErsItem textAlignCenter>No</ErsItem>
            <ErsItem></ErsItem>
          </Grid>
          <Grid
            columns="0.745fr 6.5fr"
            style={{ borderBottom: "1px solid", borderRight: "1px solid" }}
          >
            <ErsItem>Remarks:</ErsItem>
          </Grid>
          <ErsItem
            style={{ lineHeight: "unset", height: "3px", display: "flex" }}
          ></ErsItem>
          <Grid columns="2.6fr 1.8fr 2.9fr">
            <ErsItem>Region Director:</ErsItem>
            <ErsItem>Date:</ErsItem>
            <ErsItem textAlignCenter>Final Authority</ErsItem>
          </Grid>
          <Grid columns="4.44fr 1.45fr 1.45fr">
            <ErsItem>
              Signature confirms all checklist information has been thoroughly
              reviewed.
            </ErsItem>
            <ErsItem textAlignCenter>Recommend for ERS</ErsItem>
            <ErsItem></ErsItem>
          </Grid>
          <Grid columns="0.75fr 3.67fr 1.45fr 1.45fr">
            <ErsItem>Signature:</ErsItem>
            <ErsItem></ErsItem>
            <ErsItem textAlignCenter style={{ fontSize: "7px" }}>
              Does Not Recommend for ERS
            </ErsItem>
            <ErsItem></ErsItem>
          </Grid>
          <Grid
            columns="0.745fr 6.5fr"
            style={{ borderBottom: "1px solid", borderRight: "1px solid" }}
          >
            <ErsItem>Remarks:</ErsItem>
          </Grid>
        </FormContainer>
      </PrintablePage>
    </PrintablePageMargin>
  );
};

export default ERSChecklist;
