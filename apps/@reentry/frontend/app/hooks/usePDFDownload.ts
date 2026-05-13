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

import {
  ResourceSection,
  ResourceWithMeta,
} from "~@reentry/frontend/hooks/resourceBank.types";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { sortResourcesDigitalFirst } from "~@reentry/frontend/utils/resourceSort";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

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

function usePDFDownload(endpoint: string, filename: string, body?: object) {
  const { getAccessToken, refreshToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchBlob = async (): Promise<Blob> => {
    let token = getAccessToken();
    if (!token) {
      await refreshToken();
      token = getAccessToken();
    }
    if (!token) throw new Error("Authentication required");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    const requestOptions: RequestInit = { method: "GET", headers };
    if (body) {
      requestOptions.method = "POST";
      headers["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, requestOptions);
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

type ResourceCategory = components["schemas"]["ResourceCategory"];

const CHIP_COLORS: Record<ResourceCategory, { bg: string; text: string }> = {
  Housing: { bg: "#e0f2f1", text: "#003331" },
  Employment: { bg: "#e8f5e9", text: "#2f855a" },
  "Basic Needs": { bg: "#dbeafe", text: "#1d4ed8" },
  "Mental Health": { bg: "#fff3e0", text: "#f08c00" },
  "Substance Use": { bg: "#fff3e0", text: "#f08c00" },
  "Physical Health": { bg: "#fff3e0", text: "#f08c00" },
  "Legal Aid & Rights Restoration": { bg: "#ede9fe", text: "#5b21b6" },
  "Education & Vocational Training": { bg: "#e3f2fd", text: "#285386" },
  "Family Reconnection & Parenting": { bg: "#ffe4e6", text: "#9f1239" },
  "Peer Support & Community Integration": { bg: "#fef9c3", text: "#713f12" },
};
const DEFAULT_CHIP = { bg: "#f1f5f9", text: "#4a5568" };

function isResourceCategory(category: string): category is ResourceCategory {
  return category in CHIP_COLORS;
}

function toResourceForPDF(resource: ResourceWithMeta) {
  const chip = isResourceCategory(resource.category)
    ? CHIP_COLORS[resource.category]
    : DEFAULT_CHIP;
  return {
    name: resource.name,
    address: resource.address ?? null,
    phone: resource.phone ?? null,
    website: resource.website ?? null,
    description: resource.blurb ?? null,
    subcategory: resource.subcategory ?? null,
    travel_distance_miles: resource.travel_distance_miles ?? null,
    is_digital: resource.resource_type === "DIGITAL",
    chip_bg: chip.bg,
    chip_text: chip.text,
  };
}

function toSectionForPDF(section: ResourceSection) {
  return {
    title: section.title,
    resources: sortResourcesDigitalFirst(section.resources).map(
      toResourceForPDF,
    ),
  };
}

export function useActionPlanPDF(
  planId: string,
  filename: string,
  allResources?: ResourceSection[],
) {
  const body = allResources
    ? { resource_sections: allResources.map(toSectionForPDF) }
    : undefined;
  return usePDFDownload(`/api/plans/${planId}/action-plan-pdf`, filename, body);
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
