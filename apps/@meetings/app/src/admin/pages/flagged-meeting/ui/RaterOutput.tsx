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

import type { ReactNode } from "react";
import { View } from "react-native";

import type { FlaggedMeetingDetails } from "~@meetings/app/admin/api/flaggedMeetings";
import { StatusBadge } from "~@meetings/app/admin/ui/StatusBadge";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { formatDate, formatDateTime } from "../lib/format";
import { gradeDisplay } from "../lib/grades";
import { buildRaterItems } from "../lib/raterNotes";

type Llm = NonNullable<FlaggedMeetingDetails["llm"]>;
type Dimension = Llm["dimensions"][number];
type Rater = NonNullable<
  FlaggedMeetingDetails["labelStudio"]
>["raters"][number];

const LLM_ORDER = [
  "overall",
  "caseNote",
  "actionItems",
  "transcriptComparison",
];

const VOTE_TAB_LABELS: Record<string, string> = {
  DRAFT_CASE_NOTES: "case note",
  ACTION_ITEMS: "action items",
  STAFF_FEEDBACK: "staff feedback",
};

function Card({
  title,
  sub,
  tag,
  children,
}: {
  title: string;
  sub?: string;
  tag?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="min-w-[280px] flex-1 rounded-lg border border-subtle">
      <View className="gap-0.5 border-b border-subtle px-4 py-3">
        <View className="flex-row items-center justify-between gap-2">
          <Typography variant="body-s-medium" className="flex-1">
            {title}
          </Typography>
          {tag}
        </View>
        {sub && (
          <Typography variant="caption-s-regular" className="!text-tertiary">
            {sub}
          </Typography>
        )}
      </View>
      {children}
    </View>
  );
}

function Item({
  label,
  badges,
  children,
}: {
  label: string;
  badges?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <View className="gap-1.5 border-b border-subtle px-4 py-3 last:border-b-0">
      <View className="flex-row items-center justify-between gap-2">
        <Typography variant="body-s-medium" className="flex-1 !text-secondary">
          {label}
        </Typography>
        {badges}
      </View>
      {children}
    </View>
  );
}

function GradeBadge({ grade, prefix }: { grade: string; prefix?: string }) {
  const { label, tone } = gradeDisplay(grade);
  return (
    <StatusBadge dot tone={tone}>
      {prefix ? `${prefix}: ${label}` : label}
    </StatusBadge>
  );
}

function FindingList({
  label,
  entries,
  edge,
}: {
  label: string;
  entries: string[];
  edge: string;
}) {
  if (entries.length === 0) return null;
  return (
    <View className="gap-1">
      <Typography variant="caption-s-medium" className="!text-tertiary">
        {`${label} (${entries.length})`}
      </Typography>
      {entries.map((entry, index) => (
        <View key={index} className={`border-l-2 pl-2.5 ${edge}`}>
          <Typography variant="body-s-regular">{entry}</Typography>
        </View>
      ))}
    </View>
  );
}

function LlmItem({ dimension }: { dimension: Dimension }) {
  if (dimension.providerGrades) {
    return (
      <Item
        label="Transcript (AssemblyAI vs Deepgram)"
        badges={
          <View className="flex-row flex-wrap justify-end gap-1">
            <GradeBadge
              grade={dimension.providerGrades.assemblyai}
              prefix="AssemblyAI"
            />
            <GradeBadge
              grade={dimension.providerGrades.deepgram}
              prefix="Deepgram"
            />
          </View>
        }
      >
        <Typography variant="body-s-regular">{dimension.rationale}</Typography>
      </Item>
    );
  }
  return (
    <Item
      label={dimension.label}
      badges={<GradeBadge grade={dimension.gradeOrWinner} />}
    >
      <Typography variant="body-s-regular">{dimension.rationale}</Typography>
      <FindingList
        label="Hallucinations"
        entries={dimension.hallucinations}
        edge="border-attention"
      />
      <FindingList
        label="Omissions"
        entries={dimension.omissions}
        edge="border-warning"
      />
    </Item>
  );
}

export function LlmJudgeCard({ llm }: { llm: Llm }) {
  const flagged = llm.dimensions.some(
    (d) => d.key !== "transcriptComparison" && d.bad,
  );
  const dimensions = [...llm.dimensions].sort(
    (a, b) => LLM_ORDER.indexOf(a.key) - LLM_ORDER.indexOf(b.key),
  );
  return (
    <Card
      title="LLM judge"
      sub={`Evaluator ${llm.evaluatorVersion} · ran ${formatDateTime(llm.createdAt)}`}
      tag={flagged ? <StatusBadge tone="bad">Flagged</StatusBadge> : undefined}
    >
      {dimensions.map((d) => (
        <LlmItem key={d.key} dimension={d} />
      ))}
    </Card>
  );
}

export function RaterCard({ rater }: { rater: Rater }) {
  const edited = rater.updatedAt.getTime() !== rater.annotatedAt.getTime();
  const sub = `Annotated ${formatDate(rater.annotatedAt)}${
    edited ? ` · edited ${formatDate(rater.updatedAt)}` : ""
  }`;
  return (
    <Card
      title={rater.raterEmail}
      sub={sub}
      tag={
        rater.isAuthoritative ? (
          <StatusBadge tone="info">Authoritative</StatusBadge>
        ) : undefined
      }
    >
      {buildRaterItems(rater).map((item) => (
        <Item
          key={item.label}
          label={item.label}
          badges={item.grade ? <GradeBadge grade={item.grade} /> : undefined}
        >
          {item.notes.map((note, index) => (
            <Typography key={index} variant="body-s-regular">
              {note}
            </Typography>
          ))}
        </Item>
      ))}
      {rater.actionItemsIgnoredFieldName && (
        <View className="px-4 py-3">
          <Typography variant="caption-s-regular" className="!text-tertiary">
            This rater's action items grade was excluded from flagging: they
            graded it before the sync bug was fixed.
          </Typography>
        </View>
      )}
    </Card>
  );
}

export function VotesCard({
  votes,
}: {
  votes: FlaggedMeetingDetails["votes"];
}) {
  return (
    <Card title="In-app feedback">
      {votes.map((vote, index) => {
        const up = vote.vote === "UP";
        return (
          <Item
            key={index}
            label={`Thumbs ${up ? "up" : "down"} on ${
              VOTE_TAB_LABELS[vote.tab] ?? vote.tab
            }`}
            badges={
              <StatusBadge dot tone={up ? "good" : "bad"}>
                {up ? "Up" : "Down"}
              </StatusBadge>
            }
          >
            <Typography
              variant="body-s-regular"
              className={vote.message ? undefined : "!text-tertiary"}
            >
              {vote.message ?? "No comment left."}
            </Typography>
            <Typography variant="caption-s-regular" className="!text-tertiary">
              {`${vote.voterEmail} · ${formatDateTime(vote.createdAt)}`}
            </Typography>
          </Item>
        );
      })}
    </Card>
  );
}
