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

import jsPDF from "jspdf";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";

import { Opportunity } from "../../WorkflowsStore";
import { FormContainer } from "../Paperwork/FormContainer";
import FormViewer from "../Paperwork/FormViewer";
import { generate } from "../Paperwork/PDFFormGenerator";
import { PrintablePage } from "../Paperwork/styles";
import FormPSV323D from "../Paperwork/US_TX/UsTxAnnualReportStatus/PSV-323D";

const WorkflowsUsTxAnnualReportStatusForm = observer(
  function WorkflowsUsTxAnnualReportStatusForm({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;
    const [isMissingContent, setIsMissingContent] = useState(false);

    useEffect(() => {
      // prevent the ability to download form before it has been rendered
      const pages = formRef.current?.querySelectorAll(PrintablePage);
      setIsMissingContent(!(pages && pages.length > 0));
    }, [formRef]);

    const onClickDownload = async () => {
      return generate(formRef.current, `${PrintablePage}`).then(
        (pdf: jsPDF) => {
          pdf.save(
            `${opportunity.person.displayName} - Annual Reporting Status Form.pdf`,
          );
        },
      );
    };

    return (
      <FormContainer
        agencyName="TDCJ"
        heading={opportunity.config.label}
        isMissingContent={isMissingContent}
        onClickDownload={onClickDownload}
        downloadButtonLabel="Download Form"
        opportunity={opportunity}
      >
        <FormViewer formRef={formRef}>
          <FormPSV323D />
        </FormViewer>
      </FormContainer>
    );
  },
);

export default WorkflowsUsTxAnnualReportStatusForm;
