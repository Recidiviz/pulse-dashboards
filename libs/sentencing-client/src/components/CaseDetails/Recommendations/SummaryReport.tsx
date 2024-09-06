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
import generatePDF from "react-to-pdf";

import { Case, Client, Insight } from "../../../api";
import CheckIcon from "../../assets/check-icon.svg?react";
import CheckWhiteIcon from "../../assets/check-white-icon.svg?react";
import CopyIcon from "../../assets/copy-icon.svg?react";
import DownloadIcon from "../../assets/download-icon.svg?react";
import * as Styled from "../CaseDetails.styles";
import { PDF_PAGE_WIDTH } from "../constants";
import { Report } from "../Recommendations/report/Report";
import { SelectedRecommendation } from "../types";
import { generateRecommendationSummary } from "./summaryUtils";

const BUTTON_CHANGE_TIMEOUT = 2500;
const TOAST_TIMEOUT = 3000;

type SummaryReportProps = {
  firstName?: string;
  fullName?: string;
  insight?: Insight;
  externalId: string;
  selectedRecommendation: SelectedRecommendation;
  needs: Case["needsToBeAddressed"];
  opportunityDescriptions?: string[];
  gender?: Client["gender"];
  hideSummaryReport: () => void;
  setCaseStatusCompleted: () => void;
};

export const SummaryReport: React.FC<SummaryReportProps> = ({
  firstName,
  fullName,
  insight,
  externalId,
  selectedRecommendation,
  needs,
  opportunityDescriptions,
  gender,
  hideSummaryReport,
  setCaseStatusCompleted,
}) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const defaultRecommendationSummary = generateRecommendationSummary({
    recommendation: selectedRecommendation,
    fullName,
    needs,
    opportunityDescriptions,
    gender,
  });

  const [hasDownloadedReport, setHasDownloadedReport] = useState(false);
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [summaryValue, setSummaryValue] = useState(
    defaultRecommendationSummary ?? "",
  );

  /** Handles the copying of the generated (and optionally edited) summary to a user's clipboard */
  const handleCopySummaryToClipboard = () => {
    navigator.clipboard.writeText(summaryValue);
    setHasCopiedText(true);
    setTimeout(() => setHasCopiedText(false), BUTTON_CHANGE_TIMEOUT);
  };

  const handleClickToDownload = () => {
    setHasDownloadedReport(true);
    generatePDF(targetRef, {
      filename: `${fullName?.replaceAll(" ", "")}Recommendation.pdf`, // "FirstNameLastNameRecommendation.pdf"
    });
    setTimeout(() => setHasDownloadedReport(false), BUTTON_CHANGE_TIMEOUT);
  };

  /** Marks the case status as "Complete" and hides the summary report view */
  const completeSummaryReport = () => {
    setCaseStatusCompleted();
    hideSummaryReport();
    toast(() => <span>{firstName}'s case has been updated</span>, {
      duration: TOAST_TIMEOUT,
    });
  };

  const renderReport = () => (
    <Report
      fullName={fullName}
      externalId={externalId}
      selectedRecommendation={selectedRecommendation}
      insight={insight}
    />
  );

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
            {hasCopiedText ? (
              <>
                <CheckIcon /> Copied to clipboard
              </>
            ) : (
              <>
                <CopyIcon /> Copy to clipboard
              </>
            )}
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

          {/* Preview PDF */}
          <Styled.PlaceholderPdfPreview>
            <Styled.ReportPDFContainer>
              <div style={{ scale: "0.24" }}>{renderReport()}</div>
            </Styled.ReportPDFContainer>
          </Styled.PlaceholderPdfPreview>
          <Styled.ActionButton onClick={handleClickToDownload}>
            {hasDownloadedReport ? (
              <>
                <CheckWhiteIcon />
                Downloaded
              </>
            ) : (
              <>
                <DownloadIcon />
                Download Report
              </>
            )}
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

      {/* PDF Report */}
      <Styled.ReportPDFContainer>
        <div ref={targetRef} style={{ width: `${PDF_PAGE_WIDTH}px` }}>
          {renderReport()}
        </div>
      </Styled.ReportPDFContainer>
    </Styled.RecommendationSummaryReport>
  );
};
