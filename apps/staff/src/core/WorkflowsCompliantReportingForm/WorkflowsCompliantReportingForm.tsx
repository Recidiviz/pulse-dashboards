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

import jsPDF from "jspdf";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";

import { useFeatureVariants } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { DownloadButton, FormContainer } from "../Paperwork/FormContainer";
import FormViewer from "../Paperwork/FormViewer";
import { useOpportunityFormContext } from "../Paperwork/OpportunityFormContext";
import { generate } from "../Paperwork/PDFFormGenerator";
import { PrintablePageContainer } from "../Paperwork/styles";
import FormCR3947Rev0518 from "../Paperwork/US_TN/CompliantReporting";
import { ReioSubmissionModal } from "./ReioSubmissionModal";

const WorkflowsCompliantReportingForm = ({
  opportunity,
}: {
  opportunity: Opportunity;
}) => {
  const form = useOpportunityFormContext();
  const formRef = React.useRef<HTMLDivElement>(null);
  const [isMissingContent, setIsMissingContent] = useState(false);
  const [showReioModal, setShowReioModal] = useState(false);
  const { usTnCompliantReportingWriteback } = useFeatureVariants();

  useEffect(() => {
    const pages = formRef.current?.querySelectorAll(PrintablePageContainer);
    setIsMissingContent(!(pages && pages.length > 0));
  }, [formRef]);

  const onClickDownload = async () => {
    if (!formRef.current) {
      return;
    }
    return generate(formRef.current, `${PrintablePageContainer}`).then(
      (pdf: jsPDF) => {
        pdf.save(
          `${opportunity.person.displayName} - Form CR3947 Rev05-18.pdf`,
        );
      },
    );
  };

  const reioButton = usTnCompliantReportingWriteback ? (
    <DownloadButton onClick={() => setShowReioModal(true)}>
      Download or Submit REIO Note
    </DownloadButton>
  ) : null;

  return (
    <FormContainer
      heading="Compliant Reporting"
      agencyName="TDOC"
      downloadButtonLabel={form.downloadText}
      isMissingContent={isMissingContent}
      onClickDownload={async () => onClickDownload()}
      opportunity={opportunity}
      additionalHeaderButtons={reioButton}
    >
      <FormViewer formRef={formRef}>
        <FormCR3947Rev0518 />
      </FormViewer>
      {usTnCompliantReportingWriteback && (
        <ReioSubmissionModal
          opportunity={opportunity}
          isOpen={showReioModal}
          onClose={() => setShowReioModal(false)}
          onDownload={onClickDownload}
        />
      )}
    </FormContainer>
  );
};

export default observer(WorkflowsCompliantReportingForm);
