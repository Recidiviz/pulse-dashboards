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

import { observer } from "mobx-react-lite";
import { useState } from "react";

import {
  adSeg,
  ClassificationNote,
  latestIncidents,
  UsMiAssessmentQuestionNote,
} from "~datatypes";

import { formatWorkflowsDate } from "../../../../utils";
import {
  NoNoteFound,
  NoteDate,
  NoteField,
  NoteHeader,
  NoteMisconducts,
  NotesBox,
  NotesRow,
  ViewMoreQuestionNotes,
} from "./Styles";

export function formatClassificationNote(date: Date | string | null) {
  if (date instanceof Date) return formatWorkflowsDate(date);
  if (typeof date === "string") return formatWorkflowsDate(new Date(date));
  return "Present";
}

export const NoteRow = observer(function NoteRow({
  event,
  date,
}: {
  event: string;
  date: Date | string;
}) {
  return (
    <NotesRow>
      <div>{event}</div>
      <NoteDate>
        {typeof date === "string" ? date : formatWorkflowsDate(date)}
      </NoteDate>
    </NotesRow>
  );
});

function newestIncidentsFirst(incidents: latestIncidents): latestIncidents {
  return incidents.toSorted(
    (a, b) => b.incidentDate.getTime() - a.incidentDate.getTime(),
  );
}

function toGoodBehaviorRows(
  adSegPlacements: adSeg | adSeg[],
  incidents: latestIncidents,
): NoteRowData[] {
  if (!Array.isArray(adSegPlacements)) adSegPlacements = [adSegPlacements];
  // Sort on the raw dates, since ad seg rows display a formatted date range.
  return [
    ...adSegPlacements.map((adSeg) => ({
      sortTime: adSeg.adSegStartDate?.getTime() ?? 0,
      event: "Administrative Segregation",
      date: `${formatClassificationNote(adSeg.adSegStartDate)} – ${
        formatClassificationNote(adSeg.adSegEndDateExclusive) ?? "present"
      }`,
    })),
    ...incidents.map((incident) => ({
      sortTime: incident.incidentDate.getTime(),
      event: incident.infractionTypeRawText.replaceAll("@@", " & "),
      date: incident.incidentDate,
    })),
  ]
    .toSorted((a, b) => b.sortTime - a.sortTime)
    .map(({ event, date }) => ({ event, date }));
}

// Returns undefined for notes that are not one of the good behavior kinds.
function goodBehaviorNotes(
  note: ClassificationNote,
  noteInfo: UsMiAssessmentQuestionNote,
): { header?: string; rows: NoteRowData[] } | undefined {
  switch (note.kind) {
    case "goodBehaviorFourMonth":
      return {
        header: noteInfo.header,
        rows: toGoodBehaviorRows(
          note.data.latestAdSegPlacement ?? [],
          note.data.latestIncidents,
        ),
      };
    case "goodBehaviorPastYear":
      return {
        header: noteInfo.secondary,
        rows: toGoodBehaviorRows(
          note.data.adSegPlacementsList ?? [],
          note.data.incidentsList ?? [],
        ),
      };
    default:
      return undefined;
  }
}

type NoteRowData = { event: string; date: Date | string };

export const QuestionNotes = function QuestionNotes({
  note,
  noteInfo,
}: {
  note?: ClassificationNote | null;
  noteInfo?: UsMiAssessmentQuestionNote;
}) {
  const [showMore, updateShowMore] = useState(false);

  const sliceAmount = showMore ? undefined : 4;

  if (!noteInfo) return null;

  if (
    !note ||
    (note.kind === "vfo" && note.data.vfoLevelDetail === null) ||
    (note.kind === "releases" && note.data.prevReleaseDate === null) ||
    (note.kind === "adSeg" && note.data.numAdSegStartsInPast36Months === 0)
  )
    return (
      <div>
        <NoteHeader>{noteInfo?.header}</NoteHeader>
        <NoNoteFound>{noteInfo?.notfound}</NoNoteFound>
      </div>
    );

  const listLength =
    (note.kind === "adSeg" && note.data.adSegStartsList?.length) ||
    (note.kind === "incidents" && note.data.incidentsList?.length) ||
    (note.kind === "programs" && note.data.length) ||
    0;

  const goodBehavior = goodBehaviorNotes(note, noteInfo);

  if (goodBehavior?.rows.length === 0) {
    return (
      <div>
        <NoteHeader>{goodBehavior.header}</NoteHeader>
        <NoNoteFound>{noteInfo.notfound}</NoNoteFound>
      </div>
    );
  }

  if (goodBehavior) {
    return (
      <div>
        <NoteHeader>{goodBehavior.header}</NoteHeader>
        <NotesBox>
          {goodBehavior.rows
            .slice(0, sliceAmount)
            .map(({ event, date }, index) => (
              <NoteRow
                // eslint-disable-next-line react/no-array-index-key
                key={`good-behavior-note-${index}`}
                event={event}
                date={date}
              />
            ))}
          {goodBehavior.rows.length > 4 && (
            <ViewMoreQuestionNotes
              onClick={(e) => {
                e.preventDefault();
                updateShowMore(!showMore);
              }}
            >
              {showMore ? "Show Fewer" : "Show More"}
            </ViewMoreQuestionNotes>
          )}
        </NotesBox>
      </div>
    );
  }

  return (
    <div>
      <NoteHeader>{noteInfo?.header}</NoteHeader>
      <NotesBox>
        {note.kind === "vfo" && (
          <NoteRow
            event={`VFO: ${note.data.vfoLevelDetail}`}
            date={note.data.assessmentDate}
          />
        )}
        {note.kind === "age" && <NotesRow>{`Age: ${note.data.age}`}</NotesRow>}
        {note.kind === "felony" &&
          note.data.map((felony, index) => (
            <NoteRow
              // eslint-disable-next-line react/no-array-index-key
              key={`felony-note-${index}`}
              event={felony.description}
              date={felony.imposedDate}
            />
          ))}

        {note.kind === "adSeg" &&
          note.data.adSegStartsList
            ?.slice(0, sliceAmount)
            .map((listItem, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <NotesRow key={`adseg-note-${index}`}>
                <NoteField>Placement</NoteField>
                <NoteMisconducts>
                  {`${formatClassificationNote(listItem.adSegStartDate)} – ${
                    formatClassificationNote(listItem.adSegEndDateExclusive) ??
                    "present"
                  }`}
                </NoteMisconducts>
              </NotesRow>
            ))}

        {note.kind === "releases" && (
          <>
            <NotesRow>
              <NoteField>{`Most recent release: `}</NoteField>
              <NoteField>
                {formatClassificationNote(note.data.prevReleaseDate)}
              </NoteField>
            </NotesRow>
            <NotesRow>
              <NoteField>TRUE security level at release</NoteField>
              <NoteField>
                {" "}
                {note.data.prevReleaseTrueLevel
                  ? `Level ${note.data.prevReleaseTrueLevel}`
                  : `Unknown`}
              </NoteField>
            </NotesRow>
          </>
        )}

        {note.kind === "programs" &&
          note.data.slice(0, sliceAmount).map((program, index) => (
            <NoteRow
              // eslint-disable-next-line react/no-array-index-key
              key={`program-note-${index}`}
              event={program.programName}
              date={program.completionDate}
            />
          ))}
        {note.kind === "incidents" &&
          newestIncidentsFirst(note.data.incidentsList ?? [])
            .slice(0, sliceAmount)
            .map((incident, index) => {
              const incidents = incident.infractionTypeRawText.replaceAll(
                "@@",
                " & ",
              );

              return (
                <NoteRow
                  // eslint-disable-next-line react/no-array-index-key
                  key={`incidents-note-${index}`}
                  event={incidents}
                  date={incident.incidentDate}
                />
              );
            })}
      </NotesBox>

      {listLength > 4 && (
        <ViewMoreQuestionNotes
          onClick={(e) => {
            e.preventDefault();
            updateShowMore(!showMore);
          }}
        >
          {showMore ? "Show Fewer" : "Show More"}
        </ViewMoreQuestionNotes>
      )}
    </div>
  );
};
