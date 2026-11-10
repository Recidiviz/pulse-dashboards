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

import React, { useEffect, useState } from "react";

import { HousingApplicationForm } from "../HousingApplicationForm";
import { FormContextProvider } from "../HousingApplicationForm/FormContext/FormContext";
import { useHousingApplicationForm } from "../HousingApplicationForm/hooks/useHousingApplicationForm";
import type { HousingApplicationForm as HousingApplicationFormValues } from "../HousingApplicationForm/types";
import { LAST_STEP } from "../HousingApplicationForm/utils/steps";
import { PdfViewer } from "../HousingApplications/PdfViewer";
import { Modal } from "../Modal/Modal";
import * as Styled from "./IntakeFormModal.styles";

const INTAKE_MODAL_WIDTH = "clamp(0rem, 96vw, 81.8325rem)";
const INTAKE_MODAL_HEIGHT = "min(50rem, 92dvh)";

type IntakeFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicationId: string) => void;
  onPrepareDigitizedPdf?: (
    values: HousingApplicationFormValues,
  ) => Promise<File | null>;
  pdf: string | null;
  defaultValues?: HousingApplicationFormValues | null;
};

export const IntakeFormModal: React.FC<IntakeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onPrepareDigitizedPdf,
  pdf,
  defaultValues,
}) => {
  const applicationForm = useHousingApplicationForm(defaultValues ?? undefined);
  const { step, setStep } = applicationForm;
  const [numPages, setNumPages] = useState<number | null>(null);

  const maxStep = numPages ? Math.min(numPages, LAST_STEP) : LAST_STEP;
  const safeStep = Math.max(1, Math.min(step, maxStep));

  const resetModalState = () => {
    setNumPages(null);
    applicationForm.form.reset();
    setStep(1);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const handleSubmit = (applicationId: string) => {
    resetModalState();
    onSubmit(applicationId);
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen, pdf, setStep]);

  return (
    <Modal
      isOpen={isOpen}
      hideModal={handleClose}
      width={INTAKE_MODAL_WIDTH}
      height={INTAKE_MODAL_HEIGHT}
      maxWidth={INTAKE_MODAL_WIDTH}
      padding="0"
    >
      <Styled.Content>
        <FormContextProvider value={applicationForm}>
          <Styled.PdfPanel>
            <Styled.PdfPage>
              <PdfViewer
                signedUrl={pdf}
                pageNumber={safeStep}
                onLoadSuccess={(pdfDocument) => {
                  setNumPages(pdfDocument.numPages);
                }}
              />
            </Styled.PdfPage>
          </Styled.PdfPanel>
          <HousingApplicationForm
            onClose={handleClose}
            onReview={handleSubmit}
            onPrepareDigitizedPdf={onPrepareDigitizedPdf}
          />
        </FormContextProvider>
      </Styled.Content>
    </Modal>
  );
};
