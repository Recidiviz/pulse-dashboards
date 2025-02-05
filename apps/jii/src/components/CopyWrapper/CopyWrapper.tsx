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
import styled, { css } from "styled-components/macro";

import { clickableText } from "../styles/clickableText";
import { ComparisonLinkInCopy } from "./ComparisonLinkInCopy";
import { InternalOrExternalLink } from "./InternalOrExternalLink";

export const styles = css`
  ${typography.Body16}

  h1 {
    ${typography.Serif34}

    color: ${palette.pine1};
    font-size: ${rem(34)};
    margin: ${rem(spacing.xxl)} 0 ${rem(spacing.xxl)};
  }

  h2 {
    ${typography.Sans24}

    color: ${palette.pine2};
    font-weight: 500;
    margin: 2.5em 0 0.5em;

    /* in UI contexts where this is the main heading of a container, rather than
  a subheading of a larger document, collapse the top margin */
    &:first-child {
      margin-top: 0;
    }
  }

  h3 {
    ${typography.Sans18}

    color: ${palette.slate85};
    font-weight: 500;
    margin: 2em 0 0.33em;
  }

  ul,
  ol {
    padding-left: 1.5em;
    position: relative;
  }

  li {
    margin: 0.75em 0;
  }

  dl {
    margin: 2em 0;
    border-bottom: 1px solid ${palette.slate20};
  }

  dt {
    border-top: 1px solid ${palette.slate20};
    color: ${palette.text.caption};
    padding-top: ${rem(spacing.md)};
  }

  dd {
    p:last-child {
      margin: 0;
    }
  }

  @media (max-width: 499px) {
    dd {
      margin-left: 1em;
      padding-bottom: ${rem(spacing.md)};
    }
  }

  @media (min-width: 500px) {
    dl {
      border-bottom: 1px solid ${palette.slate20};
      column-gap: 0;
      display: grid;
      grid-template-columns: 1fr 4.5fr;
      margin: 2em 0;
      padding-bottom: ${rem(spacing.md)};
      row-gap: ${rem(spacing.md)};
    }

    dt {
      padding-right: ${rem(spacing.xl)};

      text-wrap: balance;
    }

    dd {
      border-top: 1px solid ${palette.slate20};
      margin-left: 0;
      padding-left: ${rem(spacing.xl)};
      padding-top: ${rem(spacing.md)};
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

  p {
    margin: 0 0 1em;
  }
`;

const MarkdownWrapper = styled(Markdown)`
  ${styles}
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
          a: { component: InternalOrExternalLink },
          InternalLink: { component: Link },
          ComparisonLink: { component: ComparisonLinkInCopy },
        },
      }}
    >
      {children}
    </MarkdownWrapper>
  );
};
