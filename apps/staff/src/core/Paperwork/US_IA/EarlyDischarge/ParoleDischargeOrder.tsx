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

import { rem } from "polished";
import styled from "styled-components/macro";

import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { PrintablePage, PrintablePageMargin } from "../../styles";
import idocLogo from "./assets/idocLogo.png";
import { FormPage } from "./constants";
import { FormUsIaEarlyDischargeInput } from "./FormComponents";

const LogoComponent = styled.img`
  width: 4.15rem;
  height: auto;
`;

const Logo = () => {
  return <LogoComponent src={idocLogo} alt="IDOC Logo" />;
};

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding-left: 0.5rem;
  gap: 1rem;
`;

const HeaderText = styled.div`
  color: rgb(28, 85, 108);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  letter-spacing: -0.01rem;
  gap: 0.5rem;
  width: 100%;
`;

const DocTitle = styled.div`
  font-size: ${rem(14)};
  font-family: inherit;
  font-weight: 600;
`;

const PeopleContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0.5rem;
  text-transform: uppercase;
  width: 100%;

  & > div {
    display: flex;
    flex-direction: column;
    font-size: ${rem(8)};
    width: 13.25rem;
  }
`;

function Header() {
  return (
    <HeaderContainer>
      <Logo />
      <HeaderText>
        <DocTitle>Iowa Department of Corrections</DocTitle>
        <PeopleContainer>
          <div>
            <div>Governor Kim Reynolds</div>
            <div>Lt. Governor Chris Cournoyer</div>
          </div>
          <div>
            <div>Beth Skinner, MSW, PhD, Director</div>
          </div>
        </PeopleContainer>
      </HeaderText>
    </HeaderContainer>
  );
}

const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  padding: 2rem;

  font-family:
    Times New Roman,
    serif;
  font-size: ${rem(12)};
`;

const Title = styled.div`
  text-transform: uppercase;
  font-weight: 600;
  font-size: ${rem(22)};
  padding-bottom: 0.1rem;
`;

const MainStatementContainer = styled.div`
  text-align: center;
  line-height: 1.1;
`;

function MainStatement() {
  return (
    <MainStatementContainer>
      This document is issued pursuant to Section 906.15 of the Code of Iowa and
      certifies that the person listed
      <br /> below is discharged from parole for the offense(s) and criminal
      file number(s) listed below. The
      <br /> Discharge has been approved by the Iowa Department of Corrections.
    </MainStatementContainer>
  );
}

const DischargeInformationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FieldLabel = styled.span`
  font-weight: bold;
  font-size: ${rem(14)};
`;

function DischargeInformation() {
  return (
    <DischargeInformationContainer>
      <div>
        <FieldLabel>NAME:</FieldLabel>{" "}
        <FormUsIaEarlyDischargeInput name="clientFullName" />
      </div>
      <div>
        <FieldLabel>ICON:</FieldLabel>{" "}
        <FormUsIaEarlyDischargeInput name="iconNumber" />
      </div>
      <div>
        <FieldLabel>Date of Discharge:</FieldLabel>{" "}
        <FormUsIaEarlyDischargeInput name="dischargeDate" />
      </div>
    </DischargeInformationContainer>
  );
}

const SentenceTable = styled.table`
  width: 100%;
  margin-left: 0.25rem;

  & th {
    font-family: Ariel, sans-serif;
    font-style: italic;
    font-weight: 500;
    font-size: ${rem(10)};
  }
`;

function SentenceInformation() {
  const form = useOpportunityFormContext();

  return (
    <SentenceTable>
      <colgroup>
        <col style={{ width: "16%" }} />
        <col style={{ width: "11%" }} />
        <col style={{ width: "45%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "15%" }} />
      </colgroup>
      <thead>
        <tr>
          <th>Sentence Date</th>
          <th>County</th>
          <th>Offense</th>
          <th>Term</th>
          <th>TDD</th>
        </tr>
      </thead>
      <tbody>
        {[...Array(form.formData.numberOfPenalties).keys()].map((i) => (
          <tr key={i}>
            <td>$DATE</td>
            <td>
              <FormUsIaEarlyDischargeInput name={`jurisdiction${i}`} />
            </td>
            <td>
              <FormUsIaEarlyDischargeInput name={`statute${i}`} />
            </td>
            <td>
              <FormUsIaEarlyDischargeInput name={`penaltyDays${i}`} />,
              <FormUsIaEarlyDischargeInput name={`penaltyMonths${i}`} />,
              <FormUsIaEarlyDischargeInput name={`penaltyYears${i}`} />
            </td>
            <td>
              <FormUsIaEarlyDischargeInput name={`tdd${i}`} />
            </td>
          </tr>
        ))}
      </tbody>
    </SentenceTable>
  );
}

const SignatureContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2rem;
  width: 100%;
  justify-content: space-between;

  & > div {
    width: 100%;
  }
`;

function Signatures() {
  return (
    <SignatureContainer>
      <div>
        <div>
          <FormUsIaEarlyDischargeInput
            name="supervisorSignature"
            style={{ width: "100%", fontFamily: "Snell Roundhand, cursive" }}
          />
        </div>
        <div>&nbsp;Probation/Parole Supervisor</div>
        <div>
          &nbsp;Date{" "}
          <FormUsIaEarlyDischargeInput
            name="supervisorSignatureDate"
            style={{ width: "100%" }}
          />
        </div>
      </div>
      <div>
        <div>
          <FormUsIaEarlyDischargeInput
            name="directorSignature"
            style={{ width: "100%", fontFamily: "Snell Roundhand, cursive" }}
          />
        </div>
        <div>&nbsp;District Director</div>
        <div>
          &nbsp;Date{" "}
          <FormUsIaEarlyDischargeInput
            name="directorSignatureDate"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </SignatureContainer>
  );
}

const LegalReminder = styled.div`
  font-weight: 600;
`;

const VotingRights = styled.div`
  line-height: 1.1;
`;

function LegalInformation() {
  return (
    <>
      <LegalReminder>
        This document is an important legal document and should be retained for
        future use.
      </LegalReminder>
      <VotingRights>
        Under Executive Order 7, the Governor is restoring the voting rights to
        many Iowans immediately after discharge of their parole. Your voting
        rights will be restored immediately without any further action, with one
        exception. Those convicted of any of the felony homicide code sections
        (Section 707.1 through 707.11) are not covered by Executive Order 7.
        Individuals convicted of one of those crimes will need to apply to the
        Governor for restoration of voting rights. The application can be found
        at the Governor’s website at governor.iowa.gov.
      </VotingRights>
      <VotingRights>
        Additional information on the restoration of felon voting rights can be
        found at restoreyourvote.iowa.gov.
      </VotingRights>
      <VotingRights>
        If you plan to vote in an upcoming election, we encourage you to
        register prior to the election. Information on voter registration, and
        an application can be found on the Secretary of State’s website at
        sos.iowa.gov. In Iowa, voters can also register on the day of the
        election at their voting location. To find your voting location and more
        information about election-day registration, you may use the Secretary
        of State’s website at sos.iowa.gov.
      </VotingRights>
    </>
  );
}

export const ParoleDischarge = () => {
  return (
    <PrintablePageMargin>
      <PrintablePage>
        <FormPage>
          <Header />
          <FormBody>
            <Title>Parole Discharge</Title>
            <MainStatement />
            <DischargeInformation />
            <SentenceInformation />
            <Signatures />
            <LegalInformation />
          </FormBody>
        </FormPage>
      </PrintablePage>
    </PrintablePageMargin>
  );
};
