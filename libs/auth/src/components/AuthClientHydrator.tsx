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

import { typography } from "@recidiviz/design-system";
import { FC, memo, ReactNode } from "react";
import styled from "styled-components/macro";

import { Hydrator } from "~hydration-utils";

import { AuthClient } from "../models/AuthClient";

const Heading = styled.h1`
  ${typography.Header34}
`;

const Message = styled.p`
  ${typography.Body19}
`;

function ErrorMessage() {
  return (
    <article>
      <Heading>An error occurred.</Heading>
      <Message>
        Unable to configure authorization client. Please reload the page to try
        again.
      </Message>
    </article>
  );
}

export const AuthClientHydrator: FC<{
  authClient: AuthClient;
  children: ReactNode;
}> = memo(function AuthClientHydrator({ authClient, children }) {
  return (
    <Hydrator hydratable={authClient} failed={<ErrorMessage />}>
      {children}
    </Hydrator>
  );
});
