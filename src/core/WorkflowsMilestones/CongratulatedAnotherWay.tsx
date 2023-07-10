// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { palette, Sans16 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { ReactComponent as GreenCheckmark } from "../../assets/static/images/greenCheckmark.svg";
import { Client } from "../../WorkflowsStore";
import { Heading } from "../WorkflowsClientProfile/Heading";
import { SidePanelContents } from "./styles";

const CongratulatedBanner = styled.div`
  background-color: ${palette.marble4};
  border-radius: 8px;
  display: flex;
  flex-flow: row nowrap;
  height: 4rem;
  margin: 1rem 0 2rem 0;
  padding: 1rem;
  align-items: center;
`;

const CongratulatedText = styled(Sans16)`
  margin-left: 0.5rem;
  color: ${palette.slate85};
`;

interface SidePanelViewProps {
  client: Client;
}

const CongratulatedAnotherWay = observer(function CongratulatedAnotherWay({
  client,
}: SidePanelViewProps): JSX.Element {
  return (
    <SidePanelContents>
      <CongratulatedBanner>
        <GreenCheckmark height={24} width={24} />
        <CongratulatedText>Congratulated</CongratulatedText>
      </CongratulatedBanner>
      <Heading person={client} />{" "}
    </SidePanelContents>
  );
});

export default CongratulatedAnotherWay;
