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

import React, { useCallback, useEffect, useRef, useState } from "react";

import { RELEASE_TASK_NOTE_MAX_LENGTH } from "~@idaho-th/shared";

import * as Styled from "./ReleaseTaskNote.styles";

const NOTE_DEBOUNCE_MS = 900;

interface ReleaseTaskNoteProps {
  value: string;
  /** Case managers edit the note; everyone else reads the saved version. */
  editable: boolean;
  onChange?: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
  emptyMessage: string;
}

export const ReleaseTaskNote: React.FC<ReleaseTaskNoteProps> = ({
  value,
  editable,
  onChange,
  ariaLabel,
  placeholder,
  emptyMessage,
}) => {
  const [noteValue, setNoteValue] = useState(value);
  const [focused, setFocused] = useState(false);
  const [, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const pendingNoteRef = useRef<string | null>(null);
  const editedRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // The case manager is the only writer, so once they start typing their input
  // wins over any value a refetch brings back mid-keystroke.
  useEffect(() => {
    if (!editedRef.current) setNoteValue(value);
  }, [value]);

  const saveNote = useCallback(() => {
    clearTimeout(debounceRef.current);
    if (pendingNoteRef.current === null) return;

    const note = pendingNoteRef.current;
    pendingNoteRef.current = null;
    setSaving(false);
    onChangeRef.current?.(note);
  }, []);

  // Flush rather than drop the last keystrokes when the modal closes.
  useEffect(() => () => saveNote(), [saveNote]);

  const handleChange = (next: string) => {
    editedRef.current = true;
    pendingNoteRef.current = next;
    setNoteValue(next);
    setSaving(true);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveNote, NOTE_DEBOUNCE_MS);
  };

  if (!editable) {
    return (
      <Styled.ProviderNoteWrapper>
        <Styled.ProviderNoteText $hasNote={!!value}>
          {value || emptyMessage}
        </Styled.ProviderNoteText>
      </Styled.ProviderNoteWrapper>
    );
  }

  return (
    <Styled.NoteWrapper>
      <Styled.NoteInput
        value={noteValue}
        $focused={focused}
        maxLength={RELEASE_TASK_NOTE_MAX_LENGTH}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          saveNote();
        }}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      <Styled.NoteCaption aria-live="polite">
        Saved with the task
      </Styled.NoteCaption>
    </Styled.NoteWrapper>
  );
};
