// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { Client } from "../../WorkflowsStore";
import { ProfileCapsule } from "../PersonCapsules";
import { workflowsUrl } from "../views";
import { PersonProfileProps } from "./types";

const HeadingWrapper = styled.div`
  margin-bottom: ${rem(spacing.md)};
`;

export const Heading = observer(function Heading({
  person,
}: PersonProfileProps) {
  return (
    <HeadingWrapper>
      <Link
        className="PersonProfileLink"
        to={workflowsUrl(
          person instanceof Client ? "clientProfile" : "residentProfile",
          { justiceInvolvedPersonId: person.pseudonymizedId },
        )}
      >
        <ProfileCapsule avatarSize="md" person={person} textSize="sm" />
      </Link>
    </HeadingWrapper>
  );
});
