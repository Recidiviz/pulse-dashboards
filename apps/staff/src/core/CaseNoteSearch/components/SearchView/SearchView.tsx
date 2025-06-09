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

import { show } from "@intercom/messenger-js-sdk";
import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  Sans24,
  spacing,
  typography,
} from "@recidiviz/design-system";
import DomPurify from "dompurify";
import { rem } from "polished";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { CaseNoteSearchResults } from "~datatypes";
import { palette } from "~design-system";

import { formatWorkflowsDate } from "../../../../utils";
import {
  NoteAdditionalInfo,
  NoteHeader,
  NoteTextDark,
  NoteTextLight,
} from "../../common/Styles";
import { SearchStatus, SortOrder } from "../../common/types";
import { CaseNoteSearchInput } from "../CaseNoteSearchInput/CaseNoteSearchInput";

export const EmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: ${rem(spacing.sm)};
  text-align: center;

  & > * {
    width: ${rem(300)};
  }
`;

export const EmptyTitle = styled(Sans24)`
  color: ${palette.pine1};
`;

export const StyledLink = styled(Link)`
  color: ${palette.signal.links} !important;
  &:hover {
    text-decoration: underline;
  }
`;

export const LinkButton = styled.button`
  color: ${palette.signal.links} !important;
  border: none;
  background-color: unset;

  &:hover {
    text-decoration: underline;
  }
`;

export const NoteWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  margin: 0 -${rem(spacing.md)};
  border-top: 1px solid ${palette.slate10};

  &:hover {
    background: #f9fafa;
    cursor: pointer;
  }
`;

export const NotePreview = styled.div`
  ${typography.Sans14}
  font-weight: 400;
  color: ${palette.slate60};
`;

export const ModalContent = styled.div`
  padding: ${rem(spacing.xl)} ${rem(spacing.xl)} ${rem(spacing.lg)};
`;

export const ModalDescription = styled.div`
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.lg)};
`;

export const ModalResults = styled.div`
  height: 100%;
  padding: 0 ${rem(spacing.xl)};
  border-top: 1px solid ${palette.slate20};
  overflow-y: auto;
`;

const StyledDropdownToggle = styled(DropdownToggle)`
  color: ${palette.pine1} !important;
  padding: ${rem(spacing.md)} 0;
  outline: 0;
`;

const StyledDropdownMenu = styled(DropdownMenu)`
  margin-top: -${rem(spacing.xs)};
`;

const StyledDropdownMenuItem = styled(DropdownMenuItem)`
  &:focus {
    background: transparent;
    color: ${palette.pine3};
  }
  &:hover {
    background: ${palette.signal.links};
    color: ${palette.white};
  }
`;

const StatusBar = styled.div`
  height: 80px;
  border-top: 1px solid ${palette.slate10};
  display: flex;
  justify-content: center;
  align-items: center;
  ${typography.Sans14}
  font-weight: 400;
  color: ${palette.slate60};
`;

interface NoteProps {
  document: CaseNoteSearchResults[0];
  handleNoteClick: (docId: string) => void;
}

function Note({ document, handleNoteClick }: NoteProps) {
  return (
    <NoteWrapper
      key={document.documentId}
      onClick={() => handleNoteClick(document.documentId ?? "")}
    >
      <NoteHeader>
        <NoteTextDark className="fs-exclude">
          {document.title || formatWorkflowsDate(document.date)}
        </NoteTextDark>
        <NoteAdditionalInfo>
          <NoteTextDark className="fs-exclude">{document.type}</NoteTextDark>
          <NoteTextDark> | </NoteTextDark>
          <NoteTextDark className="fs-exclude">
            {document.contactMode}
          </NoteTextDark>
        </NoteAdditionalInfo>
      </NoteHeader>
      <NotePreview
        className="fs-exclude"
        dangerouslySetInnerHTML={{
          __html: DomPurify.sanitize(document.preview ?? "", {
            FORBID_ATTR: ["style"],
          }),
        }}
      />
      <NoteTextLight className="fs-exclude">
        {formatWorkflowsDate(document.date)}
      </NoteTextLight>
    </NoteWrapper>
  );
}

export function SearchView({
  searchStatus,
  searchQuery,
  searchResults,
  handleNoteClick,
  handleReturnClick,
  sortOrder,
  updateSortOrder,
  initialScrollPosition,
  setScrollPosition,
  onReachedBottom,
  isFetchingNextPage,
  hasNextPage,
}: {
  searchStatus: SearchStatus;
  searchQuery: string;
  searchResults: CaseNoteSearchResults;
  handleNoteClick: (docId: string) => void;
  handleReturnClick: (searchQuery: string) => void;
  sortOrder: SortOrder;
  updateSortOrder: (order: SortOrder) => void;
  initialScrollPosition: number;
  setScrollPosition: (newScrollPosition: number) => void;
  onReachedBottom: () => Promise<void>;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}) {
  function provideFeedback() {
    show();
  }

  const scrollToRef = useRef<HTMLDivElement>(null);

  // Set the initial scroll position when the component mounts, or move it down if a new page is loading
  useEffect(() => {
    if (scrollToRef.current) {
      scrollToRef.current.scrollTop = isFetchingNextPage
        ? scrollToRef.current.scrollHeight
        : initialScrollPosition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetchingNextPage]);

  async function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const target = e.target as HTMLDivElement;
    const bottom =
      target.scrollHeight - target.scrollTop === target.clientHeight;
    setScrollPosition(e.currentTarget.scrollTop);

    if (bottom) {
      await onReachedBottom();
    }
  }

  let resultsViz = null;

  switch (searchStatus) {
    case "error":
      resultsViz = (
        <EmptyWrapper>
          <EmptyTitle>Error Fetching Results</EmptyTitle>
          <NoteTextLight>
            Something went wrong searching your client's case notes. Click the
            link below to send us an email so we can look into the issue.
          </NoteTextLight>
          <StyledLink to="mailto:feedback@recidiviz.org">Contact</StyledLink>
        </EmptyWrapper>
      );
      break;
    case "loading":
      resultsViz = (
        <EmptyWrapper>
          <EmptyTitle>Loading...</EmptyTitle>
        </EmptyWrapper>
      );
      break;
    default:
      resultsViz =
        searchResults.length === 0 ? (
          <EmptyWrapper>
            <EmptyTitle>No Results</EmptyTitle>
            <NoteTextLight>
              You may want to try using different keywords or checking for
              typos.
            </NoteTextLight>
            <LinkButton onClick={provideFeedback}>Provide Feedback</LinkButton>
          </EmptyWrapper>
        ) : (
          <>
            {searchResults
              .map((note, index) => ({ ...note, relevance: index }))
              .sort((a, b) => {
                if (sortOrder === "Relevance") {
                  return a.relevance - b.relevance;
                }
                return b.date && a.date
                  ? b.date.getTime() - a.date.getTime()
                  : 0;
              })
              .map((d) => (
                <Note document={d} handleNoteClick={handleNoteClick} />
              ))}
            {!hasNextPage && (
              <StatusBar>All results have been loaded</StatusBar>
            )}
            {isFetchingNextPage && <StatusBar>Loading...</StatusBar>}
          </>
        );
  }

  return (
    <>
      <ModalContent>
        <ModalDescription>
          Case Note Search is now available in its beta version! You’re getting
          a first look at our latest innovation, and your feedback is crucial in
          helping us refine and improve it.
          <LinkButton onClick={provideFeedback}>
            Share feedback on search
          </LinkButton>
        </ModalDescription>
        <CaseNoteSearchInput
          hasPrototypeBadge={false}
          initialValue={searchQuery}
          onPressReturn={handleReturnClick}
        />
      </ModalContent>
      <ModalResults ref={scrollToRef} onScroll={handleScroll}>
        <Dropdown>
          <StyledDropdownToggle kind="borderless" showCaret>
            Sorted by {sortOrder}
          </StyledDropdownToggle>
          <StyledDropdownMenu alignment="left">
            <StyledDropdownMenuItem
              onClick={() => updateSortOrder("Relevance")}
            >
              Relevance
            </StyledDropdownMenuItem>
            <StyledDropdownMenuItem onClick={() => updateSortOrder("Date")}>
              Date
            </StyledDropdownMenuItem>
          </StyledDropdownMenu>
        </Dropdown>
        {resultsViz}
      </ModalResults>
    </>
  );
}
