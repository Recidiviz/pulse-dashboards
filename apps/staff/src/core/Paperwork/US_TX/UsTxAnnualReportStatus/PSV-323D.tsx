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
import { PrintablePage, PrintablePageMargin } from "../../styles";
import FormCheckbox from "./FormCheckbox";
import FormHeader from "./FormHeader";
import FormInput from "./FormInput";
import { FormContainer, Grid, Item, Row } from "./styles";

const FormPSV323D: React.FC = () => {
  const formViewerContext = useContext(FormViewerContext);

  return (
    <PrintablePageMargin>
      <PrintablePage>
        <FormContainer {...formViewerContext}>
          <Item style={{ padding: "unset" }}>
            <FormHeader title="Clients who meet the following criteria may be recommended for annual reporting." />
            <Row paddingLeft>
              <Item>
                Client Name:
                <FormInput
                  name="clientName"
                  placeholder="Enter First, Last Name"
                  style={{ width: 412 }}
                />
              </Item>
            </Row>
            <Row paddingLeft justifyContentStart>
              <Item>
                TDCJ/SID #:
                <FormInput name="clientId" style={{ width: 175 }} />
              </Item>
              <Item>
                Eligibility Month
                <FormInput
                  name="eligibilityMonthString"
                  style={{ width: 175 }}
                />
              </Item>
            </Row>
          </Item>
          <Row justifyContentStart>
            <Item width={25}>Y</Item>
            <Item width={25}>N</Item>
            <Item width={508}>
              1. The client has satisfactorily completed three years on Low
              supervision by the Texas Risk Assessment System (TRAS).
            </Item>
          </Row>
          <Row justifyContentStart>
            <Item width={25}>
              <FormCheckbox name="threeYearsTRASCheckYes"></FormCheckbox>
            </Item>
            <Item width={25}>
              <FormCheckbox name="threeYearsTRASCheckNo"></FormCheckbox>
            </Item>
            <Item>Comments:</Item>
          </Row>
          <Row paddingLeft>
            <Item>
              <FormInput name="comment1" style={{ width: 500 }} />
            </Item>
          </Row>
          <Row justifyContentStart>
            <Item width={25}>Y</Item>
            <Item width={25}>N</Item>
            <Item width={508}>
              2. The client has demonstrated a good faith effort to comply with
              supervision, crime victim fees and Post Secondary Education
              reimbursement required as of release, which will continue to be
              due monthly, unless paid in advance.
            </Item>
          </Row>
          <Row justifyContentStart>
            <Item width={25}>
              <FormCheckbox name="complianceFeesAndEducationCheckYes"></FormCheckbox>
            </Item>
            <Item width={25}>
              <FormCheckbox name="complianceFeesAndEducationCheckNo"></FormCheckbox>
            </Item>
            <Item>Comments:</Item>
          </Row>
          <Row paddingLeft>
            <Item>
              <FormInput name="comment2" style={{ width: 500 }} />
            </Item>
          </Row>
          <Row justifyContentStart>
            <Item width={25}>Y</Item>
            <Item width={25}>N</Item>
            <Item width={508}>
              3. The client has maintained compliance with all restitution
              obligations in accordance to PD/POP-3.1.6 for the preceding two
              years of supervision, which will continue to be due each month
              until fully paid. **The client's restitution obligations do not
              have to be paid in full to qualify.**
            </Item>
          </Row>
          <Row justifyContentStart>
            <Item width={25}>
              <FormCheckbox name="restitutionObligationsCheckYes"></FormCheckbox>
            </Item>
            <Item width={25}>
              <FormCheckbox name="restitutionObligationsCheckNo"></FormCheckbox>
            </Item>
          </Row>
          <Row justifyContentStart>
            <Item width={25}>Y</Item>
            <Item width={25}>N</Item>
            <Item width={508}>
              4. The client has not had a warrant issued with in the preceding
              two years of supervision. This does not apply to a warrant issued
              in which a subsequent investigation or administrative review did
              not sustain the violation.
            </Item>
          </Row>
          <Row justifyContentStart>
            <Item width={25}>
              <FormCheckbox name="warrantCheckYes"></FormCheckbox>
            </Item>
            <Item width={25}>
              <FormCheckbox name="warrantCheckNo"></FormCheckbox>
            </Item>
            <Item>Comments:</Item>
          </Row>
          <Row paddingLeft>
            <Item>
              <FormInput name="comment4" style={{ width: 500 }} />
            </Item>
          </Row>
          <Row justifyContentStart>
            <Item width={25}>Y</Item>
            <Item width={25}>N</Item>
            <Item width={508}>
              5. It is in the best interest of society, per the supervising
              officer's discretion for the client's reporting status to be
              modified to Annual Report.
            </Item>
          </Row>
          <Row justifyContentStart>
            <Item width={25}>
              <FormCheckbox name="societyBestInterestCheckYes"></FormCheckbox>
            </Item>
            <Item width={25}>
              <FormCheckbox name="societyBestInterestCheckNo"></FormCheckbox>
            </Item>
            <Item>Comments:</Item>
          </Row>
          <Row paddingLeft>
            <Item>
              <FormInput name="comment5" style={{ width: 500 }} />
            </Item>
          </Row>
          <Row style={{ fontSize: 8, fontWeight: "bold" }}>
            This form should be forwarded through the supervising officer's
            entire chain of command, regardless of the recommendation.
          </Row>
          <Row style={{ fontSize: 8, fontWeight: "bold" }}>
            The Region Director will make the final decision regarding the
            client's Annual Report eligibility
          </Row>
          <Grid columns="2.6fr 1.8fr 2.9fr">
            <Item>
              Supervising Officer
              <FormInput
                name="officerName"
                style={{
                  borderRight: "unset",
                  fontSize: "8px",
                  marginLeft: "5px",
                }}
              />
            </Item>
            <Item>
              Date:
              <FormInput
                name="supervisingOfficerDate"
                style={{ borderRight: "unset" }}
              />
            </Item>
            <Item textAlignCenter>
              Supervising Officer Recommend Client for Annual Report
            </Item>
          </Grid>
          <Grid columns="4.4fr 1.45fr 1.45fr">
            <Item>
              Signature confirms that all checklist information has been
              thoroughly reviewed.
            </Item>
            <Item textAlignCenter>Yes</Item>
            <Item textAlignCenter>
              <FormCheckbox
                name="supervisingOfficerRecommendYes"
                style={{ height: "10px", verticalAlign: "middle" }}
              ></FormCheckbox>
            </Item>
          </Grid>
          <Grid columns="0.75fr 3.65fr 1.45fr 1.45fr">
            <Item>Signature:</Item>
            <Item></Item>
            <Item textAlignCenter>No</Item>
            <Item></Item>
          </Grid>
          <Grid columns="0.75fr 6.5fr" style={{ borderBottom: "1px solid" }}>
            <Item>Remarks:</Item>
            <FormInput name="supervisingOfficerRemarks" />
          </Grid>
          <Item
            style={{ lineHeight: "unset", height: "3px", display: "flex" }}
          ></Item>
          <Grid columns="2.6fr 1.8fr 2.9fr">
            <Item>
              Unit Supervisor{" "}
              <FormInput
                name="unitSupervisorName"
                style={{ borderRight: "unset" }}
              />
            </Item>
            <Item>
              Date:
              <FormInput
                name="unitSupervisorDate"
                style={{ borderRight: "unset" }}
              />
            </Item>
            <Item textAlignCenter>
              Concur with Supervising Officer's Decision
            </Item>
          </Grid>
          <Grid columns="4.4fr 1.45fr 1.45fr">
            <Item>
              Signature confirms that all checklist information has been
              thoroughly reviewed.
            </Item>
            <Item textAlignCenter>Yes</Item>
            <Item textAlignCenter>
              <FormCheckbox
                name="unitSupervisorConcurWithSupervisingOfficerYes"
                style={{ height: "10px", verticalAlign: "middle" }}
              ></FormCheckbox>
            </Item>
          </Grid>
          <Grid columns="0.75fr 3.65fr 1.45fr 1.45fr">
            <Item>Signature:</Item>
            <Item></Item>
            <Item textAlignCenter>No</Item>
            <Item></Item>
          </Grid>
          <Grid columns="0.75fr 6.5fr" style={{ borderBottom: "1px solid" }}>
            <Item>Remarks:</Item>
            <FormInput name="unitSupervisorRemarks" />
          </Grid>
          <Item
            style={{ lineHeight: "unset", height: "3px", display: "flex" }}
          ></Item>
          <Grid columns="2.6fr 1.8fr 2.9fr">
            <Item>Parole Supervisor:</Item>
            <Item>Date:</Item>
            <Item textAlignCenter>
              Concur with Supervising Officer's Decision
            </Item>
          </Grid>
          <Grid columns="4.4fr 1.45fr 1.45fr">
            <Item>
              Signature confirms that all checklist information has been
              thoroughly reviewed.
            </Item>
            <Item textAlignCenter>Yes</Item>
            <Item></Item>
          </Grid>
          <Grid columns="0.75fr 3.65fr 1.45fr 1.45fr">
            <Item>Signature:</Item>
            <Item></Item>
            <Item textAlignCenter>No</Item>
            <Item></Item>
          </Grid>
          <Grid
            columns="0.75fr 6.5fr"
            style={{ borderBottom: "1px solid", borderRight: "1px solid" }}
          >
            <Item>Remarks:</Item>
          </Grid>
          <Item
            style={{ lineHeight: "unset", height: "3px", display: "flex" }}
          ></Item>
          <Grid columns="2.6fr 1.8fr 2.9fr">
            <Item>Assistant Region Director:</Item>
            <Item>Date:</Item>
            <Item textAlignCenter>
              Concur with Supervising Officer's Decision
            </Item>
          </Grid>
          <Grid columns="4.4fr 1.45fr 1.45fr">
            <Item>
              Signature confirms that all checklist information has been
              thoroughly reviewed.
            </Item>
            <Item textAlignCenter>Yes</Item>
            <Item></Item>
          </Grid>
          <Grid columns="0.75fr 3.65fr 1.45fr 1.45fr">
            <Item>Signature:</Item>
            <Item></Item>
            <Item textAlignCenter>No</Item>
            <Item></Item>
          </Grid>
          <Grid
            columns="0.75fr 6.5fr"
            style={{ borderBottom: "1px solid", borderRight: "1px solid" }}
          >
            <Item>Remarks:</Item>
          </Grid>
          <Item
            style={{ lineHeight: "unset", height: "3px", display: "flex" }}
          ></Item>
          <Grid columns="2.6fr 1.8fr 2.9fr">
            <Item>Region Director:</Item>
            <Item>Date:</Item>
            <Item textAlignCenter>Final Authority</Item>
          </Grid>
          <Grid columns="4.4fr 1.45fr 1.45fr">
            <Item>
              Signature confirms that all checklist information has been
              thoroughly reviewed.
            </Item>
            <Item textAlignCenter>Yes</Item>
            <Item></Item>
          </Grid>
          <Grid columns="0.75fr 3.65fr 1.45fr 1.45fr">
            <Item>Signature:</Item>
            <Item></Item>
            <Item textAlignCenter>No</Item>
            <Item></Item>
          </Grid>
          <Grid
            columns="0.75fr 6.5fr"
            style={{ borderBottom: "1px solid", borderRight: "1px solid" }}
          >
            <Item>Remarks:</Item>
          </Grid>
        </FormContainer>
      </PrintablePage>
    </PrintablePageMargin>
  );
};

export default FormPSV323D;
