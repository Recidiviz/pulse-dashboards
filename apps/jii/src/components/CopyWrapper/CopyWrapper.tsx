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

import { palette, spacing, typography } from "@recidiviz/design-system";
import Markdown from "markdown-to-jsx";
import { rem } from "polished";
import { FC } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { FormPreview } from "../FormPreview/FormPreview";
import { clickableText } from "../styles/clickableText";
import { InternalOrExternalLink } from "./InternalOrExternalLink";

const MarkdownWrapper = styled(Markdown)`
  ${typography.Body14}

  h1 {
    ${typography.Sans24}

    color: ${palette.pine2};
    font-size: ${rem(34)};
    margin: ${rem(spacing.xxl)} 0 ${rem(spacing.xxl)};
  }

  h2 {
    ${typography.Sans18}

    color: ${palette.pine2};
    margin: ${rem(spacing.xl)} 0 ${rem(spacing.lg)};
  }

  ul {
    padding-left: ${rem(spacing.md)};
    list-style-type: none;
    position: relative;

    li::before {
      content: "•";
      position: absolute;
      left: 0;
    }
  }

  ol {
    padding-left: ${rem(spacing.md)};
  }

  dl {
    column-gap: ${rem(spacing.lg)};
    display: grid;
    grid-template-columns: 1fr 4.5fr;
    margin: 2em 0;
    row-gap: ${rem(spacing.lg)};
  }

  dt {
    color: ${palette.text.caption};
    padding-top: ${rem(spacing.lg)};
    text-wrap: balance;

    &:first-of-type {
      padding: 0;
    }
  }

  dd {
    border-top: 1px solid ${palette.slate20};
    padding-top: ${rem(spacing.lg)};

    &:first-of-type {
      border: none;
      padding: 0;
    }
  }

  a {
    ${clickableText}
  }

  hr {
    margin: ${rem(spacing.xxl)} 0;
    border-color: ${palette.slate20};
    border-style: solid;
  }
`;

/**
 * Renders Markdown children (via {@link https://www.npmjs.com/package/markdown-to-jsx|markdown-to-jsx})
 * and applies a standard stylesheet to the result
 */
export const CopyWrapper: FC<{ children: string; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <MarkdownWrapper
      className={className}
      options={{
        // ensures the styles defined above cascade correctly if there is only one block element in children
        forceWrapper: true,
        overrides: {
          FormPreview: FormPreview,
          a: InternalOrExternalLink,
          InternalLink: Link,
        },
      }}
    >
      {children}
    </MarkdownWrapper>
  );
};
