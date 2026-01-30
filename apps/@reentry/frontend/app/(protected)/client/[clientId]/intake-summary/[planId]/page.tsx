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

"use client";

import Markdown from "markdown-to-jsx";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import ProfileDetail from "~@reentry/frontend/components/action-plan/ProfileDetail";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { PageView } from "~@reentry/frontend/components/PageView";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {
  createPDFPageStyles,
  extractCompleteCSS,
} from "~@reentry/frontend/utils/pdfGenerator";
import {
  AI_DISCLOSURE_PRINT_TEXT,
  AIDisclosure,
  AIDisclosureType,
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";

import styles from "./markdown.module.css";

const IntakeSummaryPage = () => {
  const { planId, clientId } = useParams() as { planId: string, clientId: string};
  const { getAccessToken, refreshToken } = useAuth();
  const { track } = useAnalytics();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);

  const { data: clientData } = $api.useQuery(
      "get",
      "/clients/{client_pseudo_id}",
      {
          params: {
              path: { client_pseudo_id: clientId },
          },
          headers: {
              Authorization: `Bearer ${useAuth().getAccessToken()}`,
              "Content-Type": "application/json",
          },
      },
  );

  const { data: intakeSummary, error: errorIntakeSummary } = $api.useQuery(
    "get",
    "/plans/{id}/assets/by-filename/{filename}",
    {
      params: {
        path: {
          id: planId,
          filename: "summary.md",
        },
        query: {
          include_data: true,
        },
      },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      }
    },
  );

    const { data: assessmentConfig } = $api.useQuery(
        "get",
        "/assessment-configs/outputs/{plan_id}",
        {
            params: {
                path: {
                    plan_id: planId,
                },
            },
            headers: {
                Authorization: `Bearer ${getAccessToken()}`,
                "Content-Type": "application/json",
            },
        },
    );

  const givenNames = clientData?.full_name?.given_names || "";
  const surname = clientData?.full_name?.surname || "";
  const clientFullName =
    givenNames && surname
      ? `${givenNames} ${surname}`
      : givenNames || surname || "";


  function convertButtonsToSpansPreserveText(
    containerElement: HTMLElement | Document = document,
  ): string[] {
    const customLinkButtons =
      containerElement.querySelectorAll("button.custom-link");
    const customLinkButtonsHtmlContent: string[] = [];
    customLinkButtons.forEach((button) => {
      customLinkButtonsHtmlContent.push(button.innerHTML);
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

    return customLinkButtonsHtmlContent;
  }

  const generatePDFBlob = async (
    addAiDisclosure = false,
  ): Promise<Blob | null> => {
    const element = document.getElementById("contentToDownload");
    if (!element) {
      return null;
    }

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

    const aiDisclosureHTML = addAiDisclosure
      ? `<div style="background-color: #F3F4F6; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">
           <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
             ${AI_DISCLOSURE_PRINT_TEXT}
           </p>
         </div>`
      : "";

    const intakeSummaryData = {
      html: aiDisclosureHTML + element.innerHTML,
      css: [pdfCSS],
      options: {
        printBackground: true,
      } as Record<string, unknown>,
    };

    let accessToken = getAccessToken();
    if (!accessToken) {
      await refreshToken();
      accessToken = getAccessToken();
    }
    if (!accessToken) {
      return null;
    }

    try {
      const response = await fetch(
        `${process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8000"}/api/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(intakeSummaryData),
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
  };

  const handlePrint = async () => {
    track("intake_summary_printed", { justiceInvolvedPersonId: clientId });

    try {
      const pdfBlob = await generatePDFBlob(true);

      if (!pdfBlob) {
        showErrorToast("Failed to generate PDF for printing");
        return;
      }

      const blobUrl = URL.createObjectURL(pdfBlob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        setTimeout(() => {
          iframe.remove();
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      };
    } catch (error) {
      console.error("Failed to print:", error);
      showErrorToast("Failed to print intake summary");
    }
  };

  const handleDownload = async (): Promise<void> => {
    track("intake_summary_downloaded", { justiceInvolvedPersonId: clientId });
    setIsDownloading(true);

    try {
      const pdfBlob = await generatePDFBlob();

      if (!pdfBlob) {
        showErrorToast("Failed to generate PDF");
        setIsDownloading(false);
        return;
      }

      const fileName = `${clientFullName}_intake_summary.pdf`;
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
    }

    setIsDownloading(false);
  };

  return (
    <>
      <PageView />
      <div
        className={
          "bg-white w-full screen:h-[calc(100vh-65px)] flex flex-col md:flex-row"
        }
      >
        <div className="w-full md:w-[25%] h-auto self-stretch bg-white  flex-col justify-start items-center gap-2 inline-flex print:hidden">
          <div className="self-stretch h-full flex-col justify-between items-start flex">
            <ProfileDetail
              clientRecord={clientData}
              isExpanded={undefined}
              setIsExpanded={() => console.log("expanded")}
            />
            <div className="w-full mt-auto mb-[20px]">
              <AIDisclosure type={AIDisclosureType.Sidebar} />
            </div>
          </div>
        </div>
        <div className="w-full md:w-[75%] h-full grow shrink basis-0 self-stretch px-6 md:px-14 py-8 bg-white flex-col justify-start items-center gap-2 inline-flex overflow-y-auto  border-l border-[#2b5469]/20">
          <div className="mx-auto w-full max-w-[800px] h-full flex-col justify-start items-center gap-8 flex">
            <div className="w-full grow shrink basis-0 flex-col justify-start items-center gap-8 flex">
              <div className="w-full justify-end items-center gap-2 inline-flex print:hidden">
                  { assessmentConfig?.outputs_action_plan_activated && (
                      <PrimaryButton
                          buttonText="View Action Plan"
                          onClick={() => {
                              router.push(`/action-plan/${planId}`);
                          }}
                          ignoreCapabilities={true}
                      />
                  ) }

                <PrimaryButton buttonText="Print" onClick={handlePrint} ignoreCapabilities={true} />
                <PrimaryButton
                  buttonText={isDownloading ? "Downloading..." : "Download"}
                  onClick={handleDownload}
                  disabled={isDownloading}
                  ignoreCapabilities={true}
                />
              </div>
              <div className="w-full h-full justify-start items-start inline-flex">
                {(errorIntakeSummary) && (
                  <div className="flex flex-col items-center space-y-4 w-full h-full justify-center">
                    <div className="text-lg text-[#003331] font-medium">
                      {errorIntakeSummary && (
                        <div>
                          An error occurred, unable to load the intake summary
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {intakeSummary && (
                  <div
                    ref={contentRef}
                    id={"contentToDownload"}
                    className="max-w-[800px]"
                  >
                    <div className="w-full flex-col justify-start items-center gap-3 flex">
                      <div className="w-full text-[#2a5469]/90 text-sm font-medium leading-[16.80px]">
                        Intake Summary
                      </div>
                      <div className="w-full text-[#003331] text-3xl font-medium">
                        {clientFullName}
                      </div>
                    </div>
                    <Markdown className={`${styles["markdown"]} my-4`}>
                      {intakeSummary?.data || ""}
                    </Markdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IntakeSummaryPage;
