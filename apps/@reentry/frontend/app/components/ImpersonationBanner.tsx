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

import { useEffect, useState } from "react";

export default function ImpersonationBanner() {
  const [impersonatedEmail, setImpersonatedEmail] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setImpersonatedEmail(localStorage.getItem("impersonated_email"));
  }, []);

  if (!impersonatedEmail) return null;

  function handleStop() {
    localStorage.removeItem("impersonated_email");
    localStorage.removeItem("impersonation_data");
    window.location.reload();
  }

  return (
    <div
      className="w-full bg-violet-100 text-violet-800 text-xs font-medium py-1 text-center border-b border-violet-300
        sticky top-0 z-[9999] shadow-sm flex items-center justify-center gap-2"
    >
      <span>Impersonating: {impersonatedEmail}</span>
      <button
        onClick={handleStop}
        className="bg-red-600 text-white px-2 py-0.5 rounded text-xs hover:bg-red-700"
      >
        Stop
      </button>
    </div>
  );
}
