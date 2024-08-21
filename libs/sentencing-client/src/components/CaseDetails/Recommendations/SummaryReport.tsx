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
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

import { Insight } from "../../../api";
import CopyIcon from "../../assets/copy-icon.svg?react";
import DownloadIcon from "../../assets/download-icon.svg?react";
import * as Styled from "../CaseDetails.styles";
import { SelectedRecommendation } from "../types";
import { Report } from "./report/Report";

const COPY_TO_CLIPBOARD_TIMEOUT = 1500;
const TOAST_TIMEOUT = 3000;

type SummaryReportProps = {
  firstName?: string;
  fullName?: string;
  insight?: Insight;
  externalId: string;
  selectedRecommendation: SelectedRecommendation;
  hideSummaryReport: () => void;
  setCaseStatusCompleted: () => void;
};

export const SummaryReport: React.FC<SummaryReportProps> = ({
  firstName,
  fullName,
  insight,
  externalId,
  selectedRecommendation,
  hideSummaryReport,
  setCaseStatusCompleted,
}) => {
  const placeholderRecommendationSummary = `Based on ${fullName}'s multiple mental health diagnosis and high LSI-R score, we submit for the court's consideration that she may be a good candidate for a community-based assisted living program and/or a structured treatment program with an integrated continuum of care. A reentry program may also be appropriate given ${firstName}'s criminal history and high risk of recidivism.`;

  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [summaryValue, setSummaryValue] = useState(
    placeholderRecommendationSummary,
  );

  /** Handles the copying of the generated (and optionally edited) summary to a user's clipboard */
  const handleCopySummaryToClipboard = () => {
    navigator.clipboard.writeText(summaryValue);
    setHasCopiedText(true);
    setTimeout(() => setHasCopiedText(false), COPY_TO_CLIPBOARD_TIMEOUT);
  };

  /** Marks the case status as "Complete" and hides the summary report view */
  const completeSummaryReport = () => {
    setCaseStatusCompleted();
    hideSummaryReport();
    toast(() => <span>{firstName}'s case has been updated</span>, {
      duration: TOAST_TIMEOUT,
    });
  };

  const reportRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
  });

  return (
    <Styled.RecommendationSummaryReport>
      <Styled.SummaryReportWrapper>
        <Styled.BackLink
          onClick={hideSummaryReport}
        >{`Back to Case`}</Styled.BackLink>

        <Styled.SummaryReportTitle>
          Make Recommendation & Download Report
        </Styled.SummaryReportTitle>

        {/* Step 1: Download Insights Report */}
        <Styled.SectionWrapper>
          <div>Step 1</div>
          <Styled.SummaryReportSectionTitle>
            Craft recommendation summary
          </Styled.SummaryReportSectionTitle>
          <div>
            Below is an editable summary of your recommendation for {firstName},
            including a description of any community opportunities you selected.
            You can copy and paste it into your own report.
          </div>
          <Styled.SummaryTextAreaWrapper>
            <Styled.TextArea
              value={summaryValue}
              onChange={(e) => setSummaryValue(e.target.value)}
            />
          </Styled.SummaryTextAreaWrapper>
          <Styled.ActionButton
            kind="bordered"
            onClick={handleCopySummaryToClipboard}
          >
            <CopyIcon />
            {hasCopiedText ? "Copied to clipboard!" : "Copy to clipboard"}
          </Styled.ActionButton>
        </Styled.SectionWrapper>

        {/* Step 2: Download Insights Report */}
        <Styled.SectionWrapper>
          <div>Step 2</div>
          <Styled.SummaryReportSectionTitle>
            Download Insights Report
          </Styled.SummaryReportSectionTitle>
          <div>
            Download this PDF and include it as an attachment to your finished
            report.
          </div>
          <Styled.PlaceholderPdfPreview />
          <div style={{ display: "none" }}>
            <div ref={reportRef}>
              {insight ? (
                <Report
                  fullName={fullName}
                  externalId={externalId}
                  selectedRecommendation={selectedRecommendation}
                  insight={insight}
                />
              ) : null}
            </div>
          </div>
          <Styled.ActionButton onClick={handlePrint}>
            <DownloadIcon />
            Download Report
          </Styled.ActionButton>
        </Styled.SectionWrapper>

        <Styled.ButtonWrapper>
          <Styled.ActionButton kind="link" onClick={hideSummaryReport}>
            Cancel
          </Styled.ActionButton>
          <Styled.ActionButton onClick={completeSummaryReport}>
            Complete
          </Styled.ActionButton>
        </Styled.ButtonWrapper>
      </Styled.SummaryReportWrapper>
    </Styled.RecommendationSummaryReport>
  );
};
