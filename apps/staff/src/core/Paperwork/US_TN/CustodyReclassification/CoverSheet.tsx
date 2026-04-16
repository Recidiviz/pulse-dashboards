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

import { useContext } from "react";
import styled from "styled-components";

import { OpportunityType, UsTnCoverSheetSharedDraftData } from "~datatypes";

import { UsTnReclassificationReviewForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassificationReviewForm";
import { US_TN_CLASSIFICATION_OPPORTUNITIES } from "../../../CaseloadView/AllCaseloadsTable/utils";
import DOCXFormTextArea from "../../DOCXFormTextArea";
import { FormViewerContext } from "../../FormViewer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { PrintablePage } from "../../styles";
import FormDropdown from "./FormDropdown";
import FormInput from "./FormInput";
import FormRadioButton from "./FormRadioButton";
import { FormContainer, Label } from "./styles";

const CUSTODY_LEVELS = ["TRUSTEE", "LOW", "MEDIUM", "CLOSE", "MAX"];
const OVERRIDE_TYPES = [
  "Disciplinary history (A1INC)",
  "Disciplinary history (C2DEC)",
  "First degree murder - current conviction (A2INC)",
  "Escapes (A4INC)",
  "Administrative (B1INC)",
  "Administrative (B2INC)",
  "Parole Grant/Technical Violator's Program(s)/SAIU (C3DEC)",
  "Vulnerability (C5DEC)",
];
const CLASSIFICATION_TYPES = [
  "Diagnostic Classification",
  "Annual Reclassification",
  "Special Reclassification: Upgrade Due to Updated CAF Scoring",
  "Special Reclassification: Upgrade for Serious Misconduct",
  "Special Reclassification: Transfer to Trustee or Transition Center",
  "Special Reclassification: Downgrade",
];

const Container = styled.div`
  font-family: monospace;

  textarea {
    width: 100%;
  }

  hr {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
    border-top: 1px solid black;
  }
`;

const Headline = styled.div`
  text-align: center;
`;

const Row = styled.div<{ indented?: boolean; grouped?: boolean }>`
  display: flex;
  justify-content: space-between;
  width: 95%;
  margin-left: ${({ indented }) => (indented ? "2em" : 0)};

  label {
    ${({ grouped }) => (grouped ? "margin-bottom: 0;" : null)}
  }
`;

const Item = styled.div`
  display: flex;
  gap: 1em;
`;

const HeaderItem = styled(Item)`
  label {
    margin-bottom: 0;
  }
`;

const HeaderList = styled.ol`
  margin-bottom: 0;
  padding-bottom: 0;

  & .Question {
    max-width: 26rem;
  }
`;

const SigBlock = styled.div`
  margin-top: 3em;
  border-top: 0.5px solid black;
  padding-top: 0.25em;
  flex-grow: 1;
  margin-bottom: 1em;
  &:not(:last-child) {
    margin-right: 2em;
  }
`;

const FormTextarea = DOCXFormTextArea<UsTnCoverSheetSharedDraftData>;

function getIsPilotVersion(oppType: OpportunityType): boolean {
  return US_TN_CLASSIFICATION_OPPORTUNITIES.includes(
    // @ts-expect-error Yeah, I know opportunity.type might not be in US_TN_CLASSIFICATION_OPPORTUNITIES. That's why I'm checking it
    oppType,
  );
}

const CoverSheet: React.FC = () => {
  const { formData, derivedData, opportunity } =
    useOpportunityFormContext() as UsTnReclassificationReviewForm;
  const formViewerContext = useContext(FormViewerContext);

  const isPilotVersion = getIsPilotVersion(opportunity.type);

  return (
    <PrintablePage stretchable>
      <FormContainer {...formViewerContext}>
        <Container>
          <Headline>TENNESSEE DEPARTMENT OF CORRECTION</Headline>
          <Headline>OFFENDER CLASSIFICATION SUMMARY</Headline>
          <HeaderSection oppType={opportunity.type} />
          <br />
          <Row>
            <Label>
              TOMIS ID: <FormInput name="omsId" />
            </Label>
            <Label>
              Offender Name: <FormInput name="residentFullName" />
            </Label>
            <Label>
              Institution Name: <FormInput name="institutionName" />
            </Label>
          </Row>
          <Row>
            <Label>
              Classification Type:
              {isPilotVersion ? (
                <FormDropdown
                  name="classificationType"
                  menuItems={CLASSIFICATION_TYPES}
                  style={{
                    minWidth: "10rem",
                    paddingLeft: "0.35rem",
                    textWrap: "wrap",
                  }}
                />
              ) : (
                " CLASSIFICATION"
              )}
            </Label>
            <Label>
              CAF Date: <FormInput name="date" />
            </Label>
          </Row>
          <Row>
            <Item>Status at time of hearing:</Item>
            <Item>
              <FormRadioButton
                name="statusAtHearing"
                targetValue="GEN"
                label="Gen. Pop."
              />
              <FormRadioButton
                name="statusAtHearing"
                targetValue="AS"
                label="AS"
              />
              <FormRadioButton
                name="statusAtHearing"
                targetValue="PC"
                label="PC"
              />
              <Label>
                Other:{" "}
                <FormInput
                  name="statusAtHearing"
                  hideValue={(
                    [
                      "GEN",
                      "AS",
                      "PC",
                    ] as (typeof formData)["statusAtHearing"][]
                  ).includes(formData.statusAtHearing)}
                />
              </Label>
            </Item>
          </Row>
          <Row>
            <Item>
              Incompatibles:
              <FormRadioButton
                name="hasIncompatibles"
                targetValue
                label="Yes"
              />
              <FormRadioButton
                name="hasIncompatibles"
                targetValue={false}
                label="No"
              />
            </Item>
            <Item>
              Inmate agrees to waive 48 hr. hearing notice: __________
            </Item>
          </Row>
          {formData.hasIncompatibles && (
            <Row>
              <Label>
                Incompatibles:{" "}
                <FormInput name="incompatiblesList" width="100%" />
              </Label>
            </Row>
          )}
          <Row grouped={isPilotVersion}>
            <Label>Scored CAF Range: {derivedData.totalText}</Label>
            <Label>
              Current Custody Level: <FormInput name="currentCustodyLevel" />
            </Label>
          </Row>
          {isPilotVersion && (
            <>
              <Row grouped>
                Counselor Recommended Override:
                <FormDropdown
                  name="counselorRecommendedOverride"
                  menuItems={OVERRIDE_TYPES}
                />
              </Row>
              <Row grouped>
                Counselor Recommended Custody Level:{" "}
                <FormDropdown
                  name="counselorRecommendedCustody"
                  menuItems={CUSTODY_LEVELS}
                  style={{ minWidth: "4rem" }}
                />
              </Row>
              <br />
            </>
          )}
          <Row>Panel&apos;s Majority Recommendation:</Row>
          <Row indented grouped>
            <Label>
              Facility Assignment:
              <FormInput name="recommendationFacilityAssignment" />
            </Label>
            <Item>
              Transfer:
              <FormRadioButton
                name="recommendationTransfer"
                targetValue
                label="Yes"
              />
              <FormRadioButton
                name="recommendationTransfer"
                targetValue={false}
                label="No"
              />
              Explain below:
            </Item>
          </Row>
          <Row indented grouped>
            <Label>
              Custody Level:{" "}
              {isPilotVersion ? (
                <FormDropdown
                  name="recommendationCustodyLevel"
                  menuItems={CUSTODY_LEVELS}
                  style={{ minWidth: "4rem" }}
                />
              ) : (
                <FormInput name="recommendationCustodyLevel" />
              )}
            </Label>
          </Row>
          <Row indented grouped>
            <Label>
              Override Type:
              {isPilotVersion ? (
                <FormDropdown
                  name="recommendationOverrideType"
                  menuItems={OVERRIDE_TYPES}
                  style={{ minWidth: "20rem" }}
                />
              ) : (
                <FormInput name="recommendationOverrideType" />
              )}
            </Label>
          </Row>
          <Row indented grouped>
            <Label htmlFor="recommendationJustification">
              Justification, Program Recommendations, and Summary:
            </Label>
          </Row>
          <FormTextarea name="recommendationJustification" minRows={4} />
          <Row grouped>
            <Item>
              Updated Photo Needed:
              <FormRadioButton
                name="updatedPhotoNeeded"
                targetValue
                label="Yes"
              />
              <FormRadioButton
                name="updatedPhotoNeeded"
                targetValue={false}
                label="No"
              />
            </Item>
          </Row>
          <Row>
            <Item>
              Emergency contact updated:
              <FormRadioButton
                name="emergencyContactUpdated"
                targetValue
                label="Yes"
              />
              <FormRadioButton
                name="emergencyContactUpdated"
                targetValue={false}
                label="No"
              />
              <Label>
                Date Updated: <FormInput name="emergencyContactUpdatedDate" />
              </Label>
            </Item>
          </Row>
          <Row grouped>
            Offender Signature: ___________________________________________
            <Label>
              Appeal:&nbsp;&nbsp;
              <FormRadioButton name="inmateAppeal" targetValue label="Yes" />
              &nbsp;&nbsp;
              <FormRadioButton
                name="inmateAppeal"
                targetValue={false}
                label="No"
              />
            </Label>
          </Row>
          <Row>
            <Item />
            <Label>If Yes, provide appeal & copy to Inmate</Label>
          </Row>
          <Row>
            <Item>Panel Member Signatures:</Item>
            <Item>Date: __________________________</Item>
          </Row>
          <Row>
            <SigBlock>Chairperson</SigBlock>
            <SigBlock>Treatment Member</SigBlock>
            <SigBlock>Security Member</SigBlock>
          </Row>
          <Row>
            <Label htmlFor="disagreementReasons">
              If panel member disagrees with majority recommend, state specific
              reasons:
            </Label>
          </Row>
          <FormTextarea name="disagreementReasons" minRows={4} />
          <Row>Approving Authority:</Row>
          <Row>
            <SigBlock>Signature</SigBlock>
            <SigBlock>Date</SigBlock>
            <Item style={{ marginTop: "4em" }}>
              Approve ________&nbsp;&nbsp;Deny ________
            </Item>
          </Row>
          <Row>
            <Label htmlFor="denialReasons">If denied, reasons include:</Label>
          </Row>
          <FormTextarea name="denialReasons" minRows={4} />
        </Container>
      </FormContainer>
    </PrintablePage>
  );
};

function HeaderSection({ oppType }: { oppType: OpportunityType }) {
  if (!getIsPilotVersion(oppType)) return null;

  const showTrusteeSection = oppType !== "usTnInitialClassification2026Policy";
  return (
    <>
      <hr />
      FOR 2026 CLASSIFICATION PILOT PURPOSES
      <br />
      Name of Chief Counselor Finalizing Classification Form:{" "}
      <FormInput name="finalizingCounselor" />
      <br />
      Date of Final Approval and Entry in OMS / Recidiviz Tool, with any edits:{" "}
      <FormInput name="finalApprovalDate" />
      {showTrusteeSection && (
        <>
          <br />
          If Offender scored or overridden to LOW:
          <HeaderList>
            <li>
              <HeaderItem>
                <div className="Question">
                  Were they ever convicted of First Degree Murder (or
                  facilitation, solicitation, attempt, or conspiracy to commit
                  first degree murder)?
                </div>
                <FormRadioButton
                  name="trusteeNotConvictedOfFirstDegreeMurder"
                  targetValue="false"
                  label="Yes"
                />
                <FormRadioButton
                  name="trusteeNotConvictedOfFirstDegreeMurder"
                  targetValue="true"
                  label="No"
                />
              </HeaderItem>
            </li>
            <li>
              <HeaderItem>
                <div className="Question">
                  Are they serving a Life Sentence?
                </div>
                <FormRadioButton
                  name="isServingLife"
                  targetValue="true"
                  label="Yes"
                />
                <FormRadioButton
                  name="isServingLife"
                  targetValue="false"
                  label="No"
                />
              </HeaderItem>
            </li>
            <li>
              <HeaderItem>
                <div className="Question">
                  Do they have more than 10 years remaining on their sentence?
                </div>
                <FormRadioButton
                  name="trusteeHas10YearsOrLessRemaining"
                  targetValue="false"
                  label="Yes"
                />
                <FormRadioButton
                  name="trusteeHas10YearsOrLessRemaining"
                  targetValue="true"
                  label="No"
                />
              </HeaderItem>
            </li>
            <li>
              <HeaderItem>
                <div className="Question">Are they a sex offender?</div>
                <FormRadioButton
                  name="trusteeNotServingForSexualOffense"
                  targetValue="false"
                  label="Yes"
                />
                <FormRadioButton
                  name="trusteeNotServingForSexualOffense"
                  targetValue="true"
                  label="No"
                />
              </HeaderItem>
            </li>
          </HeaderList>
          <HeaderItem>
            If all are No, please confirm that Trustee Checklist was completed:
            <FormRadioButton
              name="checklistCompletedOnOverride"
              targetValue={"Y"}
              label="Yes"
            />
            <FormRadioButton
              name="checklistCompletedOnOverride"
              targetValue={"N"}
              label="No"
            />
            <FormRadioButton
              name="checklistCompletedOnOverride"
              targetValue={"NA"}
              label="N/A"
            />
          </HeaderItem>
        </>
      )}
      <hr />
    </>
  );
}

export default CoverSheet;
