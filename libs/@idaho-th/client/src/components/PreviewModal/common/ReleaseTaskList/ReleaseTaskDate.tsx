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

import { format, isValid, parse } from "date-fns";
import React, { useState } from "react";

import { RELEASE_TASK_DATE_INVALID_ERROR } from "~@idaho-th/shared";

import { formatCalendarDate } from "../../../../utils/date";
import { DatePickerInput } from "../../../common/inputs/DatePickerInput";
import * as Styled from "./ReleaseTaskDate.styles";
import * as NoteStyled from "./ReleaseTaskNote.styles";

const MM_DD_YYYY = "MM/dd/yyyy";
const YYYY_MM_DD = "yyyy-MM-dd";

interface ReleaseTaskDateProps {
  /** UTC-midnight day from the server, or null when unset. */
  value: Date | null;
  /** The owning role edits the date; everyone else reads the saved version. */
  editable: boolean;
  /** Called with `yyyy-MM-dd`, or null to clear. */
  onChange?: (date: string | null) => void;
  ariaLabel: string;
  placeholder: string;
  emptyMessage: string;
  valueLabel?: string;
}

export const ReleaseTaskDate: React.FC<ReleaseTaskDateProps> = ({
  value,
  editable,
  onChange,
  ariaLabel,
  placeholder,
  emptyMessage,
  valueLabel,
}) => {
  // Keyed off the formatted string, not the Date: superjson rebuilds the Date
  // on every refetch, which would otherwise wipe a half-typed entry.
  const savedText = formatCalendarDate(value, MM_DD_YYYY);
  const [text, setText] = useState(savedText);
  const [syncedText, setSyncedText] = useState(savedText);
  const [error, setError] = useState<string | null>(null);

  if (savedText !== syncedText) {
    setSyncedText(savedText);
    setText(savedText);
    setError(null);
  }

  if (!editable) {
    return (
      <NoteStyled.ProviderNoteWrapper>
        <NoteStyled.ProviderNoteText $hasNote={value != null}>
          {value == null
            ? emptyMessage
            : `${valueLabel}: ${formatCalendarDate(value)}`}
        </NoteStyled.ProviderNoteText>
      </NoteStyled.ProviderNoteWrapper>
    );
  }

  const handleChange = (next: string | null) => {
    setText(next ?? "");
    if (!next) {
      setError(null);
      onChange?.(null);
      return;
    }
    // Partial input is never saved.
    if (next.length < MM_DD_YYYY.length) return;

    const parsed = parse(next, MM_DD_YYYY, new Date());
    if (!isValid(parsed)) {
      setError(RELEASE_TASK_DATE_INVALID_ERROR);
      return;
    }
    setError(null);
    onChange?.(format(parsed, YYYY_MM_DD));
  };

  return (
    <NoteStyled.NoteWrapper>
      <DatePickerInput
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        hasError={error != null}
      />
      {error && <Styled.ErrorText role="alert">{error}</Styled.ErrorText>}
    </NoteStyled.NoteWrapper>
  );
};
