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

import { useRef, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

export default function ImpersonationForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useAuth();

  const isImpersonating =
    typeof window !== "undefined" &&
    !!localStorage.getItem("impersonated_email");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { mutateAsync, isPending } = ($api as any).useMutation(
    "get",
    "/impersonate/impersonate",
  );

  async function handleSubmit() {
    const email = inputRef.current?.value?.trim().toLowerCase();
    if (!email) {
      setError("Must enter an email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);

    try {
      const data = await mutateAsync({
        params: { query: { email } },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      localStorage.setItem("impersonated_email", email);
      localStorage.setItem("impersonation_data", JSON.stringify(data));
      window.location.reload();
    } catch (e) {
      const detail = (e as { detail?: string })?.detail;
      setError(
        detail || (e instanceof Error ? e.message : "Impersonation failed"),
      );
    }
  }

  function handleStop() {
    localStorage.removeItem("impersonated_email");
    localStorage.removeItem("impersonation_data");
    window.location.reload();
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold mb-3">Impersonate User</h3>
      <p className="text-sm text-gray-500 mb-3">
        Enter an email address to view the app as that user.
      </p>
      <div className="flex gap-2 items-start">
        <input
          ref={inputRef}
          disabled={isImpersonating}
          type="email"
          placeholder="Enter an email to impersonate..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={() => setError(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <PrimaryButton
          buttonText={isPending ? "Loading..." : "Impersonate"}
          onClick={handleSubmit}
          className="px-4 py-2 bg-[#003331] text-white text-sm font-medium rounded-full hover:bg-gray-950 transition-colors whitespace-nowrap"
          ignoreCapabilities={true}
          disabled={isPending || isImpersonating}
        />
        {isImpersonating && (
          <PrimaryButton
            buttonText={"Stop Impersonating"}
            className="h-10 sm:h-8 px-3 sm:px-4 py-2 bg-red-600 rounded-[32px] text-white text-xs sm:text-[13px] font-medium font-['Public_Sans'] whitespace-nowrap"
            onClick={handleStop}
            ignoreCapabilities={true}
          />
        )}
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
