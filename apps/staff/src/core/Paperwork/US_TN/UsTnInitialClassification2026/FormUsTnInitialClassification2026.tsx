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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { Opportunity } from "../../../../WorkflowsStore";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { PrintablePage } from "../../styles";
import { MultichoiceScore } from "./MultichoiceScore";

const FormPage = styled.div`
  font-family: "Arial";
  display: flex;
  height: 100%;
  flex-direction: column;
  font-size: ${rem(10)};
  color: black;
  background-color: white;
  padding: 3rem 4.25rem;
`;

const Header = styled.h1`
  font-family: "Arial";
  text-align: center;
  font-weight: 600;
  font-size: ${rem(10)};
  width: 100%;
  letter-spacing: -0.01rem;
`;

const QUESTIONS = [
  {
    title: "PRIOR VIOLENT FELONY CONVICTIONS",
    choices: [
      {
        label: "Violent Felony Conviction in Last 2 Years",
        value: 4,
      },
      {
        label: "Violent Felony Conviction in Last 3-5 Years",
        value: 2,
      },
    ],
  },
  {
    title: "SEVERITY OF CURRENT OFFENSE (Rate Most Serious)",
    choices: [
      { label: "Low", value: 10 },
      { label: "Moderate", value: 11 },
      { label: "High", value: 13 },
      { label: "Highest", value: 15 },
    ],
  },
  {
    title: "NONVIOLENT CLASS B OR C DISCIPLINARY REPORTS SINCE RECEPTION",
    choices: [
      { label: "Yes", value: 6 },
      { label: "No", value: -1 },
    ],
  },
  {
    title: "NONVIOLENT CLASS A DISCIPLINARY REPORTS (CHECK ALL THAT APPLY)",
    choices: [
      { label: "Yes", value: 20 },
      { label: "No", value: -1 },
    ],
  },
  {
    title: "VIOLENT CLASS A OR B DISCIPLINARY REPORTS (CHECK ALL THAT APPLY)",
    choices: [
      { label: "Yes", value: 30 },
      { label: "No", value: -1 },
    ],
  },
  {
    title: "AGE",
    choices: [
      { label: "21 or Younger", value: 11 },
      { label: "22 - 25", value: 8 },
      { label: "26 - 30", value: 2 },
      { label: "31 - 35", value: -1 },
      { label: "36 - 40", value: -2 },
      { label: "41 - 45", value: -4 },
      { label: "Older than 45", value: -6 },
    ],
  },
] satisfies Array<{
  title: string;
  choices: Array<{ label: string; value: number }>;
}>;

export const FormUsTnInitialClassification2026 = observer(
  function FormUsTnInitialClassification2026({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef<HTMLDivElement>(null);

    return (
      <FormContainer
        heading="Form heading"
        agencyName="TDOC"
        onClickDownload={async () => alert("Download clicked")}
        opportunity={opportunity}
        downloadButtonLabel="Download as .DOCX"
      >
        <FormViewer formRef={formRef}>
          <PrintablePage landscape>
            <FormPage>
              <Header>TENNESSEE CLASSIFICATION INSTRUMENT: DIAGNOSTIC</Header>
              <MultichoiceScore questionNumber={1} {...QUESTIONS[0]} />
              <MultichoiceScore questionNumber={2} {...QUESTIONS[1]} />
              <MultichoiceScore questionNumber={3} {...QUESTIONS[2]} />
            </FormPage>
          </PrintablePage>
          <PrintablePage landscape>
            <FormPage>
              <MultichoiceScore questionNumber={4} {...QUESTIONS[3]} />
              <MultichoiceScore questionNumber={5} {...QUESTIONS[4]} />
            </FormPage>
          </PrintablePage>
          <PrintablePage landscape>
            <FormPage>
              <MultichoiceScore questionNumber={6} {...QUESTIONS[5]} />
            </FormPage>
          </PrintablePage>
        </FormViewer>
      </FormContainer>
    );
  },
);
