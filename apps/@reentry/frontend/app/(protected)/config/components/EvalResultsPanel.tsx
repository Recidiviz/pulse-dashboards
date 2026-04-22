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

import { configHeaders } from "../utils/configFetch";

interface EvalExecution {
  status: string;
  progress: number;
  message?: string;
}

interface IntakeEvalResult {
  intake_id: string;
  error?: string;
  grounding?: {
    score: number;
    explanation?: string;
    correct_facts?: { fact: string; explanation: string }[];
    interpretive_additions?: { fact: string; explanation: string }[];
    hallucinated_facts?: { fact: string; explanation: string }[];
  };
  coverage?: {
    score: number;
    explanation?: string;
    missing_details?: string[];
  };
}

interface EvalSummary {
  n: number;
  n_successful: number;
  coverage_pass_threshold?: number;
  grounding_pass_rate: number | null;
  coverage_mean: number | null;
  coverage_pass_rate: number | null;
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

const FACT_LIST_COLORS: Record<string, string> = {
  red: "text-red-700",
  yellow: "text-yellow-700",
  green: "text-green-700",
};

const FactList = ({
  title,
  items,
  color,
}: {
  title: string;
  items: { fact: string; explanation: string }[];
  color: "red" | "yellow" | "green";
}) => (
  <div className="mb-2">
    <p className={`text-xs font-medium mb-1 ${FACT_LIST_COLORS[color]}`}>
      {title}
    </p>
    <ul className="list-disc list-inside space-y-0.5">
      {items.map((item, i) => (
        <li key={i} className="text-xs text-gray-600">
          <span className="font-medium">{item.fact}</span>
          {item.explanation ? ` — ${item.explanation}` : ""}
        </li>
      ))}
    </ul>
  </div>
);

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

const SummaryStats = ({ summary }: { summary: EvalSummary }) => {
  const groundingPct =
    summary.grounding_pass_rate !== null
      ? Math.round(summary.grounding_pass_rate * 100)
      : null;
  const coveragePct =
    summary.coverage_pass_rate !== null
      ? Math.round(summary.coverage_pass_rate * 100)
      : null;
  const coverageMean =
    summary.coverage_mean !== null ? summary.coverage_mean.toFixed(1) : null;

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="text-xs text-gray-500">
        {summary.n_successful}/{summary.n} intakes evaluated
      </div>
      {groundingPct !== null && (
        <ScoreBadge
          label="Grounding pass"
          value={`${groundingPct}%`}
          pass={groundingPct >= 80}
        />
      )}
      {coverageMean !== null && coveragePct !== null && (
        <ScoreBadge
          label={`Coverage avg ${coverageMean}/10`}
          value={`${coveragePct}% pass`}
          pass={coveragePct >= 70}
        />
      )}
    </div>
  );
};

const IntakeRow = ({
  result,
  expanded,
  onToggle,
  coveragePassThreshold,
}: {
  result: IntakeEvalResult;
  expanded: boolean;
  onToggle: () => void;
  coveragePassThreshold: number;
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

  const groundingScore = result.grounding?.score;
  const coverageScore = result.coverage?.score;

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs text-gray-500 font-mono">{shortId}…</span>
        <div className="flex items-center gap-2">
          {groundingScore !== undefined && (
            <ScoreBadge
              label="G"
              value={groundingScore === 1 ? "Pass" : "Fail"}
              pass={groundingScore === 1}
            />
          )}
          {coverageScore !== undefined && (
            <ScoreBadge
              label="C"
              value={`${coverageScore}/10`}
              pass={coverageScore >= coveragePassThreshold}
            />
          )}
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
          {result.grounding && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">
                Grounding
              </p>
              {result.grounding.explanation && (
                <p className="text-xs text-gray-600 mb-1">
                  {result.grounding.explanation}
                </p>
              )}
              {!!result.grounding.hallucinated_facts?.length && (
                <FactList
                  title="Hallucinated facts"
                  items={result.grounding.hallucinated_facts}
                  color="red"
                />
              )}
              {!!result.grounding.interpretive_additions?.length && (
                <FactList
                  title="Interpretive additions"
                  items={result.grounding.interpretive_additions}
                  color="yellow"
                />
              )}
              {!!result.grounding.correct_facts?.length && (
                <FactList
                  title="Correct facts"
                  items={result.grounding.correct_facts}
                  color="green"
                />
              )}
            </div>
          )}
          {result.coverage && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">Coverage</p>
              {result.coverage.explanation && (
                <p className="text-xs text-gray-600 mb-1">
                  {result.coverage.explanation}
                </p>
              )}
              {!!result.coverage.missing_details?.length && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Missing details:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {result.coverage.missing_details.map((d, i) => (
                      <li key={i} className="text-xs text-gray-600">
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
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
                coveragePassThreshold={
                  metrics.summary?.coverage_pass_threshold ?? 7
                }
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

interface EvalResultsPanelProps {
  configId: string;
  refetchKey: number;
}

export const EvalResultsPanel = ({
  configId,
  refetchKey,
}: EvalResultsPanelProps) => {
  const auth = useAuth();
  const [results, setResults] = useState<EvalResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const token = await auth.getAccessToken();
        const response = await fetch(
          `${BACKEND_URL}/config-management/outputs/${configId}/eval`,
          { headers: configHeaders(token) },
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [configId, refetchKey, auth]);

  if (isLoading) {
    return (
      <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Eval Results</h2>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Eval Results</h2>
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
      <h2 className="text-sm font-medium text-gray-700 mb-4">Eval Results</h2>

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
