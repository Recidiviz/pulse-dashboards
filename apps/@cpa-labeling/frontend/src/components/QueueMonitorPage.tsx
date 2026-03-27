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

import { getEvaluatorQueue, getQueueStats } from "../api/client";
import type {
  AggregateWeeklySnapshot,
  QueueItem,
  QueueStatsResponse,
} from "../types";

function overdueColor(count: number): string {
  if (count === 0) return "#16a34a"; // green
  if (count <= 2) return "#d97706"; // yellow/amber
  return "#dc2626"; // red
}

function EvaluatorQueueDetail({ evaluator }: { evaluator: string }) {
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvaluatorQueue(evaluator)
      .then(setItems)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load queue"),
      )
      .finally(() => setLoading(false));
  }, [evaluator]);

  if (loading)
    return (
      <tr>
        <td colSpan={5} style={{ padding: "0.5rem 1rem", color: "#6b7280" }}>
          Loading...
        </td>
      </tr>
    );
  if (error)
    return (
      <tr>
        <td colSpan={5} style={{ padding: "0.5rem 1rem", color: "#dc2626" }}>
          {error}
        </td>
      </tr>
    );
  if (!items || items.length === 0)
    return (
      <tr>
        <td colSpan={5} style={{ padding: "0.5rem 1rem", color: "#6b7280" }}>
          Queue is empty.
        </td>
      </tr>
    );

  return (
    <tr>
      <td colSpan={5} style={{ padding: "0.5rem 1rem 1rem" }}>
        <table
          className="stats-table"
          style={{ width: "100%", fontSize: "0.85rem" }}
        >
          <thead>
            <tr>
              <th>Intake ID</th>
              <th>Completed</th>
              <th>Overdue</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.intake_id}>
                <td style={{ fontFamily: "monospace" }}>
                  {item.intake_id.slice(0, 8)}
                </td>
                <td>{item.completed_dt.replace("T", " ").replace("Z", "")}</td>
                <td>
                  {item.is_overdue ? (
                    <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                      Yes
                    </span>
                  ) : (
                    <span style={{ color: "#16a34a" }}>No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

function QueueMonitorPage() {
  const [data, setData] = useState<QueueStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvaluator, setExpandedEvaluator] = useState<string | null>(
    null,
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getQueueStats();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load queue stats",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="loading">Loading queue stats...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return null;

  const toggleEvaluator = (evaluator: string) => {
    setExpandedEvaluator((prev) => (prev === evaluator ? null : evaluator));
  };

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h2>Queue Monitor</h2>
        <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          As of {data.as_of}
        </span>
        <button className="refresh-btn" onClick={loadData}>
          Refresh
        </button>
      </div>

      <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "0 0 1rem" }}>
        Queue size = completed intakes not yet labeled by evaluator. Overdue =
        not labeled within 2 business days of intake completion. Click an
        evaluator to see their full queue.
      </p>

      {data.evaluators.length === 0 ? (
        <p>
          No evaluators configured. Set <code>LABELING_EVALUATORS</code> in the
          backend environment.
        </p>
      ) : (
        <table className="stats-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Evaluator</th>
              <th>Queue Size</th>
              <th>Overdue Now</th>
              <th>Overdue (Past 4 Weeks)</th>
              <th>Completed (Past 4 Weeks)</th>
            </tr>
          </thead>
          <tbody>
            {data.evaluators.map((ev) => (
              <>
                <tr
                  key={ev.evaluator}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleEvaluator(ev.evaluator)}
                >
                  <td>
                    <span
                      style={{
                        color: "#2563eb",
                        textDecoration: "underline",
                      }}
                    >
                      {expandedEvaluator === ev.evaluator ? "▾" : "▸"}{" "}
                      {ev.evaluator}
                    </span>
                  </td>
                  <td>{ev.queue_size}</td>
                  <td>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: overdueColor(ev.overdue_count),
                      }}
                    >
                      {ev.overdue_count}
                    </span>
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {ev.weekly_snapshots
                      .map((s) => s.overdue_count)
                      .join(" / ")}
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {ev.weekly_snapshots
                      .map((s) => s.completed_count)
                      .join(" / ")}
                  </td>
                </tr>
                {expandedEvaluator === ev.evaluator && (
                  <EvaluatorQueueDetail evaluator={ev.evaluator} />
                )}
              </>
            ))}
          </tbody>
        </table>
      )}

      {data.aggregate_snapshots.length > 0 && (
        <>
          <h3 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>
            Aggregate SLA (All Evaluators)
          </h3>
          <p
            style={{
              color: "#6b7280",
              fontSize: "0.85rem",
              margin: "0 0 1rem",
            }}
          >
            An intake is overdue if no evaluator submitted feedback within 2
            business days of completion. Eligible = intakes whose 2-day SLA
            deadline fell within the week.
          </p>
          <table className="stats-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Week Ending</th>
                <th>Completed</th>
                <th>Eligible</th>
                <th>Overdue</th>
                <th>Overdue %</th>
                <th>Max Days Overdue</th>
                <th>Avg Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              {data.aggregate_snapshots.map((s: AggregateWeeklySnapshot) => (
                <tr key={s.period_end}>
                  <td>{s.period_end}</td>
                  <td>{s.completed_count}</td>
                  <td>{s.eligible_count}</td>
                  <td>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: overdueColor(s.overdue_count),
                      }}
                    >
                      {s.overdue_count}
                    </span>
                  </td>
                  <td>
                    {s.eligible_count > 0
                      ? `${Math.round(s.overdue_rate * 100)}%`
                      : "—"}
                  </td>
                  <td>{s.max_days_overdue ?? "—"}</td>
                  <td>{s.avg_days_overdue ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default QueueMonitorPage;
