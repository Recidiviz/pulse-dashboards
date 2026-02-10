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

import {
  isRNARadioFormat,
  rnaQuestionConfig,
  RNAQuestionId,
} from "~@jii/configs";

import { ResultsPagePresenter } from "./ResultsPagePresenter";
import { RNAResultsAnswerGrid } from "./RNAResultsAnswerGrid";
import { RNAResultsAnswerList } from "./RNAResultsAnswerList";
import { RNAResultsLifeAreaGrid } from "./RNAResultsLifeAreaGrid";

export type RNAResultsSectionProps = {
  questions: RNAQuestionId[];
  presenter: ResultsPagePresenter;
};

export const RNAResultsSection = ({
  questions,
  presenter,
}: RNAResultsSectionProps) => {
  const questionFormats = questions.map((id) => rnaQuestionConfig[id].format);
  const hasOnlyOneFormat = new Set(questionFormats).size === 1;

  if (hasOnlyOneFormat && isRNARadioFormat(questionFormats[0])) {
    return (
      <RNAResultsAnswerGrid
        questions={questions}
        presenter={presenter}
        format={questionFormats[0]}
      />
    );
  } else if (hasOnlyOneFormat && questionFormats[0] === "LIFE_AREA") {
    return (
      <RNAResultsLifeAreaGrid questions={questions} presenter={presenter} />
    );
  } else {
    return <RNAResultsAnswerList questions={questions} presenter={presenter} />;
  }
};
