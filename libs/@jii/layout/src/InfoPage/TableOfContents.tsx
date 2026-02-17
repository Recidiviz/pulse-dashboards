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
import styled from "styled-components";

import { styles } from "~@jii/common-ui";
import { useCommonTranslations } from "~@jii/translation";
import { palette } from "~design-system";

const Wrapper = styled.section`
  ${styles}

  margin-bottom: ${rem(spacing.xxl)};

  h2 {
    ${typography.Sans14}

    color: ${palette.slate85};
  }
`;

type TOCEntry = {
  target: JSX.Element;
  children?: Array<TOCEntry>;
};

/**
 * Given the Elements that make up a Markdown document, extracts and returns the Elements
 * that should be linked to in the TOC. In practice these should almost always be
 * headings (h2-h6) because they will have IDs automatically attached to them. If you return
 * anything else, you may get unexpected results.
 *
 * Including `children` in a {@link TOCEntry} will result in a nested TOC.
 */
export type HeadingsAggregator = (
  elements: Array<JSX.Element>,
) => Array<TOCEntry>;

const defaultHeadingsAggregator: HeadingsAggregator = (elements) => {
  return elements.filter((e) => e.type === "h2").map((e) => ({ target: e }));
};

/**
 * A recursive component that supports rendering a nested TOC.
 * May produce unexpected results if the entries contain anything other than
 * heading elements with plain text contents
 */
const NestedTOCItem: FC<{ entry: TOCEntry }> = ({ entry }) => {
  return (
    <li>
      <Link to={`#${entry.target.props.id}`} reloadDocument>
        {entry.target.props.children}
      </Link>
      {entry.children && (
        <ol>
          {entry.children.map((c) => (
            <NestedTOCItem key={c.target.props.id} entry={c} />
          ))}
        </ol>
      )}
    </li>
  );
};

export const TableOfContents: FC<{
  body: string;
  headingsAggregator?: HeadingsAggregator;
}> = observer(function TableOfContents({
  body,
  headingsAggregator = defaultHeadingsAggregator,
}) {
  const { t } = useCommonTranslations();

  // this should work, based on inspection of the library output,
  // but it's not typesafe, so we handle errors invisibly here
  // (better for UX if this just fails to render rather than displaying an error)
  try {
    // error in library types: passing a null wrapper should return  an array of children
    const bodyElements = compiler(body, {
      wrapper: null,
    }) as unknown as Array<JSX.Element>;

    const entries = headingsAggregator(bodyElements);

    if (!entries.length) return;

    return (
      <Wrapper>
        <h2>{t(($) => $.infoPage.tocHeading)}</h2>
        <ol>
          {entries.map((entry) => (
            <NestedTOCItem entry={entry} key={entry.target.props.id} />
          ))}
        </ol>
      </Wrapper>
    );
  } catch (e) {
    captureException(e);
    return null;
  }
});
