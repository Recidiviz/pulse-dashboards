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
import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import { $api } from "~@reentry/frontend/api";
import ProfileDetail from "~@reentry/frontend/components/action-plan/ProfileDetail";
import PrimaryButton from "~@reentry/frontend/components/buttons/PrimaryButton";
import { useExecutionPolling } from "~@reentry/frontend/hooks/useExecutionPolling";
import { useAuth } from "~@reentry/frontend/lib/auth";
import { extractCompleteCSS, generatePDF } from "~@reentry/frontend/utils/pdfGenerator";
import {
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend/utils/toast";

import styles from "./markdown.module.css";

const IntakeSummaryPage = () => {
  const { id } = useParams();
  const { getAccessToken } = useAuth();
  const { isPolling, progress, startPolling } = useExecutionPolling({
    interval: 4000,
  });
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    pageStyle: `
      @page {
        margin: 20mm;
      }
      @media print {
        body {
          padding: 20px;
        }
      }
    `
  });

  const {
    data: dataPlan,
    refetch: refetchPlan,
    error: errorPlan,
  } = $api.useQuery("get", "/plans/by_client/{client_pseudo_id}", {
    params: {
      path: {
        client_pseudo_id: id as string,
      },
    },
    headers: {
      Authorization: `Bearer ${useAuth().getAccessToken()}`,
      "Content-Type": "application/json",
    },
  });

  const { data: intakeSummary, error: errorIntakeSummary } = $api.useQuery(
    "get",
    "/plans/{id}/assets/by_filename/{filename}",
    {
      params: {
        path: {
          id: dataPlan?.id as string,
          filename: "summary.md",
        },
        query: {
          include_data: true,
        },
      },
      headers: {
        Authorization: `Bearer ${useAuth().getAccessToken()}`,
        "Content-Type": "application/json",
      },
      enabled: !!dataPlan?.id,
    },
  );

  useEffect(() => {
    if (
      dataPlan?.create_status === "in_progress" ||
      dataPlan?.create_status === "pending"
    ) {
      startPolling(dataPlan.create_execution_id as string);
    }
  }, [dataPlan, refetchPlan, startPolling]);

  const givenNames = dataPlan?.client_record?.full_name?.given_names || "";
  const surname = dataPlan?.client_record?.full_name?.surname || "";
  const clientFullName =
    givenNames && surname
      ? `${givenNames} ${surname}`
      : givenNames || surname || "";

  useEffect(() => {
    if (!isPolling && progress === 100) {
      refetchPlan();
    }
  }, [isPolling, progress, refetchPlan]);

  function convertButtonsToSpansPreserveText(containerElement: HTMLElement | Document = document): string[] {
    const customLinkButtons = containerElement.querySelectorAll('button.custom-link');
    const customLinkButtonsHtmlContent: string[] = [];
    customLinkButtons.forEach((button) => {
      customLinkButtonsHtmlContent.push(button.innerHTML);
      const originalText = button.textContent;
      const span = document.createElement('span');
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

  const handleDownload = async (): Promise<void> => {
    setIsDownloading(true);
    const accessToken = getAccessToken();
    const element = document.getElementById("contentToDownload");
    if (!element) {
      setIsDownloading(false);
      return;
    }
    if(!accessToken) {
      setIsDownloading(false);
      return;
    }
    convertButtonsToSpansPreserveText(element);
    const extractedCSSResult = extractCompleteCSS(element, {
      includeChildren: true,
      includeMediaQueries: true,
      includeAnimations: true
    });
    const pdfCSS = `
      ${extractedCSSResult.combined}
      @media print {
      .markdown_annotations__PyRaq, .markdown_notes__84h8O { display: none; }
      .markdown_markdown__MnjCI > * { break-inside: avoid !important; }
      .markdown_markdown__MnjCI button { border-bottom: none !important; }
      .markdown_markdown__MnjCI img { display: none; }
      }
    `;

    const intakeSummaryData = {
      html: element.innerHTML,
      css: [pdfCSS],
      options: {} as Record<string, never>,
    }
    const fileName = `${clientFullName}_intake_summary.pdf`;
    await generatePDF(
      intakeSummaryData,
      fileName,
      accessToken,
      () => {
        showSuccessToast("PDF downloaded successfully");
      },
      (error) => {
        showErrorToast(error);
      }
    );

    setIsDownloading(false);
  };

  return (
    <div className={"bg-white w-full screen:h-[calc(100vh-65px)] flex flex-col md:flex-row"}>
      <div className="w-full md:w-[25%] h-auto self-stretch bg-white  flex-col justify-start items-center gap-2 inline-flex print:hidden">
        <div className="self-stretch h-full flex-col justify-start items-start flex">
          <ProfileDetail clientRecord={dataPlan?.client_record} isExpanded={undefined} setIsExpanded={()=> console.log("expanded")} />
        </div>
      </div>
      <div className="w-full md:w-[75%] h-full grow shrink basis-0 self-stretch px-6 md:px-14 py-8 bg-white flex-col justify-start items-center gap-2 inline-flex overflow-y-auto  border-l border-[#2b5469]/20">
        <div className="mx-auto w-full max-w-[800px] h-full flex-col justify-start items-center gap-8 flex">
          <div className="w-full grow shrink basis-0 flex-col justify-start items-center gap-8 flex">
            <div className="w-full justify-end items-center gap-2 inline-flex print:hidden">
              <PrimaryButton
                buttonText="View Action Plan"
                onClick={() => router.push(`/action-plan/${id}`)}
              />
              <PrimaryButton buttonText="Print" onClick={reactToPrintFn} />
              <PrimaryButton
                buttonText={isDownloading ? "Downloading..." : "Download"}
                onClick={handleDownload}
                disabled={isDownloading}
              />
            </div>
            <div className="w-full h-full justify-start items-start inline-flex">
              {(errorPlan || errorIntakeSummary) && (
                <div className="flex flex-col items-center space-y-4 w-full h-full justify-center">
                  <div className="text-lg text-[#003331] font-medium">
                    {errorPlan && (
                      <div>An error occurred, unable to load the plan</div>
                    )}
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
  );
};

export default IntakeSummaryPage;
