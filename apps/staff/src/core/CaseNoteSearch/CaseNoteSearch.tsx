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
import React from "react";

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import { CaseNoteSearchResults, caseNoteSearchSchema } from "~datatypes";
import { castToError } from "~hydration-utils";

import {
  PartiallyTypedRootStore,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { formatWorkflowsDateString } from "../../utils";
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
import {
  CASE_NOTE_SEARCH_RESULTS_STATUS,
  CASE_NOTE_SEARCH_VIEWS,
  SortOrder,
} from "./common/types";
import { CaseNoteSearchInput } from "./components/CaseNoteSearchInput/CaseNoteSearchInput";
import { SearchView } from "./components/SearchView/SearchView";

const NoteView = ({ note }: { note?: CaseNoteSearchResults[0] }) => {
  if (!note) return null;

  const sanitizedNoteBody = note.noteBody
    ? DomPurify.sanitize(note.noteBody, { FORBID_ATTR: ["style"] })
    : "";

  return (
    <NoteViewWrapper>
      <NoteHeader>
        <NoteTextLight className="fs-exclude">
          {formatWorkflowsDateString(note.eventDate)}
        </NoteTextLight>
        <NoteAdditionalInfo>
          <NoteTextLight className="fs-exclude">{note.noteType}</NoteTextLight>
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
  const { workflowsStore, analyticsStore, userStore, apiStore } =
    useRootStore() as PartiallyTypedRootStore;

  const { selectedPerson } = workflowsStore;

  const [currentView, setCurrentView] =
    React.useState<CASE_NOTE_SEARCH_VIEWS>("SEARCH_VIEW");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("Relevance");
  const [docId, setDocId] = React.useState<string>();
  const [modalIsOpen, setModalIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] =
    React.useState<CaseNoteSearchResults>([]);
  const [resultsStatus, setResultsStatus] =
    React.useState<CASE_NOTE_SEARCH_RESULTS_STATUS>("NO_RESULTS");

  const isNoteView = currentView === "NOTE_VIEW";
  const currentNote = docId
    ? searchResults.find((d) => d.documentId === docId)
    : undefined;
  const currentNoteTitle =
    currentNote?.noteTitle || formatWorkflowsDateString(currentNote?.eventDate);
  const [scrollPosition, setScrollPosition] = React.useState(0);

  if (!selectedPerson) return null;

  const handleResponseData = (
    results: CaseNoteSearchResults | null,
    error: string | null,
  ) => {
    const numResults = results?.length ?? 0;

    analyticsStore.trackCaseNoteSearch({
      userPseudonymizedId: userStore.userPseudoId,
      clientPseudonymizedId: selectedPerson.pseudonymizedId,
      numResults,
      error: error,
    });

    if (error) {
      setResultsStatus("ERROR");
      return new Error(error);
    }

    setResultsStatus(numResults > 0 ? "OK" : "NO_RESULTS");
    setSearchResults(results ?? []);
  };

  const handleReturnClick = async () => {
    setResultsStatus("LOADING");
    setCurrentView("SEARCH_VIEW");
    setScrollPosition(0);
    if (!modalIsOpen) setModalIsOpen(true);

    if (isDemoMode() || isOfflineMode()) {
      const { caseNoteSearchData } = await import(
        "../../../tools/fixtures/caseNoteSearch"
      );

      const { results, error } = caseNoteSearchData;

      handleResponseData(results, error);
    } else {
      const baseUrl = `${import.meta.env.VITE_PROTOTYPES_API_URL}`;
      const endpoint = `${baseUrl}/search?query=${searchQuery}&external_id=${selectedPerson.externalId}&user_id=${userStore.externalId}&state_code=${selectedPerson.stateCode}`;

      try {
        const data = await apiStore.get(endpoint);
        const parsedData = caseNoteSearchSchema.parse(data);
        const { results, error } = parsedData;
        handleResponseData(results, error);
      } catch (e) {
        handleResponseData(null, castToError(e).message);
      }
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
          <ModalTitle className={isNoteView ? "fs-exclude" : ""}>
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
            resultsStatus={resultsStatus}
            searchQuery={searchQuery}
            searchResults={searchResults}
            setSearchQuery={setSearchQuery}
            handleNoteClick={handleNoteClick}
            handleReturnClick={handleReturnClick}
            sortOrder={sortOrder}
            updateSortOrder={setSortOrder}
            initialScrollPosition={scrollPosition}
            setScrollPosition={setScrollPosition}
          />
        )}
      </StyledModal>
    </Wrapper>
  );
});
