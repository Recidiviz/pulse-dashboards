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

import { useEffect, useState } from "react";

import ConfirmBirthdate from "~@reentry/frontend/components/intake/ChatInterface/ConfirmBirthday";
import ConfirmBirthdateV2 from "~@reentry/frontend/components/intake/ChatInterface/ConfirmBirthdayV2";
import IntakeRouter from "~@reentry/frontend/components/intake/IntakeRouter";
import { IntakeRouterV2 } from "~@reentry/frontend/components/intake/IntakeRouterV2";
import { IS_V2_INTAKE_CHAT } from "~@reentry/frontend/featureFlags";
import { IntakeSocketProvider } from "~@reentry/frontend/websockets/IntakeSocketContext";
import { IntakeSocketProviderV2 } from "~@reentry/frontend/websockets/IntakeSocketContextV2";

export default function Intake() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [storedToken, setStoredToken] = useState<string | null>(null);
  useEffect(() => {
    const storedToken = sessionStorage.getItem("intake_token");

    if (storedToken) {
      setStoredToken(storedToken);
      setAuthorized(true);
      setLoading(false);
    } else {
      setAuthorized(false);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full border-t-green-900" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {IS_V2_INTAKE_CHAT ? (
          <ConfirmBirthdateV2 mode={"nonPseudoId"} />
        ) : (
          <ConfirmBirthdate mode={"nonPseudoId"} />
        )}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {IS_V2_INTAKE_CHAT ? (
        <IntakeSocketProviderV2 token_from_url={storedToken}>
          <IntakeRouterV2 />
        </IntakeSocketProviderV2>
      ) : (
        <IntakeSocketProvider token_from_url={storedToken}>
          <IntakeRouter />
        </IntakeSocketProvider>
      )}
    </div>
  );
}
