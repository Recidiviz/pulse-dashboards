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
import { ProtectedRoute } from "~@reentry/frontend/lib/auth/routeGuards";

export default function Profile() {
  const { state } = useAuth();

  return (
    <ProtectedRoute requireVerifiedEmail={false}>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

        {state.user && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                {state.user.picture ? (
                  <img
                    src={state.user.picture}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">
                    {state.user.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{state.user.name}</h2>
                <p className="text-gray-600">{state.user.email}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded overflow-x-auto">
                    {state.user.sub}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm">
                    {state.user.updated_at
                      ? new Date(state.user.updated_at).toLocaleString()
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
