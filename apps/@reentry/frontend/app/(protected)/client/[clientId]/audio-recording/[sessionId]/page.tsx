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
import { useCallback, useEffect, useMemo, useState } from "react";

import NavRecordingPage from "~@reentry/frontend/(protected)/client/[clientId]/audio-recording/[sessionId]/NavRecordingPage";
import TranscriptionAdressForm from "~@reentry/frontend/(protected)/client/[clientId]/audio-recording/[sessionId]/TranscriptionAddressForm";
import TranscriptionSection from "~@reentry/frontend/(protected)/client/[clientId]/audio-recording/[sessionId]/TranscriptionSection";
import UserSummary from "~@reentry/frontend/(protected)/client/[clientId]/audio-recording/[sessionId]/UserSummary";
import { $api } from "~@reentry/frontend/api";
import { PageView } from "~@reentry/frontend/components/PageView";
import RecordingInterface from "~@reentry/frontend/components/recording/RecordingInterface";
import { QueueProvider } from "~@reentry/frontend/contexts/QueueContext";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

const AudioRecordingPage: React.FC = () => {
  const { clientId, sessionId } = useParams() as { clientId: string; sessionId: string };
  const { getAccessToken } = useAuth();
  const [needsAddress, setNeedsAddress] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<string>("created");
  const [safeNavigate, setSafeNavigate] = useState<
    ((path: string) => void) | null
  >(null);
  // Form state for address form
  const [addressInput, setAddressInput] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  // Get access token once per render
  const accessToken = getAccessToken();

  // Fetch client data (same pattern as intake page)
  const {
    data: clientData,
    isLoading: clientLoading,
    error: clientError,
    refetch: refetchClient
  } = $api.useQuery("get", "/clients/{client_pseudo_id}", {
    params: { path: { client_pseudo_id: clientId } },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    refetchOnWindowFocus: false
  });

  const {
    data: sessionData,
    isLoading: sessionLoading,
    refetch: refetchSession,
    error: sessionError,
  } = $api.useQuery("get", "/recordings/sessions/{session_id}", {
    params: { path: { session_id: sessionId } },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    refetchOnWindowFocus: false
  });
  

  const {
    data: address,
    error: addressError,
    isLoading: addressLoading
  } = $api.useQuery("get", "/intake/admin/{intake_id}/address", {
    params: { path: { intake_id: sessionData?.intake_id as string} },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    refetchOnWindowFocus: false
  });

  // Compute whether address is needed based on session status and address data
  const shouldShowAddressForm = useMemo(() => {
    // Don't show form while still loading
    if (addressLoading) {
      return false;
    }

    // If address query returned 404 or no address ID, consider address as not existing
    const addressExists = address?.id && !addressError;

    // Show form if session is processing/completed and no address exists
    const isProcessingOrCompleted = ["processing", "completed"].includes(`${sessionData?.status}`);
    return isProcessingOrCompleted && !addressExists;
  }, [sessionData?.status, address, addressError, addressLoading]);

  useEffect(() => {
    setNeedsAddress(shouldShowAddressForm);
  }, [shouldShowAddressForm]);

  const handleClientError = useCallback(async () => {
    if (clientError || sessionError) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // needed for getting microphone permission.
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error("Error stopping permission stream tracks:", error);
      }
    }
  }, [clientError, sessionError]);

  useEffect(() => {
    // Refetch session data when component mounts to get the latest status
    handleClientError();
  }, [clientError, sessionError]);

  const handleAddressFormClose = async() => {
    await refetchSession();
    await refetchClient();
    // Wait 2 seconds before closing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setNeedsAddress(false);
    // Reset form fields
    setAddressInput("");
    setCity("");
    setState("");
  };

  if (clientData && needsAddress) {
    return (
      <TranscriptionAdressForm
        clientData={clientData}
        setNeedsAddress={handleAddressFormClose}
        onError={(error) => {
          console.error("Address submission error:", error);
          // Could add toast notification here
        }}
        intakeId={sessionData?.intake_id}
        addressInput={addressInput}
        setAddressInput={setAddressInput}
        city={city}
        setCity={setCity}
        state={state}
        setState={setState}
      />
    );
  }

  if (clientLoading || sessionLoading || addressLoading) {
    return (
      <div className="w-full p-14 flex-col justify-start items-center gap-2 inline-flex bg-[#f9fafa] h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-t-[#006B66] border-[#e0f2f1] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (clientError || sessionError || !clientData) {
    return (
      <div className="w-full p-14 flex-col justify-start items-center gap-2 inline-flex bg-[#f9fafa] h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">
            {/* eslint-disable-next-line no-nested-ternary */}
            {clientError
              ? `Failed to load client data ${clientError.detail}`
              : sessionError
                ? `Failed to load recording session data ${sessionError.detail}`
                : "Client not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageView />
      <QueueProvider>
        <NavRecordingPage client_pseudo_id={clientData?.pseudonymized_client_id} safeNavigate={safeNavigate}/>
        <div className="min-h-[calc(100vh-65px)] self-stretch px-4 md:p-10 bg-[#f9fafa] flex flex-col items-start gap-5">
          <UserSummary
            clientData={clientData}
            sessionData={sessionData || null}
          />
          <TranscriptionSection
            sessionDataId={sessionData?.id || null}
            onRefreshNeeded={() => refetchSession()}
            recordingStatus={recordingStatus}
            sessionStatus={sessionData?.status}
          />
          <RecordingInterface
            clientRecord={clientData}
            sessionData={sessionData || null}
            setNeedsAddress={setNeedsAddress}
            onRecordingStatusChange={setRecordingStatus}
            onSafeNavigateReady={(navigate) => setSafeNavigate(() => navigate)}
          />
        </div>
      </QueueProvider>
    </>
  );
};

export default AudioRecordingPage;
