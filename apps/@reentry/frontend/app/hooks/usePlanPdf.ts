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

import { type RefObject, useState } from "react";

import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {
  createPDFPageStyles,
  extractCompleteCSS,
} from "~@reentry/frontend/utils/pdfGenerator";
import {
  AI_DISCLOSURE_PRINT_TEXT,
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";

function convertButtonsToSpansPreserveText(
  containerElement: HTMLElement,
): void {
  const customLinkButtons =
    containerElement.querySelectorAll("button.custom-link");
  customLinkButtons.forEach((button) => {
    const originalText = button.textContent;
    const span = document.createElement("span");

    for (const attr of button.attributes) {
      span.setAttribute(attr.name, attr.value);
    }

    span.textContent = originalText;

    if (button.parentNode) {
      button.parentNode.replaceChild(span, button);
    }
  });
}

async function generatePDFBlob(
  element: HTMLElement,
  accessToken: string,
): Promise<Blob | null> {
  convertButtonsToSpansPreserveText(element);

  const extractedCSSResult = extractCompleteCSS(element, {
    includeChildren: true,
    includeMediaQueries: true,
    includeAnimations: true,
  });

  const pdfCSS = `
    ${extractedCSSResult.combined}
    ${createPDFPageStyles(AI_DISCLOSURE_PRINT_TEXT)}
  `;

  const actionPlan = {
    html: element.innerHTML,
    css: [pdfCSS],
    options: {
      printBackground: true,
    } as Record<string, unknown>,
  };

  try {
    const response = await fetch(
      `${process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8000"}/api/generate-pdf`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(actionPlan),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}

export function usePlanPdf(
  contentRef: RefObject<HTMLElement | null>,
  fileName = "action_plan.pdf",
): { generatePdf: () => Promise<void>; isGenerating: boolean } {
  const { getAccessToken, refreshToken } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = async () => {
    const element = contentRef.current;
    if (!element) return;

    setIsGenerating(true);

    try {
      let accessToken = getAccessToken();
      if (!accessToken) {
        await refreshToken();
        accessToken = getAccessToken();
      }
      if (!accessToken) {
        showErrorToast("Authentication required to generate PDF");
        return;
      }

      const pdfBlob = await generatePDFBlob(element, accessToken);

      if (!pdfBlob) {
        showErrorToast("Failed to generate PDF");
        return;
      }

      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      showSuccessToast("PDF downloaded successfully");
    } catch {
      showErrorToast("Failed to download PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePdf, isGenerating };
}
