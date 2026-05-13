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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import DownloadConfirmModal from "~@reentry/frontend/components/action-plan/DownloadConfirmModal";
import LastPrompt from "~@reentry/frontend/components/action-plan/LastPrompt";
import ActionPlanViewer from "~@reentry/frontend/components/ActionPlanViewer";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { useActionPlanPDF } from "~@reentry/frontend/hooks/usePDFDownload";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

interface PlannerProps {
  markDownText: string;
  planPrompt: string;
  clientFullName: string;
  clientPseudoId: string;
  planId: string;
  refetchDetailPlan: () => void;
  handleSelectResource: (resourceName: string) => void;
  showRegenerationNotify?: boolean;
}

const Planner = ({
  markDownText,
  planPrompt,
  clientFullName,
  clientPseudoId,
  planId,
  refetchDetailPlan,
  handleSelectResource,
  showRegenerationNotify,
}: PlannerProps) => {
  const { track } = useAnalytics();
  const { getAccessToken } = useAuth();
  const [markDownPlan, setMarkdownPlan] = useState<string>(markDownText);
  const [update, setUpdate] = useState(false);
  const [internalMarkdown, setInternalMarkdown] = useState<string>("");
  const [showLastPrompt, setShowLastPrompt] = useState(
    showRegenerationNotify && !!planPrompt,
  );
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const {
    handleDownload: downloadPDF,
    handlePrint: printPDF,
    isDownloading,
  } = useActionPlanPDF(planId, `${clientFullName}_action_plan.pdf`);

  const handleDownload = async () => {
    track("action_plan_downloaded", {
      justiceInvolvedPersonId: clientPseudoId,
      planId,
    });
    await downloadPDF();
  };

  const handlePrint = async () => {
    track("action_plan_printed", {
      justiceInvolvedPersonId: clientPseudoId,
      planId,
    });
    await printPDF();
  };

  const router = useRouter();

  useEffect(() => {
    setMarkdownPlan(markDownText);
  }, [markDownText]);

  const { mutateAsync: generatePlanMutation /*, isError: generatePlanError*/ } =
    $api.useMutation("post", "/plans/{id}/edit");

  const { mutateAsync: setNotifyMutation } = $api.useMutation(
    "post",
    "/plans/{id}/set-notify",
  );

  const postprocessMarkdown = (markdown: string) => {
    // Replace <readonlylink href="https://somewhere.com">some text</readonlylink> with a markdown link [https://somewhere.com](https://somewhere.com)
    return markdown.replaceAll(
      /<readonlylink\s+[^>]*href=(["'])([^"']+)\1[^>]*>([\s\S]*?)<\/readonlylink>/gi,
      (_, _quote, href, text) => `[${text.trim()}](${href})`,
    );
  };

  const saveEdit = async () => {
    try {
      track("action_plan_edited", {
        justiceInvolvedPersonId: clientPseudoId,
        planId: planId,
      });
      const processedMarkdown = postprocessMarkdown(internalMarkdown);
      await generatePlanMutation({
        params: {
          path: {
            id: planId as string,
          },
        },
        body: {
          markdown: processedMarkdown,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      refetchDetailPlan();
      showSuccessToast("Action plan updated successfully");
      setMarkdownPlan(processedMarkdown);
      setUpdate(false);
    } catch {
      showErrorToast("Failed to update action plan");
    }
  };

  const cancelEdit = () => {
    const processedMarkdown = postprocessMarkdown(markDownPlan);
    setInternalMarkdown(processedMarkdown);
    setUpdate(false);
  };

  useEffect(() => {
    setShowLastPrompt(showRegenerationNotify && !!planPrompt);
  }, [showRegenerationNotify, planPrompt]);

  const handleDismissPrompt = async () => {
    try {
      await setNotifyMutation({
        params: {
          path: {
            id: planId as string,
          },
        },
        body: {
          notify: false,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      refetchDetailPlan();
      setShowLastPrompt(false);
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
      showErrorToast("Failed to dismiss notification");
    }
  };

  return (
    <div className="w-full md:w-[75%] grow shrink basis-0 self-stretch px-6 md:px-14 py-8 bg-white flex-col justify-start items-center gap-2 inline-flex overflow-y-auto actionPlanSide">
      <DownloadConfirmModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onConfirm={() => {
          setShowDownloadModal(false);
          handleDownload();
        }}
        isDownloading={isDownloading}
      />
      <div className="mx-auto w-full md:max-w-[800px] h-full flex-col justify-start items-center gap-8 flex">
        <div className="w-full grow shrink basis-0 flex-col justify-start md:items-center gap-8 flex">
          <div className="w-full justify-end items-center gap-2 inline-flex print:hidden">
            {update ? (
              <>
                <PrimaryButton buttonText="Save" onClick={saveEdit} />
                <PrimaryButton buttonText="Cancel" onClick={cancelEdit} />
              </>
            ) : (
              <>
                <PrimaryButton
                  className={"!w-[180px] !text-[10px] md:!text-[13px] "}
                  buttonText="View Intake Summary"
                  onClick={() =>
                    router.push(
                      `/client/${clientPseudoId}/intake-summary/${planId}`,
                    )
                  }
                  ignoreCapabilities={true}
                />
                <PrimaryButton
                  buttonText="Edit"
                  onClick={() => setUpdate(!update)}
                />
                <PrimaryButton
                  buttonText="Print"
                  onClick={handlePrint}
                  ignoreCapabilities={true}
                />
                <PrimaryButton
                  buttonText={isDownloading ? "Downloading..." : "Download"}
                  onClick={() => setShowDownloadModal(true)}
                  disabled={isDownloading}
                  ignoreCapabilities={true}
                />
              </>
            )}
          </div>
          {showLastPrompt && (
            <LastPrompt
              planPrompt={planPrompt}
              onDismiss={handleDismissPrompt}
            />
          )}
          <div className="max-w-[800px]">
            <div className="w-full flex-col justify-start items-center gap-3 flex">
              <div className="w-full text-[#2a5469]/90 text-sm font-medium leading-[16.80px]">
                Action plan
              </div>
              <div className="w-full text-[#003331] text-3xl font-medium">
                {clientFullName}
              </div>
            </div>
            <ActionPlanViewer
              markDownPlan={markDownPlan}
              update={update}
              internalMarkdown={internalMarkdown}
              setInternalMarkdown={setInternalMarkdown}
              handleSelectResource={handleSelectResource}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planner;
