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

"use client";

import { useState } from "react";

import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8000";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.src = url;
  document.body.appendChild(iframe);
  // Use a fixed delay rather than onload: PDF iframes don't reliably fire
  // onload in all browsers, which would leave the object URL permanently leaked.
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  }, 500);
}

function usePDFDownload(endpoint: string, filename: string) {
  const { getAccessToken, refreshToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchBlob = async (): Promise<Blob> => {
    let token = getAccessToken();
    if (!token) {
      await refreshToken();
      token = getAccessToken();
    }
    if (!token) throw new Error("Authentication required");

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("PDF generation failed");
    return response.blob();
  };

  const handleDownload = async (): Promise<void> => {
    setIsDownloading(true);
    try {
      const blob = await fetchBlob();
      downloadBlob(blob, filename);
      showSuccessToast("PDF downloaded successfully");
    } catch {
      showErrorToast("Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async (): Promise<void> => {
    try {
      const blob = await fetchBlob();
      printBlob(blob);
    } catch {
      showErrorToast("Failed to print PDF");
    }
  };

  return { handleDownload, handlePrint, isDownloading };
}

export function useActionPlanPDF(planId: string, filename: string) {
  return usePDFDownload(`/api/plans/${planId}/action-plan-pdf`, filename);
}

export function useIntakeSummaryPDF(planId: string, filename: string) {
  return usePDFDownload(`/api/plans/${planId}/intake-summary-pdf`, filename);
}

export function useChatHistoryPDF(intakeId: string, filename: string) {
  return usePDFDownload(
    `/api/intake/admin/${intakeId}/chat-history-pdf`,
    filename,
  );
}
