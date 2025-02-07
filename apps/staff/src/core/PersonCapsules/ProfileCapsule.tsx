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

import { identity } from "lodash";
import { observer } from "mobx-react-lite";
import React from "react";

import { Client } from "../../WorkflowsStore";
import { Resident } from "../../WorkflowsStore/Resident";
import {
  JusticeInvolvedPersonCapsule,
  JusticeInvolvedPersonCapsuleProps,
} from "./JusticeInvolvedPersonCapsule";

type Props = Omit<JusticeInvolvedPersonCapsuleProps, "status">;

export const ProfileCapsule = observer(function ProfileCapsule({
  person,
  ...otherProps
}: Props): JSX.Element {
  let status: React.ReactNode;
  if (person instanceof Client) {
    status = (
      <>
        {[person.supervisionType, person.supervisionLevel]
          .filter(identity)
          .join(", ")}
      </>
    );
  } else if (person instanceof Resident) {
    status = <>{person.displayCustodyLevel}</>;
  }

  return (
    <JusticeInvolvedPersonCapsule
      person={person}
      {...otherProps}
      status={status}
    />
  );
});
