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

import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

const UnauthorizedState = () => {
  const { login } = useAuth();

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="bg-white p-6 rounded shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
        <p className="mb-6">Please sign in to access this page</p>

        <button
          type={"button"}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition"
          onClick={() => login()}
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedState;
