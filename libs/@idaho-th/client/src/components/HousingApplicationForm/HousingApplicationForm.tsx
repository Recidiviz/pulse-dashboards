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

import React, { useEffect } from "react";
import toast from "react-hot-toast";

import { useHousingApplicationsStore } from "../../datastores/IdahoTHStoreContext";
import { useSubmitDraftHousingApplication } from "../../hooks/housingApplication";
import { useDigitizedDocumentUpload } from "../../hooks/useDigitizedDocumentUpload";
import { Button1 } from "../../styles";
import XIcon from "../assets/x.svg?react";
import { useFormContext } from "./FormContext/FormContext";
import { FormFooter } from "./FormFooter";
import * as Styled from "./HousingApplicationForm.styles";
import { Page1, Page2, Page3, Page4 } from "./pages";
import type { HousingApplicationForm as HousingApplicationFormValues } from "./types";
import { LAST_STEP, nextStep } from "./utils/steps";

const PAGE_BY_STEP: Record<number, React.FC> = {
  1: Page1,
  2: Page2,
  3: Page3,
  4: Page4,
};

export type HousingApplicationFormProps = {
  onClose?: () => void;
  onReview?: (applicationId: string) => void;
  onPrepareDigitizedPdf?: (
    values: HousingApplicationFormValues,
  ) => Promise<File | null>;
};

export const HousingApplicationForm: React.FC<HousingApplicationFormProps> = ({
  onClose,
  onReview,
  onPrepareDigitizedPdf,
}) => {
  const applicationForm = useFormContext();
  const { form, step, setStep } = applicationForm;
  const housingApplicationsStore = useHousingApplicationsStore();
  const { mutate: submitDraft, isPending } = useSubmitDraftHousingApplication();
  const { uploadDigitizedDocument } = useDigitizedDocumentUpload();

  const CurrentPage = PAGE_BY_STEP[step];

  useEffect(() => {
    form.validate("submit");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNextClick = () => {
    form.validate("submit");
    if (!applicationForm.canProceed()) return;
    if (step === LAST_STEP) {
      const values = form.state.values;

      const applicationId = housingApplicationsStore.currentApplicationId;
      if (!applicationId) {
        // The draft is created during PDF extraction, so this should never
        // happen for the intake flow. Guard against losing the user's edits.
        toast.error("Something went wrong. Please re-upload the application.");
        return;
      }

      submitDraft(
        {
          id: applicationId,
          formData: values,
        },
        {
          onSuccess: (data) => {
            void onPrepareDigitizedPdf?.(values)
              .then((file) =>
                file ? uploadDigitizedDocument(data.id, file) : undefined,
              )
              .catch(() => {
                toast.error("Couldn't save the digitized application PDF.");
              });

            onReview?.(data.id);
          },
        },
      );
    } else {
      setStep?.(nextStep);
    }
  };

  return (
    <Styled.Card>
      <Styled.Header>
        <Styled.PageIndicator>
          <Button1>{`Page ${step} of ${LAST_STEP}`}</Button1>
        </Styled.PageIndicator>
        <Styled.CloseButton
          type="button"
          onClick={onClose}
          aria-label="Close modal"
        >
          <XIcon />
        </Styled.CloseButton>
      </Styled.Header>

      <Styled.Form
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
        }}
      >
        <CurrentPage />

        <FormFooter onNext={handleNextClick} isLoading={isPending} />
      </Styled.Form>
    </Styled.Card>
  );
};
