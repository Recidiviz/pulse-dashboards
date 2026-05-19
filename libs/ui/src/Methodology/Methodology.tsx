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

import React from "react";
import styled from "styled-components";

import { Menubar } from "~design-system";

import ContentBlock, { MethodologyBlockContent } from "./ContentBlock";
import { convertToSlug } from "./utils";

export type MethodologySection = {
  page: MethodologyBlockContent;
  subsections?: MethodologyBlockContent[];
};

export type MethodologyProps = {
  title: string;
  description?: string;
  descriptionSecondary?: string;
  sections: MethodologySection[];
  hideToc?: boolean;
};

const Wrapper = styled.div`
  padding: 0 0 5rem;

  /* offsets anchor targets rendered by react-anchor-navigation
     so they don't overshoot the page header on scroll */
  b[id] {
    scroll-margin-top: 70px;
  }

  a {
    color: ${({ theme }) => theme.palette.signal.links};
    width: fit-content;

    &:hover,
    &:focus {
      color: ${({ theme }) => theme.palette.signal.links};
      cursor: pointer;
      text-decoration: underline;
    }

    &:active {
      color: ${({ theme }) => theme.palette.signal.links};
    }
  }
`;

const MainTitle = styled.h1`
  ${({ theme }) => theme.typography.Header56};
  letter-spacing: -0.04em;
  padding-top: 6rem;
  padding-bottom: 1rem;
`;

const MainDescription = styled.h2`
  ${({ theme }) => theme.typography.Body24};
`;

const Toc = styled.div`
  padding-top: 2.93rem;
`;

const TocLink = styled.a`
  ${({ theme }) => theme.typography.Sans24};
`;

export const Methodology: React.FC<MethodologyProps> = ({
  title,
  description,
  descriptionSecondary,
  sections,
  hideToc = false,
}) => {
  const isSingleSection = sections.length === 1;

  return (
    <Wrapper>
      <div className="container col-md-9 col-12">
        <section>
          {!isSingleSection && <MainTitle>{title}</MainTitle>}
          {description && (
            <MainDescription id="primary-description">
              {description}
            </MainDescription>
          )}
          <br aria-hidden="true" />
          {descriptionSecondary && (
            <MainDescription id="secondary-description">
              {descriptionSecondary}
            </MainDescription>
          )}
        </section>

        {!hideToc && (
          <Toc>
            <h5 aria-hidden="true">CONTENTS</h5>
            <Menubar vertical ariaLabel="Methodology table of contents">
              <div className="d-flex flex-column">
                {sections.map(({ page }) => (
                  <TocLink
                    key={`link${page.title}`}
                    href={`#${convertToSlug(page.title)}`}
                    role="menuitem"
                  >
                    {page.title}
                  </TocLink>
                ))}
              </div>
            </Menubar>
          </Toc>
        )}
        <div>
          {sections.map(({ page, subsections }) => {
            const pageContent = isSingleSection ? { ...page, title } : page;
            return (
              <React.Fragment key={`block${pageContent.title}`}>
                <ContentBlock content={pageContent} />
                {subsections?.map((subsection) => (
                  <ContentBlock
                    content={subsection}
                    subBlock
                    key={`metric${subsection.title}`}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Wrapper>
  );
};
