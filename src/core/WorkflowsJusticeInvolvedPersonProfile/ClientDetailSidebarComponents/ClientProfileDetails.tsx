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

import React from "react";

import { useRootStore } from "../../../components/StoreProvider";
import { Divider } from "../styles";
import { ClientProfileProps } from "../types";
import { Contact } from "./Contact";
import { Milestones } from "./Milestones";
import { Supervision } from "./Supervision";

export function ClientProfileDetails({
  client,
}: ClientProfileProps): React.ReactElement {
  const {
    workflowsStore: { featureVariants },
  } = useRootStore();

  return (
    <>
      <Supervision client={client} />
      {featureVariants.responsiveRevamp && <Divider />}
      {client.profileMilestones.length > 0 && (
        <>
          <Milestones client={client} />
          {featureVariants.responsiveRevamp && <Divider />}
        </>
      )}
      <Contact client={client} />
    </>
  );
}
