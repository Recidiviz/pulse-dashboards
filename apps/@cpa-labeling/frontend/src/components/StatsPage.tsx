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

import { getStats } from "../api/client";
import type { LabelingStats } from "../types";

function StatsPage() {
  const [stats, setStats] = useState<LabelingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) return <div className="loading">Loading stats...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!stats) return null;

  const pctAnyIssue =
    stats.total_feedback_records > 0
      ? (
          (stats.records_with_issues / stats.total_feedback_records) *
          100
        ).toFixed(1)
      : "0";
  const pctSevere =
    stats.total_feedback_records > 0
      ? (
          (stats.records_with_severe_issues / stats.total_feedback_records) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h2>Review Statistics</h2>
        <button className="refresh-btn" onClick={loadStats}>
          Refresh
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.total_feedback_records}</div>
          <div className="stat-label">Total Reviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.unique_intakes_labeled}</div>
          <div className="stat-label">Unique Intakes Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pctSevere}%</div>
          <div className="stat-label">% of Plans with Severe Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pctAnyIssue}%</div>
          <div className="stat-label">% of Plans with Any Issue</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-section">
          <h3>Issues by Component</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Reviews with Issues</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.by_component).map(([component, count]) => (
                <tr key={component}>
                  <td style={{ textTransform: "capitalize" }}>{component}</td>
                  <td>{count}</td>
                  <td>
                    {stats.total_feedback_records > 0
                      ? ((count / stats.total_feedback_records) * 100).toFixed(
                          1,
                        )
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="stats-section">
          <h3>Issues by Type</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Reviews with Issues</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.by_issue_type).map(([type, count]) => (
                <tr key={type}>
                  <td style={{ textTransform: "capitalize" }}>{type}</td>
                  <td>{count}</td>
                  <td>
                    {stats.total_feedback_records > 0
                      ? ((count / stats.total_feedback_records) * 100).toFixed(
                          1,
                        )
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="stats-section">
          <h3>Severity Distribution</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.severity_distribution).map(
                ([severity, count]) => (
                  <tr key={severity}>
                    <td>
                      <span className={`severity-indicator ${severity}`}>
                        {severity}
                      </span>
                    </td>
                    <td>{count}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <div className="stats-section">
          <h3>Reviews by Evaluator</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Evaluator</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.by_evaluator).map(([evaluator, count]) => (
                <tr key={evaluator}>
                  <td>{evaluator}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StatsPage;
