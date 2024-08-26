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

import styled from "styled-components/macro";

import { FormDataType } from "./constants";
import FormCheckbox from "./FormCheckbox";

type SectionProps = {
  sectionNumber: number;
  headerText: string;
  checklist: { label: string; field: keyof FormDataType }[];
  footerText?: string;
  footerAddendum?: string[];
};

const SectionContainer = styled.div`
  margin: 1% 0%;
`;

const SectionHeader = styled.div`
  margin-bottom: 10px;
`;

const SectionFooter = styled.div`
  margin-top: 10px;
  font-weight: bold;

  > li {
    margin: 2px 0;
  }
`;

const CheckboxRow = styled.div`
  margin-left: 5%;
  margin-bottom: 2px;
`;

const WorksheetSection = ({
  sectionNumber,
  headerText,
  checklist,
  footerText,
  footerAddendum,
}: SectionProps) => {
  return (
    <SectionContainer>
      <SectionHeader>
        <b>Section {sectionNumber}: </b>
        {headerText}
      </SectionHeader>
      <div>
        {checklist.map(({ label, field }) => {
          return (
            <CheckboxRow key={field}>
              <FormCheckbox name={field} />
              {label}
            </CheckboxRow>
          );
        })}
      </div>
      <SectionFooter>
        {footerText}
        <ul>
          {footerAddendum?.map((item) => {
            return <li key={item}>{item}</li>;
          })}
        </ul>
      </SectionFooter>
    </SectionContainer>
  );
};

export default WorksheetSection;
