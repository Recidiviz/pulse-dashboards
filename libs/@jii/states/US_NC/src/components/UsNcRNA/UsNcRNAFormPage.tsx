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

import { observer } from "mobx-react-lite";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { Card, NotFound, usePageTitle } from "~@jii/common-ui";
import { fullRNASpec, rnaQuestionConfig } from "~@jii/configs";
import { State } from "~@jii/paths";
import { withPresenterManager } from "~hydration-utils";

import { NavigationButtons } from "./NavigationButtons";
import { ProgressHeader } from "./ProgressBar";
import { RNADescription, RNAHeading, UnboxedNotice } from "./styles";
import { useRNAFormContext } from "./UsNcRNAFormContextProvider";
import {
  rnaMiscellaneousCopy,
  RNAPageCopy,
  rnaPageCopy,
  rnaQuestionCopy,
} from "./usNcRNAFormCopy";
import { UsNcRNAFormPagePresenter } from "./UsNcRNAFormPagePresenter";
import { UsNcRNAQuestion } from "./UsNcRNAQuestion";

function UsNcRNASectionInfo({ heading, description }: RNAPageCopy) {
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
const ManagedComponent = observer(function ManagedComponent({
  presenter,
}: {
  presenter: UsNcRNAFormPagePresenter;
}) {
  // (Users should not encounter invalid pages in practice as they can't edit the URL)
  if (!presenter.isValidPage) {
    return <NotFound />;
  }

  const { pageNum, questionIds, pageId, showSubmit } = presenter;
  return (
    <>
      <ProgressHeader
        section={pageNum}
        totalSections={fullRNASpec.length}
        percentDone={22}
      />
      <UsNcRNASectionInfo {...rnaPageCopy[pageId]} />
      <form>
        {questionIds.map((questionId) => (
          <UsNcRNAQuestion
            key={questionId}
            id={questionId}
            presenter={presenter}
            {...rnaQuestionCopy[questionId]}
            {...rnaQuestionConfig[questionId]}
          />
        ))}
        {presenter.hasAnyInvalidAnswer && (
          <UnboxedNotice>
            {rnaMiscellaneousCopy["ANSWER_ALL_QUESTIONS_NOTICE"]}
          </UnboxedNotice>
        )}
        {presenter.isSaving && (
          <UnboxedNotice>{rnaMiscellaneousCopy["SAVING"]}</UnboxedNotice>
        )}
        {presenter.savingError && (
          <UnboxedNotice>
            {rnaMiscellaneousCopy["SAVING_ERROR"]} {presenter.savingError}
          </UnboxedNotice>
        )}
        <NavigationButtons presenter={presenter} showSubmit={showSubmit} />
      </form>
    </>
  );
});

function usePresenter() {
  usePageTitle("Self-Report");

  const { form } = useRNAFormContext();
  const { pageNum } = useTypedParams(State.Resident.UsNcRNA.FormPage);

  return new UsNcRNAFormPagePresenter(pageNum, form);
}

export const UsNcRNAFormPage = withPresenterManager({
  ManagedComponent,
  usePresenter,
  managerIsObserver: true,
});
