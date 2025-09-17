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

import { useParams } from "next/navigation";
import type React from "react";
import {useEffect, useState} from "react";

import NavRecordingPage from "~@reentry/frontend/(protected)/clients/audio-recording/[id]/[sessionId]/NavRecordingPage";
import TranscriptionAdressForm from "~@reentry/frontend/(protected)/clients/audio-recording/[id]/[sessionId]/TranscriptionAddressForm";
import TranscriptionSection from "~@reentry/frontend/(protected)/clients/audio-recording/[id]/[sessionId]/TranscriptionSection";
import UserSummary from "~@reentry/frontend/(protected)/clients/audio-recording/[id]/[sessionId]/UserSummary";
import { $api } from "~@reentry/frontend/api";
import RecordingInterface from "~@reentry/frontend/components/recording/RecordingInterface";
import { QueueProvider } from "~@reentry/frontend/contexts/QueueContext";
import { useAuth } from "~@reentry/frontend/lib/auth";

const AudioRecordingPage: React.FC = () => {
  const { id, sessionId } = useParams() as { id: string; sessionId: string };
  const { getAccessToken } = useAuth();
  const [isPollingEnabled, setIsPollingEnabled] = useState(false);
  const [needsAddress, setNeedsAddress] = useState(false);

  console.log(`polling enabled: ${isPollingEnabled}`);
  // Fetch client data (same pattern as intake page)
  const {
    data: clientData,
    isLoading: clientLoading,
    error: clientError,
  } = $api.useQuery("get", "/clients/{client_pseudo_id}", {
    params: { path: { client_pseudo_id: id } },
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
  });

  const {
    data: sessionData,
    isLoading: sessionLoading,
    refetch: refetchSession,
    error: sessionError,
  } = $api.useQuery("get", "/recordings/sessions/{session_id}", {
    params: { path: { session_id: sessionId } },
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
  });

  const { data: intakeData, refetch: refetchIntakeData } = $api.useQuery(
    "get",
    "/intake/admin/{client_pseudo_id}",
    {
      params: {
        path: { client_pseudo_id: id },
      },
      headers: {
        Authorization: `Bearer ${useAuth().getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
  );

  useEffect(() => {
    // check if the recordingsession is completed and intake needs address
    if (sessionData?.status === "completed" && intakeData && !intakeData.address) {
      setNeedsAddress(true);
    }else{
      setNeedsAddress(false);
    }
  }, [intakeData, sessionData]);


  if (clientLoading || sessionLoading) {
    return (
      <div className="w-full p-14 flex-col justify-start items-center gap-2 inline-flex bg-[#f9fafa] h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-t-[#006B66] border-[#e0f2f1] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const handleAddressFormClose = () => {
    setNeedsAddress(false);
    refetchSession();
    refetchIntakeData();
  };

  if (clientError || sessionError || !clientData) {
    return (
      <div className="w-full p-14 flex-col justify-start items-center gap-2 inline-flex bg-[#f9fafa] h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">
            {/* eslint-disable-next-line no-nested-ternary */}
            {clientError
              ? "Failed to load client data"
              : sessionError
                ? "Failed to load recording session"
                : "Client not found"}
          </p>
        </div>
      </div>
    );
  }
  if (needsAddress) {
    return (
      <TranscriptionAdressForm
        clientData={clientData}
        setNeedsAddress={handleAddressFormClose}
        onError={(error) => {
          console.error("Address submission error:", error);
          // Could add toast notification here
        }}
      />
    );
  }

  return (
    <QueueProvider getAccessToken={getAccessToken}>
      <NavRecordingPage />
      <div className="min-h-[calc(100vh-65px)] self-stretch p-10 bg-[#f9fafa] flex flex-col items-start gap-5">
        <UserSummary
          clientData={clientData}
          sessionData={sessionData || null}
        />
        <TranscriptionSection
          sessionData={sessionData || null}
          onRefreshNeeded={() => refetchSession()}
        />
        <RecordingInterface
          clientRecord={clientData}
          sessionData={sessionData || null}
          onRecordingStopped={() => setIsPollingEnabled(true)}
          setNeedsAddress={setNeedsAddress}
        />
      </div>
    </QueueProvider>
  );
};

export default AudioRecordingPage;
