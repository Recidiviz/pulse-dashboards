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

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { BadgeCheck } from "lucide-react";
import React from "react";

import { $api } from "~@reentry/frontend/api";
import BackButton from "~@reentry/frontend/components/base/BackButton";
import PrimaryButton from "~@reentry/frontend/components/buttons/PrimaryButton";
import ApproveTranscriptModal from "~@reentry/frontend/components/recording/modals/ApproveTranscriptModal";
import { useAuth } from "~@reentry/frontend/lib/auth";
import type { components } from "~@reentry/frontend/recidiviz-schema";
import { showSuccessToast } from "~@reentry/frontend/utils/toast";

interface NavRecordingPageProps {
  clientData: components["schemas"]["ClientRecordResponse"] | null;
  sessionData: components["schemas"]["RecordingSessionResponse"] | null;
  onRefreshNeeded?: () => void;
}

const NavRecordingPage = ({
  clientData,
  sessionData,
  onRefreshNeeded,
}: NavRecordingPageProps) => {
  const [approveTranscriptOpen, setApproveTranscriptOpen] =
    React.useState(false);
  const { getAccessToken } = useAuth();

  const { mutateAsync: submitAddressMutation } = $api.useMutation(
    "post",
    "/transcriptions/{client_pseudo_id}/complete-intake-transcription",
  );

  const handleApproveTranscript = async () => {
    try {
      const response = await submitAddressMutation({
        params: {
          path: {
            client_pseudo_id: clientData?.pseudonymized_client_id,
          },
        },
        body: {
          approved: true,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });

      if (response.intake_completed) {
        showSuccessToast(
          "Transcript approved successfully, action plan will be generated.",
        );
        onRefreshNeeded?.();
      }
    } catch (error) {
      console.error("Failed to approve transcript", error);
    }
  };

  return (
    <nav className="w-full h-[65px] px-6 bg-white border-b border-[#2b5469]/20 justify-between items-center inline-flex print:hidden">
      <div className="grow shrink basis-0 h-[65px] justify-between items-center flex">
        <div className="pr-6 justify-start items-center gap-4 flex">
          <BackButton />
        </div>
        <div className="pl-6 justify-start items-center gap-4 flex">
          {/*// Commented out for now, until implemented*/}
          {/*<PrimaryButton*/}
          {/*	buttonText="Export"*/}
          {/*	onClick={() => console.log("Export clicked")}*/}
          {/*/>*/}
          {/*<PrimaryButton*/}
          {/*	buttonText="Download"*/}
          {/*	onClick={() => console.log("Download clicked")}*/}
          {/*/>*/}

          {/* eslint-disable-next-line no-nested-ternary */}
          {sessionData?.status === "completed" ? (
            sessionData?.transcription_approved ? (
              <span className="flex items-center gap-1 text-white text-[13px] font-medium font-['Public_Sans'] bg-[#006c67] px-4 py-2 rounded-[32px]">
                Approved
                <BadgeCheck size={16} />
              </span>
            ) : (
              <PrimaryButton
                buttonText="Approve transcription"
                className="h-8 px-4 py-2 bg-[#006c67] rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
                onClick={() => {
                  setApproveTranscriptOpen(true);
                }}
              />
            )
          ) : (
            <PrimaryButton
              buttonText="Approve transcription"
              className="h-8 px-4 py-2 bg-[#006c67] rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
              disabled={true}
            />
          )}
        </div>
      </div>
      <ApproveTranscriptModal
        open={approveTranscriptOpen}
        onClose={() => setApproveTranscriptOpen(false)}
        onApprove={async () => {
          await handleApproveTranscript();
          setApproveTranscriptOpen(false);
        }}
      />
    </nav>
  );
};

export default NavRecordingPage;
