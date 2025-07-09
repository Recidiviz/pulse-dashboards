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

import { debounce } from "lodash";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import generatePDF from "react-to-pdf";

import { Case, CaseInsight, Client } from "../../../api";
import { GeoConfig } from "../../../geoConfigs/types";
import { PSI_PATHS } from "../../../utils/routing";
import CheckIcon from "../../assets/check-icon.svg?react";
import CheckWhiteIcon from "../../assets/check-white-icon.svg?react";
import CopyIcon from "../../assets/copy-icon.svg?react";
import DownloadIcon from "../../assets/download-icon.svg?react";
import RefreshIcon from "../../assets/refresh-icon.svg?react";
import * as Styled from "../CaseDetails.styles";
import { PDF_PAGE_WIDTH } from "../constants";
import {
  parseNeedsToBeAddressedValue,
  parseProtectiveFactorsValue,
} from "../Form/utils";
import { MutableCaseAttributes, SelectedRecommendation } from "../types";
import { Report } from "./report/Report";
import { generateRecommendationSummary } from "./summaryUtils";
import { useReportSummaryOverflowDetector } from "./useReportSummaryOverflowDetector";

const BUTTON_CHANGE_TIMEOUT = 5000;
const TOAST_TIMEOUT = 3000;

type SummaryReportProps = {
  firstName?: string;
  fullName?: string;
  geoConfig: GeoConfig;
  age?: number;
  insight?: CaseInsight;
  externalId?: string;
  selectedRecommendation: SelectedRecommendation;
  needs?: Case["needsToBeAddressed"];
  protectiveFactors?: Case["protectiveFactors"];
  opportunityDescriptions?: string[];
  gender?: Client["gender"];
  analytics: {
    trackCopySummaryToClipboardClicked: () => void;
    trackDownloadReportClicked: () => void;
    trackCaseStatusCompleteClicked: () => void;
  };
  hideSummaryReport: () => void;
  setCaseStatusCompleted: () => Promise<void>;
  updateAttributes: (attributes?: MutableCaseAttributes) => Promise<void>;
  isCreatingRecommendation: boolean;
  savedSummary?: string | null;
};

export const SummaryReport: React.FC<SummaryReportProps> = ({
  firstName,
  fullName,
  geoConfig,
  age,
  insight,
  externalId,
  selectedRecommendation,
  needs,
  protectiveFactors,
  opportunityDescriptions,
  gender,
  analytics,
  updateAttributes,
  hideSummaryReport,
  setCaseStatusCompleted,
  isCreatingRecommendation,
  savedSummary,
}) => {
  const navigate = useNavigate();
  const {
    trackCopySummaryToClipboardClicked,
    trackDownloadReportClicked,
    trackCaseStatusCompleteClicked,
  } = analytics;
  const targetRef = useRef<HTMLDivElement>(null);

  const hasPrevSavedRecommendation =
    Boolean(savedSummary) || savedSummary === "";
  const defaultRecommendationSummary = hasPrevSavedRecommendation
    ? savedSummary
    : generateRecommendationSummary({
        recommendation: selectedRecommendation,
        fullName,
        needs,
        protectiveFactors,
        opportunityDescriptions,
        gender,
        geoConfig,
      });

  const [hasDownloadedReport, setHasDownloadedReport] = useState(false);
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [summaryValue, setSummaryValue] = useState(
    defaultRecommendationSummary ?? "",
  );

  const { ReportSummaryOverflowDetector, showOverflowError, willOverflow } =
    useReportSummaryOverflowDetector(geoConfig.hideRecidivismRatesChart);

  const saveSummary = async (value: string) => {
    await updateAttributes({ recommendationSummary: value });
    toast(() => <span>Recommendation summary changes saved</span>, {
      duration: 3000,
    });
  };

  const debouncedSave = useRef(
    debounce((value) => {
      saveSummary(value);
    }, 1000),
  ).current;

  const handleSummaryChangeAndSave = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    if (willOverflow(value)) {
      return;
    }

    setSummaryValue(value);
    debouncedSave(value);
  };

  const regenerateSummary = async () => {
    const regeneratedSummary = generateRecommendationSummary({
      recommendation: selectedRecommendation,
      fullName,
      needs,
      protectiveFactors,
      opportunityDescriptions,
      gender,
      geoConfig,
    });
    setSummaryValue(regeneratedSummary ?? "");
    willOverflow(regeneratedSummary ?? "");
    /**
     * Remove the saved recommendation so next time a user enters this flow,
     * it falls back to the default behavior of auto-generating a summary.
     */
    await updateAttributes({ recommendationSummary: null });
  };

  /** Handles the copying of the generated (and optionally edited) summary to a user's clipboard */
  const handleCopySummaryToClipboard = () => {
    navigator.clipboard.writeText(summaryValue);
    setHasCopiedText(true);
    trackCopySummaryToClipboardClicked();
    setTimeout(() => setHasCopiedText(false), BUTTON_CHANGE_TIMEOUT);
  };

  const handleClickToDownload = () => {
    setHasDownloadedReport(true);
    trackDownloadReportClicked();
    generatePDF(targetRef, {
      filename: `PSI Recommendation Report - ${fullName}.pdf`,
    });
    setTimeout(() => setHasDownloadedReport(false), BUTTON_CHANGE_TIMEOUT);
  };

  /** Marks the case status as "Complete" and hides the summary report view */
  const completeSummaryReport = async () => {
    await setCaseStatusCompleted();

    if (isCreatingRecommendation) {
      navigate(PSI_PATHS.psi);
    }

    trackCaseStatusCompleteClicked();
    hideSummaryReport();

    toast(
      () => (
        <span>
          {firstName}'s case has been{" "}
          {isCreatingRecommendation ? "completed" : "updated"}
        </span>
      ),
      {
        duration: TOAST_TIMEOUT,
      },
    );
  };

  const renderReport = () => (
    <Report
      fullName={fullName}
      age={age}
      externalId={externalId ?? ""}
      selectedRecommendation={selectedRecommendation}
      insight={insight}
      geoConfig={geoConfig}
      protectiveFactors={parseProtectiveFactorsValue(protectiveFactors)}
      needs={parseNeedsToBeAddressedValue(needs)}
      recommendationSummary={summaryValue}
    />
  );

  const copyButton = !geoConfig.hideRecidivismRatesChart && (
    <Styled.ActionButton kind="bordered" onClick={handleCopySummaryToClipboard}>
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
              onChange={handleSummaryChangeAndSave}
              hasError={showOverflowError}
            />
            {ReportSummaryOverflowDetector}
            {showOverflowError && (
              <Styled.ErrorMessage style={{ fontSize: "0.7rem" }}>
                Summary exceeds the allowable length for the report. Please
                shorten to ensure it fits the space.
              </Styled.ErrorMessage>
            )}
            {hasPrevSavedRecommendation && (
              <Styled.InputDescription>
                This is the version of the summary you last edited. To
                regenerate the summary, click Regenerate.
              </Styled.InputDescription>
            )}
          </Styled.SummaryTextAreaWrapper>
          <Styled.ActionButtonRowWrapper>
            {copyButton}

            {hasPrevSavedRecommendation && (
              <Styled.ActionButton kind="bordered" onClick={regenerateSummary}>
                <RefreshIcon /> Regenerate
              </Styled.ActionButton>
            )}
          </Styled.ActionButtonRowWrapper>
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

export default observer(SummaryReport);
