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

import { useCallback, useEffect, useRef, useState } from "react";

// How long the PHI pauses typing before their text saves. Firestore sustains
// about one write per second to a report document, so steady typing stays
// under that.
export const AUTOSAVE_DELAY_MS = 1000;

// The saves the hook starts on its own, after a pause, on blur, and on
// unmount, have no caller to stop. A failure shows through saveFailed, and
// the next save tries again.
const ignoreFailedSave = () => undefined;

export type AutosavedText = {
  // What the text box shows.
  text: string;
  onChange: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  // Saves any unsaved text now. The promise settles once the save, and any
  // save already in flight, finishes, and rejects if the save fails, so a
  // caller can stop what it was about to do, such as removing the row.
  flush: () => Promise<void>;
  // Whether the last save failed. The text stays unsaved, and the next save
  // tries again.
  saveFailed: boolean;
};

/**
 * Saves a report text field as the PHI types. The text saves after a pause
 * in typing, when the box loses focus, when the caller calls flush, and when
 * the component unmounts with text still unsaved. Saves go one at a time,
 * with any text typed during a save sent after it, so an older save never
 * lands after a newer one.
 *
 * While the box has focus, or holds text that isn't saved yet, it shows the
 * PHI's own text rather than the saved value. The report listener sends each
 * save back while the PHI is still typing, and showing that copy would move
 * the cursor and drop what they typed since. Otherwise the box shows the
 * saved value, so an edit from another tab appears.
 *
 * @param value - The field's saved value, or null when it's empty.
 * @param onSave - Saves the text, or null when the PHI emptied the box. If
 *   it rejects, the text stays unsaved, saveFailed turns on, and flush
 *   rejects too.
 */
export function useAutosavedText({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
}): AutosavedText {
  const [draft, setDraft] = useState(value ?? "");
  const [focused, setFocused] = useState(false);
  const [unsaved, setUnsavedState] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  // Saves run after the render that started them, so they read these refs
  // rather than state.
  const draftRef = useRef(draft);
  const unsavedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const runningRef = useRef<Promise<void>>(undefined);
  const saveAgainRef = useRef(false);
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  const setUnsaved = useCallback((next: boolean) => {
    unsavedRef.current = next;
    setUnsavedState(next);
  }, []);

  // Saves the unsaved text, then saves again if a flush arrived while the
  // save was in flight.
  const runSaves = useCallback(async (): Promise<void> => {
    saveAgainRef.current = false;
    if (!unsavedRef.current) return;
    const sent = draftRef.current;
    try {
      await onSaveRef.current(sent === "" ? null : sent);
    } catch (error) {
      setSaveFailed(true);
      throw error;
    }
    setSaveFailed(false);
    if (draftRef.current === sent) setUnsaved(false);
    if (saveAgainRef.current) await runSaves();
  }, [setUnsaved]);

  const flush = useCallback((): Promise<void> => {
    clearTimeout(timerRef.current);
    if (runningRef.current) {
      saveAgainRef.current = true;
      return runningRef.current;
    }
    const run = runSaves().finally(() => {
      runningRef.current = undefined;
    });
    runningRef.current = run;
    return run;
  }, [runSaves]);

  const onChange = useCallback(
    (text: string) => {
      draftRef.current = text;
      setDraft(text);
      setUnsaved(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => flush().catch(ignoreFailedSave),
        AUTOSAVE_DELAY_MS,
      );
    },
    [flush, setUnsaved],
  );

  const onFocus = useCallback(() => {
    setFocused(true);
    if (unsavedRef.current) return;
    const saved = value ?? "";
    draftRef.current = saved;
    setDraft(saved);
  }, [value]);

  const onBlur = useCallback(() => {
    setFocused(false);
    flush().catch(ignoreFailedSave);
  }, [flush]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      if (unsavedRef.current) flush().catch(ignoreFailedSave);
    },
    [flush],
  );

  return {
    text: focused || unsaved ? draft : value ?? "",
    onChange,
    onFocus,
    onBlur,
    flush,
    saveFailed,
  };
}
