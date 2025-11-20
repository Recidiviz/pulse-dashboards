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

import {
  ConfirmBirthdatePage,
  IntakeRouter,
  IntakeSocketProvider,
} from "~@reentry/frontend-shared";

export default function Intake({
  params,
}: {
  params: { pseudonymized_id: string };
}) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const pseudonymized_id = params.pseudonymized_id;

  useEffect(() => {
    const storedToken = sessionStorage.getItem("intake_token");

    if (storedToken) {
      setAuthorized(true);
      setLoading(false);
    } else {
      setAuthorized(false);
      setLoading(false);
    }
  }, [params?.pseudonymized_id]);

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
        <ConfirmBirthdatePage
          pseudonymized_id={pseudonymized_id}
          mode={"pseudoDob"}
          onConfirmation={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <IntakeSocketProvider token_from_url={pseudonymized_id}>
        <IntakeRouter />
      </IntakeSocketProvider>
    </div>
  );
}
