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

import type React from "react";

import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LoginButton({ className, children }: LoginButtonProps) {
  const { state, login, logout } = useAuth();

  if (state.isLoading) {
    return (
      <button
        type={"button"}
        className={`bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed ${className}`}
        disabled
      >
        Loading...
      </button>
    );
  }

  if (state.isAuthorized) {
    return (
      <button
        type={"button"}
        className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition ${className}`}
        onClick={() => logout()}
      >
        {children || "Sign Out"}
      </button>
    );
  }

  return (
    <button
      type={"button"}
      className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition ${className}`}
      onClick={() => login()}
    >
      {children || "Sign In"}
    </button>
  );
}
