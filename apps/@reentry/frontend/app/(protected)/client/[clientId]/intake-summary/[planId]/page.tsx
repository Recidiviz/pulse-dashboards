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
import { useEffect, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import ProfileDetail from "~@reentry/frontend/components/action-plan/ProfileDetail";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { PageView } from "~@reentry/frontend/components/PageView";
import styles from "~@reentry/frontend/components/shared/styles/markdown.module.css";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { useIntakeSummaryPDF } from "~@reentry/frontend/hooks/usePDFDownload";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { AIDisclosure, AIDisclosureType } from "~@reentry/frontend-shared";

const IntakeSummaryPage = () => {
  const { planId, clientId } = useParams() as {
    planId: string;
    clientId: string;
  };
  const { getAccessToken } = useAuth();
  const { track } = useAnalytics();
  const router = useRouter();

  const [outputsDisabled, setOutputsDisabled] = useState(false);

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
      },
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

  const { data: planData } = $api.useQuery("get", "/plans/{id}", {
    params: { path: { id: planId } },
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
  });

  const { mutate: markSeen } = $api.useMutation("post", "/seen-items");

  useEffect(() => {
    if (intakeSummary && planData?.intake_id) {
      markSeen({
        body: {
          intake_id: planData.intake_id,
          item_type: "intake_summary",
          item_id: planId,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
    }
  }, [intakeSummary, planData?.intake_id]);

  useEffect(() => {
    if (errorIntakeSummary) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = errorIntakeSummary as any;
      if (
        error?.detail ===
        "Outputs are disabled for this assessment because they are under revision"
      ) {
        setOutputsDisabled(true);
      }
    }
  }, [errorIntakeSummary]);

  const givenNames = clientData?.full_name?.given_names || "";
  const surname = clientData?.full_name?.surname || "";
  const clientFullName =
    givenNames && surname
      ? `${givenNames} ${surname}`
      : givenNames || surname || "";

  const {
    handleDownload: downloadPDF,
    handlePrint: printPDF,
    isDownloading,
  } = useIntakeSummaryPDF(planId, `${clientFullName}_intake_summary.pdf`);

  const handleDownload = async () => {
    track("intake_summary_downloaded", { justiceInvolvedPersonId: clientId });
    await downloadPDF();
  };

  const handlePrint = async () => {
    track("intake_summary_printed", { justiceInvolvedPersonId: clientId });
    await printPDF();
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
                {assessmentConfig?.outputs_action_plan_activated && (
                  <PrimaryButton
                    buttonText="View Action Plan"
                    onClick={() => {
                      router.push(`/action-plan/${planId}`);
                    }}
                    ignoreCapabilities={true}
                  />
                )}

                <PrimaryButton
                  buttonText="Print"
                  onClick={handlePrint}
                  ignoreCapabilities={true}
                />
                <PrimaryButton
                  buttonText={isDownloading ? "Downloading..." : "Download"}
                  onClick={handleDownload}
                  disabled={isDownloading}
                  ignoreCapabilities={true}
                />
              </div>
              <div className="w-full h-full justify-start items-start inline-flex">
                {errorIntakeSummary && (
                  <div className="flex flex-col items-center space-y-4 w-full h-full justify-center">
                    <div className="text-lg text-[#003331] font-medium">
                      {outputsDisabled
                        ? "Outputs are disabled for this assessment because they are under revision"
                        : "An error occurred, unable to load the intake summary"}
                    </div>
                  </div>
                )}
                {!errorIntakeSummary && intakeSummary && (
                  <div className="max-w-[800px]">
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
