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

import DomPurify from "dompurify";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect } from "react";

import { isOfflineMode } from "~client-env-utils";
import { CaseNoteSearchResults } from "~datatypes";

import {
  PartiallyTypedRootStore,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { formatWorkflowsDate } from "../../utils";
import {
  ModalCloseButton,
  ModalHeader,
  ModalTitle,
  StyledModal,
  Wrapper,
} from "./CaseNoteSearch.styles";
import {
  NoteAdditionalInfo,
  NoteHeader,
  NoteTextDark,
  NoteTextLight,
  NoteViewWrapper,
  PrototypePill,
} from "./common/Styles";
import { CASE_NOTE_SEARCH_VIEWS, SortOrder } from "./common/types";
import { CaseNoteSearchInput } from "./components/CaseNoteSearchInput/CaseNoteSearchInput";
import { SearchView } from "./components/SearchView/SearchView";
import { trpc } from "./trpc";

const NoteView = ({ note }: { note?: CaseNoteSearchResults[0] }) => {
  if (!note) return null;

  const sanitizedNoteBody = note.fullText
    ? DomPurify.sanitize(note.fullText, { FORBID_ATTR: ["style"] })
    : "";

  return (
    <NoteViewWrapper>
      <NoteHeader>
        <NoteTextLight className="fs-exclude">
          {formatWorkflowsDate(note.date)}
        </NoteTextLight>
        <NoteAdditionalInfo>
          <NoteTextLight className="fs-exclude">{note.type}</NoteTextLight>
          <NoteTextLight> | </NoteTextLight>
          <NoteTextLight className="fs-exclude">
            {note.contactMode}
          </NoteTextLight>
        </NoteAdditionalInfo>
      </NoteHeader>
      <NoteTextDark
        className="fs-exclude"
        dangerouslySetInnerHTML={{ __html: sanitizedNoteBody }}
      ></NoteTextDark>
    </NoteViewWrapper>
  );
};

export const CaseNoteSearch = observer(function CaseNoteSearch() {
  const { isMobile } = useIsMobile(true);
  // TODO(#5636) Eliminate PartiallyTypedRootStore
  const { workflowsStore, analyticsStore, userStore } =
    useRootStore() as PartiallyTypedRootStore;
  const [currentView, setCurrentView] =
    React.useState<CASE_NOTE_SEARCH_VIEWS>("SEARCH_VIEW");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("Relevance");
  const [docId, setDocId] = React.useState<string>();
  const [modalIsOpen, setModalIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [scrollPosition, setScrollPosition] = React.useState(0);

  const { selectedPerson } = workflowsStore;

  const shouldUseOfflineData = isOfflineMode();

  const logResults = useCallback(
    (numResults?: number, error?: string) => {
      if (!selectedPerson || shouldUseOfflineData) {
        return;
      }

      analyticsStore.trackCaseNoteSearch({
        userPseudonymizedId: userStore.userPseudoId,
        clientPseudonymizedId: selectedPerson.pseudonymizedId,
        numResults,
        error,
      });
    },
    [
      analyticsStore,
      userStore.userPseudoId,
      selectedPerson,
      shouldUseOfflineData,
    ],
  );

  const {
    data,
    status,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    error,
  } = trpc.search.useInfiniteQuery(
    {
      query: searchQuery,
      // This query will only execute if selected person is true
      clientExternalId: selectedPerson?.externalId,
      userExternalId: userStore.externalId,
    },
    {
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken && lastPage.nextPageToken?.length > 0
          ? lastPage.nextPageToken
          : null,
      enabled: selectedPerson && searchQuery !== "" && !shouldUseOfflineData,
      gcTime: 0,
    },
  );

  useEffect(() => {
    if (!selectedPerson || shouldUseOfflineData) {
      return;
    }

    if (error) {
      logResults(undefined, error.message);
    } else if (data) {
      logResults(data.pages.flat().length, undefined);
    }
  }, [error, logResults, data, selectedPerson, shouldUseOfflineData]);

  if (!selectedPerson) return null;

  const isNoteView = currentView === "NOTE_VIEW";

  const searchResults = data?.pages.map((page) => page.results).flat() ?? [];

  const currentNote = docId
    ? searchResults.find((d) => d.documentId === docId)
    : undefined;

  const currentNoteTitle =
    currentNote?.title || formatWorkflowsDate(currentNote?.date);

  const handleReturnClick = async (newSearchQuery: string) => {
    setSearchQuery(newSearchQuery);
    setCurrentView("SEARCH_VIEW");
    setScrollPosition(0);
    if (!modalIsOpen) setModalIsOpen(true);
  };

  const handleNoteClick = (docId: string) => {
    analyticsStore.trackNoteClicked({
      userPseudonymizedId: userStore.userPseudoId,
      clientPseudonymizedId: selectedPerson.pseudonymizedId,
      docId,
    });

    setDocId(docId);
    setCurrentView("NOTE_VIEW");
  };

  const handleReachedBottom = async () => {
    if (!hasNextPage || isFetching || isFetchingNextPage) return;
    await fetchNextPage();
    if (sortOrder === "Date") {
      setScrollPosition(0);
    }
  };

  return (
    <Wrapper>
      <CaseNoteSearchInput
        initialValue={searchQuery}
        onPressReturn={handleReturnClick}
      />
      <StyledModal
        isMobile={isMobile}
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
      >
        <ModalHeader>
          <ModalTitle className={isNoteView ? "fs-exclude" : ""}>
            {isNoteView && (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
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
            searchStatus={status}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage ?? false}
            searchQuery={searchQuery}
            searchResults={searchResults}
            handleNoteClick={handleNoteClick}
            handleReturnClick={handleReturnClick}
            sortOrder={sortOrder}
            updateSortOrder={setSortOrder}
            initialScrollPosition={scrollPosition}
            setScrollPosition={setScrollPosition}
            onReachedBottom={handleReachedBottom}
          />
        )}
      </StyledModal>
    </Wrapper>
  );
});
