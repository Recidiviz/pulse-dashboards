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

import assertNever from "assert-never";
import { observer } from "mobx-react-lite";

import { Icon } from "~design-system";

import { InvalidAnswerNotice, QuestionCard } from "./styles";
import { UsNcRNADaysQuestion } from "./UsNcRNADaysQuestion";
import { UsNcRNAFormPagePresenter } from "./UsNcRNAFormPagePresenter";
import {
  rnaMiscellaneousCopy,
  RNAQuestionConfig,
  RNAQuestionCopy,
  RNAQuestionId,
} from "./usNcRNAFormSpec";
import { UsNcRNALifeAreaQuestion } from "./UsNcRNALifeAreaQuestion";
import { UsNcRNARadioQuestion } from "./UsNcRNARadioQuestion";
import { UsNcRNASobrietyQuestion } from "./UsNcRNASobrietyQuestion";

export interface RNAQuestionProps extends RNAQuestionCopy, RNAQuestionConfig {
  id: RNAQuestionId;
  presenter: UsNcRNAFormPagePresenter;
}

/**
 * Component representing a question in the RNA form.
 * Renders the appropriate component based on the question format.
 */
const UsNcRNAQuestionContents = function (props: RNAQuestionProps) {
  const { format, ...rest } = props;
  switch (format) {
    case "DAYS_PER_WEEK_RADIO":
    case "FREQUENCY":
    case "RATIO":
    case "YES_NO":
      return <UsNcRNARadioQuestion format={format} {...rest} />;
    case "SOBRIETY":
      return <UsNcRNASobrietyQuestion format={format} {...rest} />;
    case "DAYS_PER_WEEK_ENTRY":
      return <UsNcRNADaysQuestion format={format} {...rest} />;
    case "LIFE_AREA":
      return <UsNcRNALifeAreaQuestion format={format} {...rest} />;
    default:
      assertNever(format);
  }
};

export const UsNcRNAQuestion = observer(function UsNcRNAQuestion(
  props: RNAQuestionProps,
) {
  const { id, presenter } = props;

  const invalid = presenter.isVisiblyInvalid(id);

  return (
    <QuestionCard $invalid={invalid}>
      <UsNcRNAQuestionContents {...props} />

      {invalid && (
        <div>
          <Icon kind={"Alert"} />
          <InvalidAnswerNotice>
            {rnaMiscellaneousCopy["INVALID_ANSWER_NOTICE"]}
          </InvalidAnswerNotice>
        </div>
      )}
    </QuestionCard>
  );
});
