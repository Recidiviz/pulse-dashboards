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

import type { RecordListItem } from "../types";

/**
 * Calculate due date as 2 business days after the completed date.
 * Business days exclude Saturday and Sunday.
 */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    // Skip weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * Check if a date is past due (before today).
 */
function isPastDue(dueDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

interface RecordListProps {
  records: RecordListItem[];
  totalUnreviewed: number;
  loading: boolean;
  onSelectRecord: (index: number) => void;
  onRefresh: () => void;
}

function RecordList({
  records,
  totalUnreviewed,
  loading,
  onSelectRecord,
  onRefresh,
}: RecordListProps) {
  if (loading) {
    return <div className="loading">Loading records...</div>;
  }

  return (
    <div className="record-list">
      <div className="record-list-header">
        <h2>Unreviewed Intakes ({totalUnreviewed})</h2>
        <button className="refresh-btn" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">No unreviewed intakes found</div>
      ) : (
        <table className="record-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Intake ID</th>
              <th>Client</th>
              <th>Completed</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const completedDate = record.intake_completed_at
                ? new Date(record.intake_completed_at)
                : null;
              const dueDate = completedDate
                ? addBusinessDays(completedDate, 2)
                : null;
              const pastDue = dueDate ? isPastDue(dueDate) : false;

              return (
                <tr
                  key={record.intake_id}
                  onClick={() => onSelectRecord(index)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && onSelectRecord(index)
                  }
                  tabIndex={0}
                  role="button"
                >
                  <td>{index + 1}</td>
                  <td>{record.intake_id.slice(0, 8)}...</td>
                  <td>{record.client_pseudo_id || "N/A"}</td>
                  <td>
                    {completedDate ? completedDate.toLocaleDateString() : "N/A"}
                  </td>
                  <td className={pastDue ? "past-due" : ""}>
                    {dueDate ? dueDate.toLocaleDateString() : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RecordList;
