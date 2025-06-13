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

import { spacing, typography } from "@recidiviz/design-system";
import { captureException } from "@sentry/react";
import { compiler } from "markdown-to-jsx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { styles } from "../CopyWrapper/CopyWrapper";

const Wrapper = styled.section`
  ${styles}

  margin-bottom: ${rem(spacing.xxl)};

  h2 {
    ${typography.Sans14}

    color: ${palette.slate85};
  }
`;

export const TableOfContents: FC<{ body: string }> = observer(
  function TableOfContents({ body }) {
    // this should work, based on inspection of the library output,
    // but it's not typesafe, so we handle errors invisibly here
    // (better for UX if this just fails to render rather than displaying an error)
    try {
      // error in library types: passing a null wrapper should return  an array of children
      const bodyElements = compiler(body, {
        wrapper: null,
      }) as unknown as Array<JSX.Element>;

      const entries = bodyElements.filter((e) => e.type === "h2");

      if (!entries.length) return;

      return (
        <Wrapper>
          <h2>On this page</h2>
          <ol>
            {entries.map((heading) => (
              <li key={heading.props.id}>
                <Link to={`#${heading.props.id}`} reloadDocument>
                  {heading.props.children}
                </Link>
              </li>
            ))}
          </ol>
        </Wrapper>
      );
    } catch (e) {
      captureException(e);
      return null;
    }
  },
);
