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

import SignalWifiConnectedNoInternet4Icon from "@mui/icons-material/SignalWifiConnectedNoInternet4";
import { Tooltip } from "@mui/material";
import { useState } from "react";

import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { BaseModal } from "~@reentry/frontend-shared";

interface LiveAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isOnline: boolean;
  isPaused?: boolean;
  isFileUpload?: boolean;
}

export default function LiveAssessmentModal({
  isOpen,
  onClose,
  onConfirm,
  isOnline,
  isPaused,
  isFileUpload = false,
}: LiveAssessmentModalProps) {
  const { state } = useAuth();
  const clientName = state?.user?.name;
  const [fullName, setFullName] = useState("");
  const [showError, setShowError] = useState(false);

  const isNameMatch =
    fullName.trim().toLowerCase() === clientName?.toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim() && isNameMatch) {
      onConfirm();
      setFullName("");
      setShowError(false);
    } else if (fullName.trim() && !isNameMatch) {
      setShowError(true);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    setShowError(false);
  };

  const getTooltipTitle = () => {
    if (!isOnline && !isPaused) {
      return "No internet connection. Please connect to the internet to start recording.";
    }
    if (!isOnline && isPaused) {
      return "Recording will continue locally and sync when you reconnect to the internet.";
    }
    return "";
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title={
        isFileUpload ? "Assessment has Started" : "Start Live Intake Assessment"
      }
      onClose={onClose}
    >
      <div className="text-[#2a5469]/90 text-sm sm:text-sm font-medium font-['Public_Sans'] space-y-4">
        {isFileUpload ? (
          <>
            <p>
              This session may require a live assessment. If you are not
              prepared, or this is not the correct file, click 'Cancel'. If you
              are ready, click 'Continue'.
            </p>
            <p>Enter your full name ({clientName}) to confirm:</p>
          </>
        ) : (
          <>
            <p>
              Before proceeding, please inform all parties present that this
              session is being recorded and transcribed by artificial
              intelligence to create a record of the discussion and help
              facilitate case management.
            </p>
            <p>
              Enter your full name ({clientName}) to confirm all parties were
              provided the above notice and have consented to the recording:
            </p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
        <label
          htmlFor="fullName"
          className="text-[#004d47] text-[13px] sm:text-[13px] font-medium font-['Public_Sans']"
        >
          Enter your full name to confirm consent
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={handleNameChange}
          placeholder={clientName}
          required
          className={`px-4 py-3 rounded-lg outline outline-1 ${
            showError ? "outline-red-500" : "outline-[#345262]/30"
          } text-[#2a5469]/90 text-[13px] sm:text-[13px] placeholder:text-[#2a5469]/50 font-medium font-['Public_Sans'] w-full`}
        />
        {showError && (
          <p className="text-red-600 text-xs font-medium mt-1">
            The name you entered does not match "{clientName}". Please enter the
            correct name to continue.
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <PrimaryButton buttonText="Cancel" onClick={onClose} />
          <Tooltip title={getTooltipTitle()}>
            <span className="flex-1">
              <button
                type="submit"
                disabled={!fullName.trim() || (!isOnline && !isPaused)}
                className={`w-full min-h-[32px] px-4 py-2 rounded-[32px] text-[13px] font-medium leading-tight transition-colors duration-300 flex items-center justify-center gap-2 ${
                  fullName.trim() && (isOnline || isPaused)
                    ? "bg-[#006c67] text-white hover:bg-[#005752]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <span className="truncate">
                  {isFileUpload ? "Continue" : "Confirm & Start Recording"}
                </span>
                {!isOnline && (
                  <SignalWifiConnectedNoInternet4Icon
                    className="text-red-600 flex-shrink-0"
                    style={{ fontSize: 16 }}
                  />
                )}
              </button>
            </span>
          </Tooltip>
        </div>
      </form>
    </BaseModal>
  );
}
