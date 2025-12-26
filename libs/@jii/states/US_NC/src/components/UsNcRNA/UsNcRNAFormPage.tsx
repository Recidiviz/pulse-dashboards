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

import { Card, usePageTitle } from "~@jii/common-ui";

import { NavigationButtons } from "./NavigationButtons";
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

  return (
    <>
      <UsNcRNASectionInfo {...rnaSectionCopy[fullRNASpec[0].id]} />;
      {fullRNASpec[0].questions.map((questionId) => {
        <UsNcRNASectionInfo
          heading={"Question placeholder"}
          description={rnaQuestionCopy[questionId].question}
        />;

        return null;
      })}
      <NavigationButtons showPrevious={false} />
      <NavigationButtons />
      <NavigationButtons showSubmit={true} />
    </>
  );
}
