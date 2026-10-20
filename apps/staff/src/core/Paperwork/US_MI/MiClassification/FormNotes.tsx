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

import { ClassificationNote } from "~datatypes";
import { palette } from "~design-system";
import { pluralizeWord } from "~utils";

import { formatWorkflowsDate } from "../../../../utils";
import {
  NoNoteFound,
  NoteDate,
  NoteField,
  NoteHeader,
  NoteMisconducts,
  NotesRow,
  ViewMoreQuestionNotes,
} from "./Styles";

export function formatClassificationNote(date: Date | string | null) {
  if (date instanceof Date) return formatWorkflowsDate(date);
  if (typeof date === "string") return formatWorkflowsDate(new Date(date));
}

export const NoteRow = observer(function NoteRow({
  event,
  date,
}: {
  event: string;
  date: Date;
}) {
  return (
    <NotesRow>
      <div>{event}</div>
      <NoteDate>{formatWorkflowsDate(date)}</NoteDate>
    </NotesRow>
  );
});

export const QuestionNotes = observer(function QuestionNotes({
  note,
  noteInfo,
}: {
  note?: ClassificationNote | null;
  noteInfo?: {
    header: string;
    notfound: string;
  };
}) {
  const [showMore, updateShowMore] = useState(false);

  const sliceAmount = showMore ? undefined : 4;

  if (!noteInfo) return null;

  if (
    !note ||
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

  return (
    <div>
      <NoteHeader>{noteInfo?.header}</NoteHeader>
      <div
        style={{
          borderLeft: `2px solid ${palette.slate20}`,
          marginLeft: "5px",
          padding: "2px",
        }}
      >
        {note.kind === "vfo" && (
          <NoteRow
            event={`VFO: ${note.data.vfoLevel ?? note.data.vfoLevelDetail}`}
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
        {note.kind === "incidents" &&
          note.data.incidentsList
            ?.slice(0, sliceAmount)
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

        {note.kind === "goodBehavior" &&
          note.data.map(({ timePeriod, misconductCount }) => (
            <NotesRow key={timePeriod}>
              <NoteField>{timePeriod}</NoteField>
              <NoteField>
                {`${misconductCount} ${pluralizeWord({ term: "Misconduct", count: misconductCount })}`}
              </NoteField>
            </NotesRow>
          ))}

        {note.kind === "programs" &&
          note.data.slice(0, sliceAmount).map((program, index) => (
            <NoteRow
              // eslint-disable-next-line react/no-array-index-key
              key={`program-note-${index}`}
              event={program.programName}
              date={program.completionDate}
            />
          ))}
      </div>

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
});
