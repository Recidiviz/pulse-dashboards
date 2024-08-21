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
  font-size: 12px;
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
  border-bottom: 1px solid ${palette.slate20};
`;

const HeaderTopbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
`;

const ModalTitle = styled(Sans16)`
  color: ${palette.pine1};
`;

const ModalCloseButton = styled(Icon)`
  color: ${palette.slate60};
  &:hover {
    cursor: pointer;
  }
`;

const HeaderSearch = styled.div`
  padding: ${rem(spacing.xl)} ${rem(spacing.xl)} ${rem(spacing.lg)};
  border-top: 1px solid ${palette.slate20};
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

const NoteTitle = styled(Sans14)`
  color: ${palette.pine1};
`;

const OtherInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
`;

const Separator = styled.span`
  color: ${palette.pine1};
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

const NoteDate = styled(Sans14)`
  color: ${palette.slate60};
  font-weight: 400;
`;

interface CaseNoteSearchInputProps
  extends React.ComponentPropsWithoutRef<"input"> {
  hasSearchIcon?: boolean;
  hasPrototypeBadge?: boolean;
  onPressEnter: () => void;
}

const CaseNoteSearchInput: React.FC<CaseNoteSearchInputProps> = ({
  onPressEnter,
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
          if (e.key === "Enter") onPressEnter();
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

export const CaseNoteSearch = observer(function CaseNoteSearch() {
  const { isMobile } = useIsMobile(true);
  const { workflowsStore, analyticsStore, userStore } = useRootStore();

  const { selectedPerson } = workflowsStore;

  const [modalIsOpen, setModalIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchData, setSearchData] = React.useState<CaseNoteSearchResults>([]);

  if (!selectedPerson) return null;

  const handleReturnClick = async () => {
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

  return (
    <Wrapper>
      <CaseNoteSearchInput
        onPressEnter={handleReturnClick}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <StyledModal
        isMobile={isMobile}
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
      >
        <ModalHeader>
          <HeaderTopbar>
            <ModalTitle>
              Case Note Search &nbsp;
              <PrototypePill>Prototype</PrototypePill>
            </ModalTitle>
            <ModalCloseButton
              kind="Close"
              size={14}
              onClick={() => setModalIsOpen(false)}
            />
          </HeaderTopbar>
          <HeaderSearch>
            <ModalDescription>
              Case Note Search is now available in its beta version! You’re
              getting a first look at our latest innovation, and your feedback
              is crucial in helping us refine and improve it.&nbsp;
              <StyledLink to="https://recidiviz.org">
                Share feedback on search
              </StyledLink>
            </ModalDescription>
            <CaseNoteSearchInput
              hasPrototypeBadge={false}
              defaultValue={searchQuery}
              onPressEnter={handleReturnClick}
            />
          </HeaderSearch>
        </ModalHeader>
        <ModalResults>
          {searchData.map((d) => (
            <NoteWrapper key={d.documentId}>
              <NoteHeader>
                <NoteTitle>
                  {d.noteTitle || formatWorkflowsDateString(d.eventDate)}
                </NoteTitle>
                <OtherInfo>
                  <NoteTitle>{d.noteType}</NoteTitle>
                  <Separator> | </Separator>
                  <NoteTitle>{d.contactMode}</NoteTitle>
                </OtherInfo>
              </NoteHeader>
              <NotePreview markdown={d.preview} />
              <NoteDate>{formatWorkflowsDateString(d.eventDate)}</NoteDate>
            </NoteWrapper>
          ))}
        </ModalResults>
      </StyledModal>
    </Wrapper>
  );
});
