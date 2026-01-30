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

import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";

import { getItem, saveItem } from "~@meetings/app/utils/storage";

export function useNote() {
  const [note, setNote] = useState("");
  const debouncedSave = useRef(
    debounce((noteToSave: string) => {
      saveItem("note", noteToSave);
    }, 1000),
  ).current;

  const updateNote = (newNote: string) => {
    setNote(newNote);
    debouncedSave(newNote);
  };

  useEffect(() => {
    async function loadNote() {
      const persistedNote = await getItem("note");
      setNote(persistedNote);
    }
    loadNote();
  }, []);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return [note, updateNote] as const;
}
