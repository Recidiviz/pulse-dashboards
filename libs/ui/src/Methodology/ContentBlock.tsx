// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import Markdown from "markdown-to-jsx";
import React from "react";
import { AnchorSection } from "react-anchor-navigation";
import styled from "styled-components";

import { convertToSlug } from "./utils";

export type MethodologyBlockContent = {
  title: string;
  methodology?: string;
};

const BlockWrapper = styled.div`
  margin-bottom: 1rem;
`;

const BlockTitle = styled.h3`
  ${({ theme }) => theme.typography.Header34};
  margin: 0;
  padding-top: 4.5rem;
  letter-spacing: -0.04em;
`;

const BlockTitleRule = styled.hr`
  margin: 1rem 0;
`;

const SubBlockTitle = styled.h4`
  ${({ theme }) => theme.typography.Header24};
  padding: 2rem 0 1rem;
  letter-spacing: -0.04em;
`;

const BlockContent = styled.div`
  ${({ theme }) => theme.typography.Body16};
`;

type Props = {
  content: MethodologyBlockContent;
  subBlock?: boolean;
};

const ContentBlock: React.FC<Props> = ({ content, subBlock = false }) => {
  return (
    <AnchorSection
      id={convertToSlug(content.title)}
      // The key is necessary here to force the ScrollableAnchor to remount
      // when there is new content to ensure the correct #id for TOC navigation
      key={convertToSlug(content.title)}
    >
      <BlockWrapper>
        {subBlock ? (
          <SubBlockTitle>{content.title}</SubBlockTitle>
        ) : (
          <>
            <BlockTitle>{content.title}</BlockTitle>
            <BlockTitleRule />
          </>
        )}
        <BlockContent>
          <Markdown>{content.methodology || ""}</Markdown>
        </BlockContent>
      </BlockWrapper>
    </AnchorSection>
  );
};

export default ContentBlock;
