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

import { rem } from "polished";
import styled from "styled-components/macro";

export const FormHeaderTitleSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: ${rem(100)};

  h1 {
    text-transform: uppercase;
    font-size: ${rem(10)};
    margin-bottom: 0;
    padding-bottom: 0;
    font-family: inherit;
  }

  h2 {
    font-style: normal;
    font-weight: bold;
    font-family: inherit;
    font-size: ${rem(10)};
  }
`;

export const FormHeaderSection = styled.section`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-family: inherit;
  width: 100%;
  font-weight: bold;
`;

export const FormHeaderCheckboxSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  div {
    font-weight: bold;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: ${rem(8)};
    width: 100%;
  }
`;

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  margin-top: ${rem(12)};
  font-family: inherit;
  page-break-inside: avoid;
  break-inside: avoid;

  > * {
    width: 100%;
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
  }
`;
export const FormSectionHeader = styled.h2`
  background-color: #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  color: black;
  font-family: inherit;
  font-size: ${rem(10)};
  font-style: italic;
  font-weight: bold;
  margin: 0;
  padding: 0;
  padding-left: ${rem(10)};
`;

export const FormSectionContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
`;

export const FormHeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const FormInputRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-top: ${rem(2)};
  padding-bottom: ${rem(2)};
  justify-content: space-between;
  width: 100%;
`;

export const SignatureManualEntry = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

export const SignatureLine = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

export const SignatureLineLabel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 80%;
  font-size: ${rem(8)};
`;

export const AdministrativeBox = styled.div`
  display: flex;
  margin-top: 0;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  padding-top: ${rem(2)};
  padding-bottom: ${rem(2)};
  padding-left: ${rem(8)};
  padding-right: ${rem(16)};
  border: ${rem(1)} solid #000;
  font-family: inherit;
  font-weight: bold;
  font-size: ${rem(10)};
`;

export const StateSealImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  margin: inherit;
  padding: inherit;
  padding-left: ${rem(20)};
  padding-top: ${rem(20)};
  pointer-events: none;
  max-width: ${rem(80)};
  max-height: ${rem(80)};
  transform: translate(${rem(20)}, ${rem(20)});
`;

export const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  font-family: inherit;

  td {
    border: 1px solid #000;
    padding: 8px;
    white-space: normal;
    word-wrap: break-word;
    max-width: 200px;
    font-family: inherit;

    > * {
      width: 100%;
      max-width: 100%;
      overflow-wrap: break-word;
      word-wrap: break-word;
      word-break: break-word;
    }

    > div {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  td:first-child {
    max-width: 100px;
    width: 100px;
  }
`;

export const FormPageFooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 6px;
  margin-top: ${rem(18)};
  width: 100%;
  color: gray;
  align-self: end;

  div {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
`;
