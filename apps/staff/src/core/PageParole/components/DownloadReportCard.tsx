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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { useState } from "react";
import toast from "react-hot-toast";
import styled from "styled-components";

import { Button, Icon, IconSVG, palette } from "~design-system";

import { SectionCard } from "../../SectionCard";
import { downloadParoleReportZip } from "../downloadParoleReport";
import { PAROLE_REPORT_CAPTURE_ID } from "./shared";

export const DOWNLOAD_REPORT_TITLE = "Download PHI Report and SDMF worksheet";
export const DOWNLOAD_REPORT_SUBTITLE =
  "Clicking “Download” will generate a PDF report.";
export const DOWNLOAD_REPORT_BUTTON_LABEL = "Download Report";
export const DOWNLOAD_REPORT_GENERATING_LABEL = "Generating…";
export const DOWNLOAD_REPORT_ERROR_MESSAGE =
  "Something went wrong while generating the report. Please try again.";

const Card = styled(SectionCard)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
`;

const Title = styled.div`
  ${typography.Sans18}
  font-weight: 600;
  color: ${palette.pine1};
`;

const Subtitle = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin-top: ${rem(spacing.xs)};
`;

const ButtonContent = styled.span`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
`;

/**
 * Action card that downloads a zipped PDF report of the case profile. The
 * report content is captured from the on-screen container identified by
 * `PAROLE_REPORT_CAPTURE_ID`.
 */
export function DownloadReportCard({ docId }: { docId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    const reportElement = document.getElementById(PAROLE_REPORT_CAPTURE_ID);
    if (!reportElement) return;

    setIsGenerating(true);
    try {
      await downloadParoleReportZip({
        reportElement,
        folderName: `Parole_Report_${docId}`,
      });
    } catch {
      // downloadParoleReportZip already reports the error to Sentry; surface a
      // notice so the user knows the download did not succeed.
      toast.error(DOWNLOAD_REPORT_ERROR_MESSAGE);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <div>
        <Title>{DOWNLOAD_REPORT_TITLE}</Title>
        <Subtitle>{DOWNLOAD_REPORT_SUBTITLE}</Subtitle>
      </div>
      <Button onClick={handleDownload} disabled={isGenerating}>
        <ButtonContent>
          <Icon kind={IconSVG.Download} width={16} aria-hidden="true" />
          {isGenerating
            ? DOWNLOAD_REPORT_GENERATING_LABEL
            : DOWNLOAD_REPORT_BUTTON_LABEL}
        </ButtonContent>
      </Button>
    </Card>
  );
}
