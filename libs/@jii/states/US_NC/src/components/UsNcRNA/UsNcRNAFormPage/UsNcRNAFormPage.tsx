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
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { Card, NotFound, usePageTitle } from "~@jii/common-ui";
import {
  allRNAQuestions,
  fullRNASpec,
  RNAPageCopy,
  rnaQuestionConfig,
} from "~@jii/configs";
import { State } from "~@jii/paths";
import { useUsNcTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { RNADescription, RNAHeading, UnboxedNotice } from "../styles";
import { useRNAFormContext } from "../UsNcRNAFormContext/UsNcRNAFormContextProvider";
import { UsNcRNAQuestion } from "../UsNcRNAQuestion/UsNcRNAQuestion";
import { NavigationButtons } from "./NavigationButtons";
import { ProgressHeader } from "./ProgressBar";
import { UsNcRNAFormPagePresenter } from "./UsNcRNAFormPagePresenter";
import { UsNcRNAModal } from "./UsNcRNAModal";

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
  const { t } = useUsNcTranslations();

  // (Users should not encounter invalid pages in practice as they can't edit the URL)
  if (!presenter.isValidPage) {
    return <NotFound />;
  }

  const { pageNum, questionIds, pageId, percentDone } = presenter;

  const pageCopy = t(($) => $.rna.pageCopy[pageId], { returnObjects: true });
  const goBackModalCopy = t(($) => $.rna.page.goBackModal, {
    returnObjects: true,
  });
  const submitModalCopy = t(($) => $.rna.page.confirmSubmissionModal, {
    returnObjects: true,
  });

  return (
    <>
      <ProgressHeader
        section={pageNum}
        totalSections={fullRNASpec.length}
        percentDone={percentDone}
      />
      <UsNcRNASectionInfo {...pageCopy} />

      {questionIds.map((questionId) => {
        const questionCopy = t(($) => $.rna.questionCopy[questionId], {
          returnObjects: true,
        });
        return (
          <UsNcRNAQuestion
            key={questionId}
            id={questionId}
            questionNumber={allRNAQuestions.indexOf(questionId) + 1}
            presenter={presenter}
            {...questionCopy}
            {...rnaQuestionConfig[questionId]}
          />
        );
      })}

      {presenter.hasAnyInvalidAnswer && (
        <UnboxedNotice>{t(($) => $.rna.page.answerAllQuestions)}</UnboxedNotice>
      )}
      {presenter.isSaving && (
        <UnboxedNotice>{t(($) => $.rna.page.saving)}</UnboxedNotice>
      )}
      {presenter.savingError && (
        <UnboxedNotice>
          {t(($) => $.rna.page.savingError)} {presenter.savingError}
        </UnboxedNotice>
      )}
      <NavigationButtons presenter={presenter} />

      <UsNcRNAModal
        isOpen={presenter.isUnsavedChangesModalOpen}
        onCancel={presenter.closeUnsavedChangesModal}
        onConfirm={presenter.navigateBack}
        {...goBackModalCopy}
      />

      <UsNcRNAModal
        isOpen={presenter.isConfirmSubmissionModalOpen}
        onCancel={presenter.closeConfirmSubmissionModal}
        onConfirm={presenter.onConfirmSubmission}
        {...submitModalCopy}
      />
    </>
  );
});

function usePresenter() {
  const { t } = useUsNcTranslations();
  usePageTitle(t(($) => $.pageTitle.rna));

  const navigate = useNavigate();
  const { form } = useRNAFormContext();
  const routeParams = useTypedParams(State.Resident.UsNcRNA.FormPage);

  return new UsNcRNAFormPagePresenter(routeParams, form, navigate);
}

export const UsNcRNAFormPage = withPresenterManager({
  ManagedComponent,
  usePresenter,
  managerIsObserver: true,
});
