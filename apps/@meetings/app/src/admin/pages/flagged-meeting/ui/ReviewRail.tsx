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

import clsx from "clsx";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import type {
  FlaggedMeetingDetails,
  FlagSection,
  SectionReview,
} from "~@meetings/app/admin/api/flaggedMeetings";
import {
  isSectionDone,
  outcomeLabel,
  reopenSentence,
  reviewableSections,
  SECTION_LABEL,
} from "~@meetings/app/admin/entities/flagged-meeting-review";
import { SegmentedControl } from "~@meetings/app/admin/ui/SegmentedControl";
import {
  StatusBadge,
  type StatusTone,
} from "~@meetings/app/admin/ui/StatusBadge";
import { trpc } from "~@meetings/app/shared/api";
import { Button } from "~@meetings/app/shared/ui/Button";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { formatDate } from "../lib/format";
import {
  canSave,
  type CoveredSection,
  draftFromOutcome,
  emptyDraft,
  type FollowUp,
  type OutcomeKind,
  overridableSources,
  type OverrideSource,
  type ReviewDraft,
  toRecordInput,
} from "../lib/reviewDraft";

const LABEL_STUDIO_RATER = "admin@recidiviz.org";

const SOURCE_NAME: Record<OverrideSource, string> = {
  LLM_JUDGE: "LLM judge",
  LABEL_STUDIO: "Label Studio",
};

const FOLLOW_UP_OPTIONS: { value: FollowUp; label: string }[] = [
  { value: "NO_ACTION", label: "No action" },
  { value: "USER_CAUGHT_IT", label: "User caught it" },
  { value: "EMAILED_PO", label: "Emailed the PO" },
];

function Chip({
  label,
  selected,
  onPress,
  role = "radio",
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role?: "radio" | "checkbox";
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      className={clsx(
        "rounded-full border px-2.5 py-1",
        selected ? "border-brand bg-brand" : "border-subtle bg-primary",
      )}
    >
      <Typography
        variant="caption-s-medium"
        className={selected ? "!text-on-brand" : "!text-primary"}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function ChipGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-1.5 pt-2.5">
      <Typography variant="caption-s-medium" className="!text-tertiary">
        {label}
      </Typography>
      <View className="flex-row flex-wrap gap-1.5">{children}</View>
    </View>
  );
}

function OptionCard({
  label,
  sub,
  selected,
  onPress,
  children,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      className={clsx(
        "flex-row gap-2.5 rounded-lg border px-3 py-2.5",
        selected ? "border-brand bg-brand-light" : "border-subtle bg-primary",
      )}
    >
      <View
        className={clsx(
          "mt-0.5 size-4 items-center justify-center rounded-full border",
          selected ? "border-brand" : "border-subtle",
        )}
      >
        {selected && <View className="size-2 rounded-full bg-brand" />}
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Typography variant="body-s-medium">{label}</Typography>
        <Typography variant="caption-s-regular" className="!text-secondary">
          {sub}
        </Typography>
        {selected && children}
      </View>
    </Pressable>
  );
}

/** Which of the flagging sources apply to this section, in a sentence. */
function problemText(
  section: FlagSection,
  details: FlaggedMeetingDetails,
  multiSection: boolean,
): string {
  const flag = details.sections[section];
  const raters = details.labelStudio?.raters.length ?? 0;
  if (section === "OVERALL") {
    const who = [
      flag.llm && "The LLM judge",
      flag.labelStudio && "Label Studio",
    ].filter(Boolean);
    return `${who.join(" and ") || "Nobody"} rated Overall Bad without flagging the case note or action items. Read both, then record which section it applies to.`;
  }
  const by = [
    flag.llm && "the LLM judge",
    flag.labelStudio &&
      `Label Studio (${raters} rater${raters === 1 ? "" : "s"})`,
    flag.vote && "in-app feedback",
  ].filter(Boolean);
  const flagged =
    by.length > 0
      ? `${SECTION_LABEL[section]} flagged by ${by.join(", ")}.`
      : `${SECTION_LABEL[section]} is no longer flagged.`;
  return multiSection
    ? `${flagged} Record one outcome for each flagged section.`
    : flagged;
}

function railState(status: SectionReview["status"]): {
  label: string;
  tone: StatusTone;
} {
  if (status === "reopened") return { label: "Reopened", tone: "bad" };
  if (status === "reviewed") return { label: "Reviewed", tone: "info" };
  return { label: "Needs review", tone: "partial" };
}

type ReviewRailProps = {
  details: FlaggedMeetingDetails;
};

/** Records an admin's verdict on each flagged section of the meeting. */
export function ReviewRail({ details }: ReviewRailProps) {
  const sections = reviewableSections(details.reviews);
  const firstOpen = sections.find((s) => !isSectionDone(details.reviews[s]));
  const [selected, setSelected] = useState<FlagSection | undefined>(
    firstOpen ?? sections[0],
  );
  const [drafts, setDrafts] = useState<
    Partial<Record<FlagSection, ReviewDraft>>
  >({});
  const [editing, setEditing] = useState<Partial<Record<FlagSection, boolean>>>(
    {},
  );

  const utils = trpc.useUtils();
  const snackbar = useSnackbar();
  const recordOutcome = trpc.v1.flaggedMeetings.recordOutcome.useMutation({
    onSuccess: async (_result, input) => {
      await Promise.all([
        utils.v1.flaggedMeetings.getDetails.invalidate({
          stateCode: details.stateCode,
          meetingId: details.meetingId,
        }),
        utils.v1.flaggedMeetings.list.invalidate(),
      ]);
      setEditing((e) => ({ ...e, [input.section]: false }));
      setDrafts((d) => ({ ...d, [input.section]: undefined }));
      snackbar.showSnackbar("Outcome recorded.");
      const next = sections.find(
        (s) => s !== input.section && !isSectionDone(details.reviews[s]),
      );
      if (next) setSelected(next);
    },
  });

  if (!selected) {
    return (
      <RailShell>
        <View className="gap-1 p-5">
          <Typography variant="body-s-regular" className="!text-secondary">
            Nothing on this meeting is flagged, so there is nothing to review.
          </Typography>
        </View>
      </RailShell>
    );
  }

  const review = details.reviews[selected];
  const reopened = review.status === "reopened";
  const recorded = review.latestOutcome;
  const isEditing = !recorded || reopened || editing[selected] === true;
  const { rated: ratedSources, flagged: flaggedSources } = overridableSources(
    details,
    selected,
  );
  const draft = drafts[selected] ?? emptyDraft(flaggedSources);
  const update = (patch: Partial<ReviewDraft>) => {
    setDrafts((d) => ({ ...d, [selected]: { ...draft, ...patch } }));
  };
  const pickOutcome = (outcome: OutcomeKind) => update({ outcome });
  // A reopened section has no recorded view to fall back to, so only a
  // deliberate "Change outcome" can be cancelled.
  const canCancel = recorded !== null && !reopened;
  const cancelEdit = () => {
    setEditing((e) => ({ ...e, [selected]: false }));
    setDrafts((d) => ({ ...d, [selected]: undefined }));
    recordOutcome.reset();
  };

  const toggleSource = (source: OverrideSource) => {
    update({
      overriddenSources: draft.overriddenSources.includes(source)
        ? draft.overriddenSources.filter((s) => s !== source)
        : [...draft.overriddenSources, source],
    });
  };
  const toggleCovered = (covered: CoveredSection) => {
    const current = draft.appliesTo ?? [];
    update({
      appliesTo: current.includes(covered)
        ? current.filter((s) => s !== covered)
        : [...current, covered],
    });
  };

  const input = toRecordInput({
    stateCode: details.stateCode,
    meetingId: details.meetingId,
    section: selected,
    draft,
  });

  const appliesToGroup = selected === "OVERALL" && (
    <ChipGroup label="Which sections does it apply to?">
      <Chip
        role="checkbox"
        label="Case note"
        selected={draft.appliesTo?.includes("CASE_NOTE") ?? false}
        onPress={() => toggleCovered("CASE_NOTE")}
      />
      <Chip
        role="checkbox"
        label="Action items"
        selected={draft.appliesTo?.includes("ACTION_ITEMS") ?? false}
        onPress={() => toggleCovered("ACTION_ITEMS")}
      />
      <Chip
        label="Neither"
        selected={draft.appliesTo?.length === 0}
        onPress={() => update({ appliesTo: [] })}
      />
    </ChipGroup>
  );

  const { label: stateLabel, tone: stateTone } = railState(review.status);

  return (
    <RailShell>
      <View className="gap-2.5 border-b border-subtle px-5 py-4">
        <View className="flex-row items-center justify-between gap-2">
          <Typography variant="heading-5" className="font-libre-baskerville">
            Review
          </Typography>
          <StatusBadge tone={stateTone}>{stateLabel}</StatusBadge>
        </View>
        {sections.length > 1 && (
          <SegmentedControl
            className="self-stretch"
            value={selected}
            onChange={setSelected}
            options={sections.map((s) => ({
              value: s,
              label: `${SECTION_LABEL[s]}${isSectionDone(details.reviews[s]) ? " ✓" : ""}`,
            }))}
          />
        )}
        <Typography variant="body-s-regular" className="!text-secondary">
          {problemText(selected, details, sections.length > 1)}
        </Typography>
        {reopened && recorded && review.reopened && (
          <View className="rounded-lg bg-warning-light px-3 py-2.5">
            <Typography variant="body-s-regular">
              {`${reopenSentence(selected, review.reopened)}, after the ${formatDate(recorded.createdAt)} outcome ("${outcomeLabel(recorded, selected)}"). Record a new outcome.`}
            </Typography>
          </View>
        )}
      </View>

      {recorded && !isEditing && (
        <View className="gap-3.5 p-5">
          <View className="gap-1">
            <Typography variant="caption-s-medium" className="!text-tertiary">
              Outcome
            </Typography>
            <Typography variant="body-m-medium">
              {outcomeLabel(recorded, selected)}
            </Typography>
          </View>
          {recorded.notes && (
            <View className="rounded-lg bg-secondary p-3">
              <Typography variant="body-s-regular">{recorded.notes}</Typography>
            </View>
          )}
          <Typography variant="caption-s-regular" className="!text-tertiary">
            {`${recorded.reviewerEmail} · ${formatDate(recorded.createdAt)}`}
          </Typography>
          <Button
            variant="secondary"
            className="self-start"
            onPress={() => {
              setDrafts((d) => ({
                ...d,
                [selected]: draftFromOutcome(recorded),
              }));
              setEditing((e) => ({ ...e, [selected]: true }));
            }}
          >
            Change outcome
          </Button>
        </View>
      )}

      {isEditing && (
        <View className="gap-4 p-5">
          <View accessibilityRole="radiogroup" className="gap-2">
            <Typography variant="body-s-medium" className="!text-secondary">
              Outcome
            </Typography>
            <OptionCard
              label="Confirmed BAD"
              sub="The output was wrong or harmful."
              selected={draft.outcome === "CONFIRMED_BAD"}
              onPress={() => pickOutcome("CONFIRMED_BAD")}
            >
              <ChipGroup label="What happened next">
                {FOLLOW_UP_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    label={o.label}
                    selected={draft.followUp === o.value}
                    onPress={() => update({ followUp: o.value })}
                  />
                ))}
              </ChipGroup>
              {appliesToGroup}
            </OptionCard>
            <OptionCard
              label="Not BAD"
              sub="The flag was wrong. Overrides the BAD grade on eval dashboards and is logged for judge tuning."
              selected={draft.outcome === "NOT_BAD"}
              onPress={() => pickOutcome("NOT_BAD")}
            >
              <ChipGroup label="Corrected grade">
                <Chip
                  label="Good"
                  selected={draft.correctedGrade === "GOOD"}
                  onPress={() => update({ correctedGrade: "GOOD" })}
                />
                <Chip
                  label="Partial"
                  selected={draft.correctedGrade === "PARTIAL"}
                  onPress={() => update({ correctedGrade: "PARTIAL" })}
                />
              </ChipGroup>
              {ratedSources.length > 0 && (
                <ChipGroup label="Ratings to override">
                  {ratedSources.map((source) => (
                    <Chip
                      key={source}
                      role="checkbox"
                      label={SOURCE_NAME[source]}
                      selected={draft.overriddenSources.includes(source)}
                      onPress={() => toggleSource(source)}
                    />
                  ))}
                </ChipGroup>
              )}
              {draft.overriddenSources.includes("LABEL_STUDIO") && (
                <Typography
                  variant="caption-s-regular"
                  className="pt-2 !text-secondary"
                >
                  {`Saving also records a ${draft.correctedGrade === "GOOD" ? "Good" : "Partial"} rating in Label Studio as ${LABEL_STUDIO_RATER}, which takes priority over the other raters.`}
                </Typography>
              )}
              <ChipGroup label="Follow-up">
                <Chip
                  label="No action"
                  selected={draft.followUp !== "EMAILED_PO"}
                  onPress={() => update({ followUp: "NO_ACTION" })}
                />
                <Chip
                  label="Emailed the PO"
                  selected={draft.followUp === "EMAILED_PO"}
                  onPress={() => update({ followUp: "EMAILED_PO" })}
                />
              </ChipGroup>
              {appliesToGroup}
            </OptionCard>
            <OptionCard
              label="Other / bug"
              sub="Put the Linear issue in the notes."
              selected={draft.outcome === "OTHER"}
              onPress={() => pickOutcome("OTHER")}
            />
          </View>

          <View className="gap-1.5">
            <Typography variant="body-s-medium" className="!text-secondary">
              Notes
            </Typography>
            <TextInput
              multiline
              numberOfLines={3}
              value={draft.notes}
              onChangeText={(notes) => update({ notes })}
              placeholder="Why this grade is right or wrong"
              className="min-h-[72px] rounded-lg border border-subtle bg-secondary px-3 py-2.5 text-sm text-primary"
            />
          </View>

          {recordOutcome.error && (
            <Typography variant="body-s-regular" className="!text-attention">
              {`Couldn't record the outcome: ${recordOutcome.error.message}`}
            </Typography>
          )}
          <View className="flex-row items-center justify-between gap-3">
            <Typography variant="caption-s-regular" className="!text-tertiary">
              Recorded under your account
            </Typography>
            <View className="flex-row items-center gap-2">
              {canCancel && (
                <Button variant="tertiary" onPress={cancelEdit}>
                  Cancel
                </Button>
              )}
              <Button
                variant="primary"
                disabled={!canSave(selected, draft)}
                loading={recordOutcome.isPending}
                onPress={() => input && recordOutcome.mutate(input)}
              >
                Record outcome
              </Button>
            </View>
          </View>
        </View>
      )}

      {reopened && recorded && (
        <View className="gap-1.5 border-t border-subtle px-5 pb-4 pt-3.5">
          <Typography variant="caption-s-medium" className="!text-tertiary">
            Earlier outcome
          </Typography>
          <Typography variant="caption-s-regular" className="!text-secondary">
            {`${formatDate(recorded.createdAt)} · ${recorded.reviewerEmail} · ${outcomeLabel(recorded, selected)}${recorded.notes ? ` · "${recorded.notes}"` : ""}`}
          </Typography>
        </View>
      )}
    </RailShell>
  );
}

function RailShell({ children }: { children: React.ReactNode }) {
  return (
    <View className="sticky top-6 w-[380px] max-w-full rounded-lg border border-subtle bg-primary shadow-sm">
      {children}
    </View>
  );
}
