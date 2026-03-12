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

import { FC } from "react";

import { CopyProps, CopyWrapper } from "~@jii/common-ui";
import { usePageTitle } from "~@jii/common-ui";

import { HeadingsAggregator, TableOfContents } from "./TableOfContents";
import { useScrollToHash } from "./useScrollToHash";

export interface InfoPageProps {
  heading: string;
  body: string;
  CopyWrapperOverride?: FC<CopyProps>;
  tocHeadingsAggregatorOverride?: HeadingsAggregator;
}

/**
 * Renders the page content along with a table of contents for jumping between sections.
 * @param props
 * @param props.heading - Will be rendered as an `h1`, and set as the page title
 * @param props.body - Will be rendered with a Markdown parser. Should not contain any
 * headings higher than `h2`. All `h2` elements will be included in the table of contents.
 * @param props.CopyWrapperOverride - optional alternative component for rendering Markdown copy.
 * Mostly useful to substitute a wrapper that supports additional custom React components.
 */
export const InfoPage: FC<InfoPageProps> = ({
  heading,
  body,
  CopyWrapperOverride,
  tocHeadingsAggregatorOverride,
}) => {
  usePageTitle(heading);
  useScrollToHash();

  const CopyWrapperComponent = CopyWrapperOverride ?? CopyWrapper;

  return (
    <article>
      <CopyWrapperComponent>{`# ${heading}`}</CopyWrapperComponent>
      <TableOfContents
        body={body}
        headingsAggregator={tocHeadingsAggregatorOverride}
      />
      <CopyWrapperComponent>{body}</CopyWrapperComponent>
    </article>
  );
};
