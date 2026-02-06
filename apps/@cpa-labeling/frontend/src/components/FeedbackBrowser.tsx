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

import { useEffect, useState } from "react";

import { getAllFeedback } from "../api/client";
import type { FeedbackListItem } from "../types";

interface FeedbackBrowserProps {
  onSelectFeedback: (feedbackItem: FeedbackListItem) => void;
}

function FeedbackBrowser({ onSelectFeedback }: FeedbackBrowserProps) {
  const [items, setItems] = useState<FeedbackListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [showOnlyIssues, setShowOnlyIssues] = useState(true);
  const [evaluatorFilter, setEvaluatorFilter] = useState("");

  const loadFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllFeedback(page, 20, {
        has_issues: showOnlyIssues ? true : undefined,
        evaluator: evaluatorFilter || undefined,
      });
      setItems(response.items);
      setTotalPages(response.pages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [page, showOnlyIssues, evaluatorFilter]);

  const severityColor = (severity: string) => {
    switch (severity) {
      case "severe":
        return "#dc2626";
      case "med":
        return "#f97316";
      case "low":
        return "#fbbf24";
      default:
        return "#9ca3af";
    }
  };

  return (
    <div className="feedback-browser">
      <div className="feedback-browser-header">
        <h2>Feedback Browser</h2>
        <div className="feedback-filters">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showOnlyIssues}
              onChange={(e) => {
                setShowOnlyIssues(e.target.checked);
                setPage(1);
              }}
            />
            Show only records with issues
          </label>
          <input
            type="text"
            placeholder="Filter by evaluator..."
            value={evaluatorFilter}
            onChange={(e) => {
              setEvaluatorFilter(e.target.value);
              setPage(1);
            }}
            className="evaluator-filter-input"
          />
        </div>
        <div className="feedback-total">{total} records</div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && <div className="loading">Loading feedback...</div>}
      {!loading && items.length === 0 && (
        <div className="empty-content">No feedback records found.</div>
      )}
      {!loading && items.length > 0 && (
        <>
          <table className="record-table">
            <thead>
              <tr>
                <th>Intake ID</th>
                <th>Evaluator</th>
                <th>Date</th>
                <th>Highest Severity</th>
                <th>Components with Issues</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} onClick={() => onSelectFeedback(item)}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                    {item.intake_id.slice(0, 8)}...
                  </td>
                  <td>{item.evaluator}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>
                    <span
                      className="severity-indicator"
                      style={{
                        background: severityColor(item.highest_severity),
                        color: "white",
                        padding: "0.125rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {item.highest_severity}
                    </span>
                  </td>
                  <td>
                    {item.components_with_issues.length > 0
                      ? item.components_with_issues.join(", ")
                      : "-"}
                  </td>
                  <td
                    style={{
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.overall_notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="nav-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="record-counter">
                Page {page} of {totalPages}
              </span>
              <button
                className="nav-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FeedbackBrowser;
