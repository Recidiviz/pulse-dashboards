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
import { useCallback, useEffect, useState } from "react";

import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import StatusIndicators from "~@reentry/frontend/components/recording/StatusIndicators";
import { BaseModal } from "~@reentry/frontend-shared";

interface EndAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isOnline: boolean;
  cannotConnectToServer?: boolean;
  isRecording?: boolean;
  onPause?: () => void;
  uploadDuration?: number;
  recordDuration?: number;
}

export default function EndAssessmentModal({
  isOpen,
  onClose,
  onConfirm,
  isOnline,
  cannotConnectToServer = false,
  isRecording = false,
  uploadDuration = 0,
  recordDuration = 0,
  onPause,
}: EndAssessmentModalProps) {
  const [isStopping, setIsStopping] = useState(false);
  const [countdown, setCountdown] = useState(6);
  const [hasToEnd, setHasToEnd] = useState(false);

  useEffect(() => {
    if (hasToEnd && uploadDuration >= recordDuration) {
      onConfirm();
    }
  }, [hasToEnd, uploadDuration, recordDuration, onConfirm]);
  useEffect(() => {
    if (!isStopping) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onPause?.();
          setHasToEnd(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStopping]);

  useEffect(() => {
    if (!isOpen) {
      setIsStopping(false);
      console.log("Resetting countdown" + countdown);
      setCountdown(6);
    }
  }, [isOpen]);

  const handleEndAssessment = useCallback(() => {
    setIsStopping(true);
  }, []);

  const handleNoOp = () => {
    // Intentionally empty - prevents modal close during stopping
  };

  const getTitle = () => {
    if (isStopping) {
      return "Stopping assessment...";
    }
    if (cannotConnectToServer) {
      return "Cannot end assessment - Cannot connect to server";
    }
    if (!isOnline) {
      return "Cannot end assessment - No internet connection";
    }
    return "Are you sure you want to end the assessment?";
  };

  const renderContent = () => {
    if (isStopping) {
      return (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <p className="text-[#2a5469]/90 text-base sm:text-lg font-semibold font-['Public_Sans'] leading-normal text-center">
              Ending and Syncing audio...
            </p>
            <StatusIndicators
              isOnline={isOnline}
              cannotConnectToServer={cannotConnectToServer}
              uploadDuration={uploadDuration}
              recordDuration={recordDuration}
            />
          </div>
        </>
      );
    }

    if (cannotConnectToServer) {
      return (
        <>
          <div className="flex items-start gap-2 mb-4">
            <SignalWifiConnectedNoInternet4Icon
              className="text-orange-500 flex-shrink-0 mt-0.5"
              style={{ fontSize: 24 }}
            />
            <p className="text-[#2a5469]/90 text-sm font-medium font-['Public_Sans'] leading-[16.80px]">
              Cannot connect to the server. You cannot end the assessment until
              the connection is restored.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <PrimaryButton buttonText="Close" onClick={onClose} />
            {isRecording && onPause && (
              <PrimaryButton
                buttonText="Pause Recording"
                className="flex-1 min-h-[32px] px-4 py-2 bg-gray-600 rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
                onClick={() => {
                  onPause();
                  onClose();
                }}
              />
            )}
          </div>
        </>
      );
    }

    if (!isOnline) {
      return (
        <>
          <div className="flex items-start gap-2 mb-4">
            <SignalWifiConnectedNoInternet4Icon
              className="text-red-600 flex-shrink-0 mt-0.5"
              style={{ fontSize: 24 }}
            />
            <p className="text-[#2a5469]/90 text-sm font-medium font-['Public_Sans'] leading-[16.80px]">
              You are currently offline. You cannot end the assessment without
              an internet connection.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <PrimaryButton buttonText="Close" onClick={onClose} />
            {isRecording && onPause && (
              <PrimaryButton
                buttonText="Pause Recording"
                className="flex-1 min-h-[32px] px-4 py-2 bg-gray-600 rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
                onClick={() => {
                  onPause();
                  onClose();
                }}
              />
            )}
          </div>
        </>
      );
    }

    return (
      <>
        <p className="text-[#2a5469]/90 text-sm font-medium font-['Public_Sans'] leading-[16.80px]">
          If you end the assessment now, you will not be able to start it again.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <PrimaryButton buttonText="Continue Assessment" onClick={onClose} />
          <PrimaryButton
            buttonText={isStopping ? `Stopping...` : "Yes, End Assessment"}
            disabled={isStopping}
            className="flex-1 min-h-[32px] px-4 py-2 bg-[#006c67] rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
            onClick={handleEndAssessment}
          />
        </div>
      </>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title={getTitle()}
      onClose={isStopping ? handleNoOp : onClose}
    >
      {renderContent()}
    </BaseModal>
  );
}
