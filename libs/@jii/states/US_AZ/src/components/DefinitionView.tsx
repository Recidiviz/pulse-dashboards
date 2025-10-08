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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { BackLink, CopyWrapper } from "~@jii/common-ui";
import { State } from "~@jii/paths";

type DefinitionViewProps = {
  heading: string;
  body: string;
};

export const DefinitionView = (props: DefinitionViewProps) => {
  const params = useTypedParams(State.Resident.UsAzMoreInformation);

  return (
    <>
      <BackLink to={State.Resident.buildPath(params)} children="Home" />
      <CopyWrapper>{`# ${props.heading}\n\n${props.body}`}</CopyWrapper>
    </>
  );
};
