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
import styled from "styled-components/macro";

const Heading = styled.h1`
  ${typography.Header34}
`;

const Paragraph = styled.p`
  ${typography.Body19}
`;

export function EmailVerificationRequired() {
  return (
    <div>
      <Heading>Please verify your email</Heading>
      <Paragraph>
        If you have just signed up for an account, please check your inbox for
        an email asking you to verify your email address. After you click the
        verification button or link in that email, you can reach the home page
        below.
      </Paragraph>
      <Paragraph>
        If you have reached this page by mistake, please try to log in again. If
        you are still having trouble, please reach out to{" "}
        <a
          href="mailto:feedback@recidiviz.org?Subject=Trouble%20logging%20in"
          target="_top"
        >
          Recidiviz Support
        </a>
        .
      </Paragraph>
      <Paragraph>
        <a href="/">Return to the homepage</a>
      </Paragraph>
    </div>
  );
}
