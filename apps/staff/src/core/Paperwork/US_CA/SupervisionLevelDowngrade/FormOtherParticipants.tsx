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

import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import FormInput from "./FormInput";
import { MainLabelTextStyle, SectionRow } from "./styles";

const Row = styled.div`
  ${MainLabelTextStyle};
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

const FormOtherParticipants = () => {
  return (
    <SectionRow>
      <Row>Other Participants</Row>
      <Row>
        Name:
        <FormInput name="otherParticipant1Name" />
        Relation To Parolee:
        <FormInput name="otherParticipant1Relation" />
        Comments:
        <FormInput name="otherParticipant1Comments" />
      </Row>
      <Row>
        Name:
        <FormInput name="otherParticipant2Name" />
        Relation To Parolee:
        <FormInput name="otherParticipant2Relation" />
        Comments:
        <FormInput name="otherParticipant2Comments" />
      </Row>
    </SectionRow>
  );
};

export default observer(FormOtherParticipants);
