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

import {
  Icon,
  Modal,
  palette,
  Pill,
  Sans14,
  Sans16,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import { CaseNoteSearchResults } from "~datatypes";

import SearchIconComponent from "../../assets/static/images/search.svg?react";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { formatWorkflowsDateString } from "../../utils";

type CASE_NOTE_SEARCH_VIEWS = "SEARCH_VIEW" | "NOTE_VIEW";

const Wrapper = styled.div`
  color: ${palette.slate85};
`;

const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid ${palette.slate10};
  border-radius: ${rem(spacing.sm)};
  padding: 0 ${rem(spacing.md)};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${rem(spacing.md)} ${rem(spacing.sm)};
  border-radius: ${rem(spacing.sm)};
  border: 0;
  outline: 0;

  &::placeholder {
    color: ${palette.slate60};
  }
`;

const SearchInputAside = styled.span`
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const SearchIcon = styled(SearchIconComponent)`
  width: ${rem(18)};
  height: ${rem(18)};
  margin: ${rem(3)};
`;

const PrototypePill = styled(Pill).attrs({
  color: "#CFF5F6",
  textColor: "#0055BC",
  filled: true,
})`
  border-radius: ${rem(4)};
  border-color: #a2e5ef;
  font-size: ${rem(12)};
  text-transform: uppercase;
  height: ${rem(20)};
  padding: ${rem(2)} ${rem(6)};
`;

const StyledModal = styled(Modal)<{ isMobile: boolean }>`
  .ReactModal__Content {
    display: flex;
    flex-direction: column;
    width: ${rem(768)};
    height: ${rem(800)};
    padding: 0;
    box-shadow: 0px 0px 8px 0px #0000004d;
    border-radius: unset;

    ${({ isMobile }) =>
      isMobile &&
      `max-width: unset !important;
      max-height: unset !important;
      width: 100% !important;
      height: 100% !important;`}
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  border-bottom: 1px solid ${palette.slate20};
`;

const ModalTitle = styled(Sans16)`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  color: ${palette.pine1};

  i {
    font-size: ${rem(20)};
    font-weight: 600;
    padding-right: ${rem(spacing.sm)};
    &:hover {
      cursor: pointer;
    }
  }
`;

const ModalCloseButton = styled(Icon)`
  color: ${palette.slate60};
  &:hover {
    cursor: pointer;
  }
`;

const ModalContent = styled.div`
  padding: ${rem(spacing.xl)} ${rem(spacing.xl)} ${rem(spacing.lg)};
`;

const ModalDescription = styled.div`
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.lg)};
`;

const StyledLink = styled(Link)`
  color: ${palette.signal.links} !important;
  border-bottom: 1px solid transparent;
  &:hover {
    border-bottom: 1px solid ${palette.signal.links};
  }
`;

const ModalResults = styled.div`
  padding: 0 ${rem(spacing.xl)};
  border-top: 1px solid ${palette.slate20};
  overflow-y: auto;
`;

const NoteWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  margin: 0 -${rem(spacing.md)};

  &:not(:last-child) {
    border-bottom: 1px solid ${palette.slate10};
  }

  &:hover {
    background: #f9fafa;
    cursor: pointer;
  }
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

const NoteTextDark = styled(Sans14)`
  color: ${palette.pine1};
`;

const NoteTextLight = styled(Sans14)`
  color: ${palette.slate60};
  font-weight: 400;
`;

const NoteAdditionalInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
`;

const NotePreview = styled(MarkdownView)`
  p {
    ${typography.Sans14}
    font-weight: 400;
    color: ${palette.slate60};
  }
  b {
    color: ${palette.pine1};
    font-weight: 400;
  }
`;

const NoteViewWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.xl)};
`;

interface CaseNoteSearchInputProps
  extends React.ComponentPropsWithoutRef<"input"> {
  hasSearchIcon?: boolean;
  hasPrototypeBadge?: boolean;
  onPressReturn: () => void;
}

const CaseNoteSearchInput: React.FC<CaseNoteSearchInputProps> = ({
  onPressReturn,
  hasSearchIcon = true,
  hasPrototypeBadge = true,
  ...props
}) => {
  return (
    <SearchInputWrapper>
      {hasSearchIcon && (
        <SearchInputAside>
          <SearchIcon />
        </SearchInputAside>
      )}
      <SearchInput
        {...props}
        placeholder="Search Case Notes"
        onKeyDown={(e) => {
          if (e.key === "Enter") onPressReturn();
        }}
      />
      {hasPrototypeBadge && (
        <SearchInputAside>
          <PrototypePill>Prototype</PrototypePill>
        </SearchInputAside>
      )}
    </SearchInputWrapper>
  );
};

const NoteView = ({ note }: { note?: CaseNoteSearchResults[0] }) => {
  if (!note) return null;

  return (
    <NoteViewWrapper>
      <NoteHeader>
        <NoteTextLight>
          {formatWorkflowsDateString(note.eventDate)}
        </NoteTextLight>
        <NoteAdditionalInfo>
          <NoteTextLight>{note.noteType}</NoteTextLight>
          <NoteTextLight> | </NoteTextLight>
          <NoteTextLight>{note.contactMode}</NoteTextLight>
        </NoteAdditionalInfo>
      </NoteHeader>
      <NoteTextDark>{note.noteBody}</NoteTextDark>
    </NoteViewWrapper>
  );
};

const SearchView = ({
  searchQuery,
  searchData,
  setSearchQuery,
  handleNoteClick,
  handleReturnClick,
}: {
  searchQuery: string;
  searchData: CaseNoteSearchResults;
  setSearchQuery: (searchQuery: string) => void;
  handleNoteClick: (docId: string) => void;
  handleReturnClick: () => void;
}) => {
  return (
    <>
      <ModalContent>
        <ModalDescription>
          Case Note Search is now available in its beta version! You’re getting
          a first look at our latest innovation, and your feedback is crucial in
          helping us refine and improve it.&nbsp;
          <StyledLink to="https://recidiviz.org">
            Share feedback on search
          </StyledLink>
        </ModalDescription>
        <CaseNoteSearchInput
          hasPrototypeBadge={false}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressReturn={handleReturnClick}
        />
      </ModalContent>
      <ModalResults>
        {searchData.map((d) => (
          <NoteWrapper
            key={d.documentId}
            onClick={() => handleNoteClick(d.documentId)}
          >
            <NoteHeader>
              <NoteTextDark>
                {d.noteTitle || formatWorkflowsDateString(d.eventDate)}
              </NoteTextDark>
              <NoteAdditionalInfo>
                <NoteTextDark>{d.noteType}</NoteTextDark>
                <NoteTextDark> | </NoteTextDark>
                <NoteTextDark>{d.contactMode}</NoteTextDark>
              </NoteAdditionalInfo>
            </NoteHeader>
            <NotePreview markdown={d.preview} />
            <NoteTextLight>
              {formatWorkflowsDateString(d.eventDate)}
            </NoteTextLight>
          </NoteWrapper>
        ))}
      </ModalResults>
    </>
  );
};

export const CaseNoteSearch = observer(function CaseNoteSearch() {
  const { isMobile } = useIsMobile(true);
  const { workflowsStore, analyticsStore, userStore } = useRootStore();

  const { selectedPerson } = workflowsStore;

  const [currentView, setCurrentView] =
    React.useState<CASE_NOTE_SEARCH_VIEWS>("SEARCH_VIEW");
  const [docId, setDocId] = React.useState("");
  const [modalIsOpen, setModalIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchData, setSearchData] = React.useState<CaseNoteSearchResults>([]);

  const isNoteView = currentView === "NOTE_VIEW";
  const currentNote = searchData.find((d) => d.documentId === docId);
  const currentNoteTitle =
    currentNote?.noteTitle || formatWorkflowsDateString(currentNote?.eventDate);

  if (!selectedPerson) return null;

  const handleReturnClick = async () => {
    setCurrentView("SEARCH_VIEW");

    const { caseNoteSearchData } = await import(
      "../../../tools/fixtures/caseNoteSearch"
    );

    const { results, error } = caseNoteSearchData;

    analyticsStore.trackCaseNoteSearch({
      userPseudonymizedId: userStore.userPseudoId,
      clientPseudonymizedId: selectedPerson.pseudonymizedId,
      numResults: results.length,
      error: error,
    });

    if (error) {
      return new Error(error);
    } else {
      setSearchData(results);
      if (!modalIsOpen) setModalIsOpen(true);
    }
  };

  const handleNoteClick = (docId: string) => {
    setDocId(docId);
    setCurrentView("NOTE_VIEW");
  };

  return (
    <Wrapper>
      <CaseNoteSearchInput
        value={searchQuery}
        onPressReturn={handleReturnClick}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <StyledModal
        isMobile={isMobile}
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
      >
        <ModalHeader>
          <ModalTitle>
            {isNoteView && (
              <i
                className="fa fa-angle-left"
                onClick={() => setCurrentView("SEARCH_VIEW")}
              />
            )}
            {isNoteView ? currentNoteTitle : "Case Note Search"}
            <PrototypePill>Prototype</PrototypePill>
          </ModalTitle>
          <ModalCloseButton
            kind="Close"
            size={14}
            onClick={() => setModalIsOpen(false)}
          />
        </ModalHeader>
        {isNoteView ? (
          <NoteView note={currentNote} />
        ) : (
          <SearchView
            searchQuery={searchQuery}
            searchData={searchData}
            setSearchQuery={setSearchQuery}
            handleNoteClick={handleNoteClick}
            handleReturnClick={handleReturnClick}
          />
        )}
      </StyledModal>
    </Wrapper>
  );
});
