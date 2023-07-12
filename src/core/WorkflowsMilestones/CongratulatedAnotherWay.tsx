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
import { ReactComponent as GreenCheckmark } from "../../assets/static/images/greenCheckmark.svg";
import { Client } from "../../WorkflowsStore";
import { Heading } from "../WorkflowsClientProfile/Heading";
import Banner from "./Banner";
import { SidePanelContents } from "./styles";

interface CongratulatedAnotherWayProps {
  client: Client;
}

const CongratulatedAnotherWayView = function CongratulatedAnotherWayView({
  client,
}: CongratulatedAnotherWayProps): JSX.Element {
  return (
    <SidePanelContents>
      <Banner icon={GreenCheckmark} text="Congratulated" />
      <Heading person={client} />{" "}
    </SidePanelContents>
  );
};

export default CongratulatedAnotherWayView;
