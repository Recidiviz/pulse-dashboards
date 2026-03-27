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

  const total = stats.total_feedback_records;

  const pct = (n: number) => (total > 0 ? ((n / total) * 100).toFixed(1) : "0");

  // Show original in parentheses only when it differs from override value
  const withOriginal = (value: number, original: number) =>
    value !== original ? `${value} (${original})` : `${value}`;

  const pctWithOriginal = (value: number, original: number) => {
    const pctVal = pct(value);
    const pctOrig = pct(original);
    return pctVal !== pctOrig ? `${pctVal}% (${pctOrig}%)` : `${pctVal}%`;
  };

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h2>Review Statistics</h2>
        <button className="refresh-btn" onClick={loadStats}>
          Refresh
        </button>
      </div>

      <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "0 0 1rem" }}>
        Empty reviews (from mark_reviewed script) are excluded. When overrides
        differ from originals, original values are shown in parentheses.
      </p>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Reviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.unique_intakes_labeled}</div>
          <div className="stat-label">Unique Intakes Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {pctWithOriginal(
              stats.records_with_severe_issues,
              stats.records_with_severe_issues_original,
            )}
          </div>
          <div className="stat-label">% with Severe Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {pctWithOriginal(
              stats.records_with_issues,
              stats.records_with_issues_original,
            )}
          </div>
          <div className="stat-label">% with Any Issue</div>
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
              {Object.entries(stats.by_component).map(([component, count]) => {
                const orig = stats.by_component_original[component] ?? count;
                return (
                  <tr key={component}>
                    <td style={{ textTransform: "capitalize" }}>{component}</td>
                    <td>{withOriginal(count, orig)}</td>
                    <td>{pctWithOriginal(count, orig)}</td>
                  </tr>
                );
              })}
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
              {Object.entries(stats.by_issue_type).map(([type, count]) => {
                const orig = stats.by_issue_type_original[type] ?? count;
                return (
                  <tr key={type}>
                    <td style={{ textTransform: "capitalize" }}>{type}</td>
                    <td>{withOriginal(count, orig)}</td>
                    <td>{pctWithOriginal(count, orig)}</td>
                  </tr>
                );
              })}
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
                ([severity, count]) => {
                  const orig =
                    stats.severity_distribution_original[severity] ?? count;
                  return (
                    <tr key={severity}>
                      <td>
                        <span className={`severity-indicator ${severity}`}>
                          {severity}
                        </span>
                      </td>
                      <td>{withOriginal(count, orig)}</td>
                    </tr>
                  );
                },
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
