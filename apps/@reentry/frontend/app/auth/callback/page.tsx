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

import { useAuth } from "~@reentry/frontend/lib/auth";

export default function AuthCallback() {
  const { authStore, state } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState("Processing authentication...");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!authStore) {
      setStatus("Initializing authentication...");
      return;
    }

    if (state.error) {
      setError(state.error);
      setStatus(`Authentication error: ${state.error.message}`);
      return;
    }

    const handleCallback = async () => {
      try {
        setStatus("Verifying authentication...");
        //const urlParams = new URLSearchParams(window.location.search);

        const isAuthenticated = await authStore.checkForAuthentication();

        if (isAuthenticated) {
          setStatus("Authentication successful! Redirecting...");

          // Get saved redirect path or default to homepage
          const redirectPath = sessionStorage.getItem("auth_redirect") || "/";
          sessionStorage.removeItem("auth_redirect");

          // Wait a moment before redirecting
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 1000);
        } else {
          setStatus("Authentication failed. Please try again.");
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      } catch (err) {
        console.error("Detailed error:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setStatus(
          `Authentication error: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    };

    handleCallback();
  }, [authStore, router, state.error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-6 rounded shadow-md max-w-md w-full">
        <h1 className="text-xl font-bold mb-4">Authentication</h1>
        <p className="mb-4">{status}</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error:</p>
            <p>{error.message}</p>
          </div>
        )}

        <button
          type={"button"}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => router.push("/")}
        >
          Return to home
        </button>
      </div>
    </div>
  );
}
