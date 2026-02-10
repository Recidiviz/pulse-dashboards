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

export interface AuditLogEntry {
  id: string;
  action: string;
  performed_by_email: string;
  created_at: string;
  details?: Record<string, unknown>;
}

interface AuditLogProps {
  entries: AuditLogEntry[];
  isLoading?: boolean;
}

const formatAction = (action: string): string => {
  const actionLabels: Record<string, string> = {
    created: "Created",
    updated: "Updated",
    published: "Published",
    activated: "Activated",
    deactivated: "Deactivated",
    archived: "Archived",
    imported: "Imported",
    exported: "Exported",
  };
  return actionLabels[action] || action;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const AuditLog = ({ entries, isLoading }: AuditLogProps) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No history available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        // Extract message (change note) from details
        const message = entry.details?.["message"] as string | undefined;
        // Filter out message from other details to display separately
        const otherDetails = entry.details
          ? Object.fromEntries(
              Object.entries(entry.details).filter(([key]) => key !== "message")
            )
          : {};

        return (
          <div
            key={entry.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
          >
            {/* Timeline dot */}
            <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900">
                  {formatAction(entry.action)}
                </span>
                <span className="text-gray-500 text-sm">by</span>
                <span className="text-gray-700 text-sm truncate">
                  {entry.performed_by_email}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatDate(entry.created_at)}
              </div>
              {/* Change Note - displayed prominently */}
              {message && (
                <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-700 italic">&ldquo;{message}&rdquo;</p>
                </div>
              )}
              {/* Other details - displayed smaller */}
              {Object.keys(otherDetails).length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {Object.entries(otherDetails).map(([key, value]) => (
                    <span key={key} className="mr-3">
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AuditLog;
