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

import { useState } from "react";
import { ScrollView, View } from "react-native";

import type { FlaggedMeetingDetails } from "~@meetings/app/admin/api/flaggedMeetings";
import { SegmentedControl } from "~@meetings/app/admin/ui/SegmentedControl";
import { StatusBadge } from "~@meetings/app/admin/ui/StatusBadge";
import { Tabs } from "~@meetings/app/admin/ui/Tabs";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { formatDate, formatDateTime } from "../lib/format";
import { CaseNoteDiff } from "./CaseNoteDiff";

type NoteTab = "caseNote" | "actionItems" | "notepad";
type CaseNoteView = "generated" | "final" | "changes";

const isFlagged = (flag: {
  llm: boolean;
  labelStudio: boolean;
  vote: boolean;
}) => flag.llm || flag.labelStudio || flag.vote;

function ApprovalRow({
  approvedAt,
  editedAt,
  children,
}: {
  approvedAt: Date | null;
  editedAt: Date | null;
  children?: React.ReactNode;
}) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-2 px-4 pt-2.5">
      <View className="min-w-0 max-w-full flex-row flex-wrap items-center gap-2">
        <StatusBadge dot tone={approvedAt ? "good" : "neutral"}>
          {approvedAt
            ? `Approved ${formatDateTime(approvedAt)}`
            : "Not approved"}
        </StatusBadge>
        <Typography
          variant="caption-s-regular"
          className="min-w-0 shrink !text-tertiary"
        >
          {editedAt
            ? `Edited by staff on ${formatDate(editedAt)}.`
            : "Not edited by staff."}
        </Typography>
      </View>
      {children}
    </View>
  );
}

function CaseNote({
  caseNote,
}: {
  caseNote: FlaggedMeetingDetails["caseNote"];
}) {
  const { original, current, editedAt } = caseNote;
  const canCompare = !!editedAt && !!original;
  // What staff changed is the most useful view of an edited note.
  const [view, setView] = useState<CaseNoteView>(
    canCompare ? "changes" : "final",
  );
  const activeView = canCompare ? view : "final";

  return (
    <>
      <ApprovalRow approvedAt={caseNote.approvedAt} editedAt={editedAt}>
        {canCompare && (
          <SegmentedControl
            options={[
              { value: "generated", label: "Generated" },
              { value: "final", label: "Final" },
              { value: "changes", label: "Changes" },
            ]}
            value={view}
            onChange={setView}
          />
        )}
      </ApprovalRow>
      <ScrollView
        style={{ maxHeight: 520 }}
        contentContainerClassName="p-4 gap-3"
      >
        {activeView === "changes" && original && current !== null ? (
          <>
            <CaseNoteDiff original={original} edited={current} />
            <View className="flex-row gap-4">
              {[
                ["Removed by staff", "bg-[#B42D2D24]"],
                ["Added by staff", "bg-[#00C49D33]"],
              ].map(([label, swatch]) => (
                <View key={label} className="flex-row items-center gap-1.5">
                  <View className={`size-2.5 rounded-sm ${swatch}`} />
                  <Typography
                    variant="caption-s-regular"
                    className="!text-tertiary"
                  >
                    {label}
                  </Typography>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Typography variant="body-s-regular">
            {(activeView === "generated" ? original : current) ??
              "No case note."}
          </Typography>
        )}
        {editedAt && !original && (
          <Typography variant="caption-s-regular" className="!text-tertiary">
            The original generated note isn't available for this meeting.
          </Typography>
        )}
      </ScrollView>
    </>
  );
}

function ActionItems({
  actionItems,
}: {
  actionItems: FlaggedMeetingDetails["actionItems"];
}) {
  const { items, legacyItems } = actionItems;
  return (
    <>
      <ApprovalRow
        approvedAt={actionItems.approvedAt}
        editedAt={actionItems.editedAt}
      />
      <ScrollView style={{ maxHeight: 520 }} contentContainerClassName="py-2">
        {items.length > 0
          ? items.map((item, index) => {
              const edit =
                item.editedTask && item.editedTask !== item.generatedTask
                  ? item.editedTask
                  : null;
              return (
                <View key={index} className="flex-row gap-2.5 px-4 py-2">
                  <Typography
                    variant="caption-s-medium"
                    className="w-16 !text-secondary"
                  >
                    {item.assignee}
                  </Typography>
                  <View className="flex-1 gap-1">
                    <Typography
                      variant="body-s-regular"
                      className={
                        item.deleted
                          ? "!text-tertiary line-through"
                          : "!text-primary"
                      }
                    >
                      {item.generatedTask}
                    </Typography>
                    {edit && (
                      <View className="self-start rounded bg-brand-light px-1.5 py-0.5">
                        <Typography
                          variant="caption-s-regular"
                          className="!text-primary"
                        >
                          {`Staff edit: ${edit}`}
                        </Typography>
                      </View>
                    )}
                    {item.addedByStaff && (
                      <StatusBadge tone="info">Added by staff</StatusBadge>
                    )}
                    {item.deleted && (
                      <StatusBadge tone="neutral">Deleted by staff</StatusBadge>
                    )}
                  </View>
                </View>
              );
            })
          : legacyItems.map((text, index) => (
              <View key={index} className="px-4 py-2">
                <Typography variant="body-s-regular" className="!text-primary">
                  {text}
                </Typography>
              </View>
            ))}
        {items.length === 0 && legacyItems.length === 0 && (
          <View className="px-4 py-2">
            <Typography variant="body-s-regular" className="!text-tertiary">
              No action items.
            </Typography>
          </View>
        )}
      </ScrollView>
    </>
  );
}

export function NotesPanel({ details }: { details: FlaggedMeetingDetails }) {
  const [tab, setTab] = useState<NoteTab>("caseNote");
  const { sections, userNotepadNotes } = details;

  return (
    <View className="min-w-[300px] flex-1 overflow-hidden rounded-lg border border-subtle">
      <Tabs
        className="px-4"
        tabs={[
          {
            value: "caseNote",
            label: "Case note",
            flagged: isFlagged(sections.CASE_NOTE),
          },
          {
            value: "actionItems",
            label: "Action items",
            flagged: isFlagged(sections.ACTION_ITEMS),
          },
          { value: "notepad", label: "Staff notepad" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "caseNote" && <CaseNote caseNote={details.caseNote} />}
      {tab === "actionItems" && (
        <ActionItems actionItems={details.actionItems} />
      )}
      {tab === "notepad" && (
        <View className="gap-2 p-4">
          <Typography variant="caption-s-regular" className="!text-tertiary">
            Typed by staff during the meeting
          </Typography>
          {userNotepadNotes ? (
            <Typography variant="body-s-regular" className="!text-primary">
              {userNotepadNotes}
            </Typography>
          ) : (
            <Typography variant="body-s-regular" className="!text-tertiary">
              Staff did not use the notepad in this meeting.
            </Typography>
          )}
        </View>
      )}
    </View>
  );
}
