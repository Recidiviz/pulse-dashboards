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

const AuthErrorState = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="bg-white p-6 rounded shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="mb-6">
          We encountered an issue with your account permissions. Please try
          refreshing the page or contact{" "}
          <a
            href="mailto:feedback@recidiviz.org"
            className="text-blue-500 hover:underline"
          >
            feedback@recidiviz.org
          </a>{" "}
          if the problem persists.
        </p>
      </div>
    </div>
  );
};

export default AuthErrorState;
