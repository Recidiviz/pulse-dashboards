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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { Card, NotFound, usePageTitle } from "~@jii/common-ui";
import { State } from "~@jii/paths";

import { NavigationButtons } from "./NavigationButtons";
import { ProgressHeader } from "./ProgressBar";
import { RNADescription, RNAHeading } from "./styles";
import {
  fullRNASpec,
  rnaQuestionCopy,
  RNASectionCopy,
  rnaSectionCopy,
} from "./usNcRNAFormSpec";

function UsNcRNASectionInfo({ heading, description }: RNASectionCopy) {
  return (
    <Card>
      <RNAHeading>{heading}</RNAHeading>
      {description && <RNADescription>{description}</RNADescription>}
    </Card>
  );
}

/**
 * A form page for Risks and Needs Assessment, displaying progress and questions
 */
export function UsNcRNAFormPage() {
  usePageTitle("Self-Report");

  // Grab the page number from the URL and check that it's valid
  // (Users should not encounter invalid pages in practice as they can't edit the URL)
  const { pageNum } = useTypedParams(State.Resident.UsNcRNA.FormPage);
  const pageIndex = pageNum - 1;
  if (
    !Number.isInteger(pageIndex) ||
    pageIndex < 0 ||
    pageIndex >= fullRNASpec.length
  ) {
    return <NotFound />;
  }

  const { id, questions } = fullRNASpec[pageIndex];
  const showSubmit = pageIndex === fullRNASpec.length - 1;

  return (
    <>
      <ProgressHeader
        section={pageNum}
        totalSections={fullRNASpec.length}
        percentDone={22}
      />
      <UsNcRNASectionInfo {...rnaSectionCopy[id]} />
      {questions.map((questionId) => (
        // TODO: replace with handler for different question types
        <UsNcRNASectionInfo
          heading={"Question placeholder"}
          description={rnaQuestionCopy[questionId].question}
        />
      ))}
      <NavigationButtons currentPageNum={pageNum} showSubmit={showSubmit} />
    </>
  );
}
