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

import { BACKEND_URL } from "~@reentry/frontend/constants";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

import {
  ACTION_PLAN_BINARY_EVALUATORS,
  ACTION_PLAN_SCORE_EVALUATORS,
} from "../constants/actionPlanEvalLabels";
import { configHeaders } from "../utils/configFetch";

interface EvalExecution {
  status: string;
  progress: number;
  message?: string;
}

interface EvalScore {
  score: number;
  explanation?: string;
}

interface IntakeEvalResult {
  intake_id: string;
  error?: string;
  addressed_to_client?: EvalScore;
  clarity?: EvalScore;
  actionable?: EvalScore;
  structure?: EvalScore;
  tone?: EvalScore;
  timeline?: EvalScore;
  no_judgments?: EvalScore;
  citations_source_is_transcript?: EvalScore;
  citations_text_verified?: EvalScore;
}

interface EvalSummary {
  n: number;
  n_successful: number;
  addressed_to_client_mean: number | null;
  clarity_mean: number | null;
  actionable_mean: number | null;
  structure_mean: number | null;
  tone_mean: number | null;
  timeline_mean: number | null;
  no_judgments_mean: number | null;
  citations_source_is_transcript_pass_rate: number | null;
  citations_text_verified_pass_rate: number | null;
}

interface EvalResult {
  id: string;
  created_at: string;
  ran_at?: string;
  created_by_email?: string;
  metrics?: {
    summary?: EvalSummary;
    intakes?: IntakeEvalResult[];
  };
  execution?: EvalExecution;
}

const SCORE_LABELS = ACTION_PLAN_SCORE_EVALUATORS as {
  key: keyof IntakeEvalResult;
  label: string;
  abbr: string;
}[];
const BINARY_LABELS = ACTION_PLAN_BINARY_EVALUATORS as {
  key: keyof IntakeEvalResult;
  label: string;
  abbr: string;
}[];

const ScoreBadge = ({
  label,
  value,
  pass,
}: {
  label: string;
  value: string;
  pass: boolean;
}) => (
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      pass ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
    }`}
  >
    {label}: {value}
  </span>
);

const SummaryStats = ({ summary }: { summary: EvalSummary }) => (
  <div className="flex flex-wrap gap-3 mb-4">
    <div className="text-xs text-gray-500">
      {summary.n_successful}/{summary.n} intakes evaluated
    </div>
    {SCORE_LABELS.map(({ key, label }) => {
      const mean = summary[`${key}_mean` as keyof EvalSummary] as number | null;
      if (mean === null || mean === undefined) return null;
      const display = mean.toFixed(1);
      return (
        <ScoreBadge
          key={key}
          label={`${label} avg ${display}/10`}
          value={parseFloat(display) >= 7 ? "Good" : "Low"}
          pass={parseFloat(display) >= 7}
        />
      );
    })}
    {BINARY_LABELS.map(({ key, label }) => {
      const rate = summary[`${key}_pass_rate` as keyof EvalSummary] as
        | number
        | null;
      if (rate === null || rate === undefined) return null;
      const pct = Math.round(rate * 100);
      return (
        <ScoreBadge
          key={key}
          label={label}
          value={`${pct}% pass`}
          pass={pct >= 80}
        />
      );
    })}
  </div>
);

const IntakeRow = ({
  result,
  expanded,
  onToggle,
}: {
  result: IntakeEvalResult;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const shortId = result.intake_id.slice(0, 8);

  if (result.error) {
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
        <span className="text-xs text-gray-500 font-mono">{shortId}…</span>
        <span className="text-xs text-red-600">{result.error}</span>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs text-gray-500 font-mono">{shortId}…</span>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {SCORE_LABELS.map(({ key, abbr }) => {
            const entry = result[key] as EvalScore | undefined;
            if (!entry) return null;
            return (
              <ScoreBadge
                key={key}
                label={abbr}
                value={`${entry.score}/10`}
                pass={entry.score >= 7}
              />
            );
          })}
          {BINARY_LABELS.map(({ key, abbr }) => {
            const entry = result[key] as EvalScore | undefined;
            if (!entry) return null;
            return (
              <ScoreBadge
                key={key}
                label={abbr}
                value={entry.score === 1 ? "Pass" : "Fail"}
                pass={entry.score === 1}
              />
            );
          })}
          <button
            onClick={onToggle}
            className="text-xs text-blue-600 hover:underline"
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="pb-3 flex flex-col gap-2">
          {[...SCORE_LABELS, ...BINARY_LABELS].map(({ key, label }) => {
            const entry = result[key] as EvalScore | undefined;
            if (!entry) return null;
            const isBinary = BINARY_LABELS.some((b) => b.key === key);
            let scoreDisplay: string;
            if (isBinary) {
              scoreDisplay = entry.score === 1 ? "Pass" : "Fail";
            } else {
              scoreDisplay = `${entry.score}/10`;
            }
            return (
              <div key={key}>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  {label} ({scoreDisplay})
                </p>
                {entry.explanation && (
                  <p className="text-xs text-gray-600">{entry.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EvalResultCard = ({
  result,
  isLatest,
}: {
  result: EvalResult;
  isLatest?: boolean;
}) => {
  const [expandedIntakeId, setExpandedIntakeId] = useState<string | null>(null);

  const { metrics, execution } = result;
  const isPending =
    !metrics &&
    execution &&
    execution.status !== "completed" &&
    execution.status !== "failed";
  const isFailed = !metrics && execution?.status === "failed";

  const ranAt = result.ran_at
    ? new Date(`${result.ran_at}Z`).toLocaleString()
    : new Date(`${result.created_at}Z`).toLocaleString();

  return (
    <div
      className={`border rounded-lg p-3 text-sm ${isLatest ? "border-gray-300" : "border-gray-200"}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isPending && (
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-medium">
              {execution?.message ?? "Running…"}{" "}
              {execution?.progress ? `(${execution.progress}%)` : ""}
            </span>
          )}
          {isFailed && (
            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium">
              Failed
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{ranAt}</span>
      </div>

      {metrics?.summary && <SummaryStats summary={metrics.summary} />}

      {metrics?.intakes && metrics.intakes.length > 0 && (
        <details>
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 mb-1">
            Per-intake breakdown ({metrics.intakes.length})
          </summary>
          <div className="mt-2">
            {metrics.intakes.map((r) => (
              <IntakeRow
                key={r.intake_id}
                result={r}
                expanded={expandedIntakeId === r.intake_id}
                onToggle={() =>
                  setExpandedIntakeId(
                    expandedIntakeId === r.intake_id ? null : r.intake_id,
                  )
                }
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

interface ActionPlanEvalResultsPanelProps {
  configId: string;
  refetchKey: number;
}

export const ActionPlanEvalResultsPanel = ({
  configId,
  refetchKey,
}: ActionPlanEvalResultsPanelProps) => {
  const auth = useAuth();
  const [results, setResults] = useState<EvalResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const token = await auth.getAccessToken();
        const response = await fetch(
          `${BACKEND_URL}/config-management/outputs/${configId}/action-plan-eval`,
          { headers: configHeaders(token) },
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        } else {
          setFetchError("Failed to load eval results");
        }
      } catch {
        setFetchError("Failed to load eval results");
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [configId, refetchKey, auth]);

  if (isLoading) {
    return (
      <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Action Plan Eval Results
        </h2>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Action Plan Eval Results
        </h2>
        <p className="text-sm text-red-600">{fetchError}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Action Plan Eval Results
        </h2>
        <p className="text-sm text-gray-500">
          No eval results yet. Click &quot;Run Eval&quot; to evaluate this
          config.
        </p>
      </div>
    );
  }

  const latest = results[0];
  const prior = results.slice(1);

  return (
    <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
      <h2 className="text-sm font-medium text-gray-700 mb-4">
        Action Plan Eval Results
      </h2>

      <EvalResultCard result={latest} isLatest />

      {prior.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            {prior.length} prior run{prior.length > 1 ? "s" : ""}
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {prior.map((r) => (
              <EvalResultCard key={r.id} result={r} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
