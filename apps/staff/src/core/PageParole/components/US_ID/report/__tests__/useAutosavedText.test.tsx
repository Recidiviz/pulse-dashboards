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

import { act, renderHook } from "@testing-library/react";

import { AUTOSAVE_DELAY_MS, useAutosavedText } from "../useAutosavedText";

type Props = {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
};

function renderAutosave(props: Props) {
  return renderHook((current: Props) => useAutosavedText(current), {
    initialProps: props,
  });
}

/** A save the test resolves or rejects itself. */
function deferredSave() {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useAutosavedText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves once the PHI pauses typing", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderAutosave({ value: null, onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange("Entered"));
    act(() => result.current.onChange("Entered a store"));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1));

    expect(onSave).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("Entered a store");
  });

  it("saves right away when the box loses focus", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderAutosave({ value: null, onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange("Entered a store"));
    await act(async () => result.current.onBlur());

    expect(onSave).toHaveBeenCalledWith("Entered a store");

    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("saves an emptied box as null", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderAutosave({ value: "Entered a store", onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange(""));
    await act(() => result.current.flush());

    expect(onSave).toHaveBeenCalledWith(null);
  });

  it("doesn't save when the PHI leaves the box unchanged", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderAutosave({ value: "Entered a store", onSave });

    act(() => result.current.onFocus());
    await act(async () => result.current.onBlur());

    expect(onSave).not.toHaveBeenCalled();
  });

  it("sends one save at a time, then the text typed during it", async () => {
    const first = deferredSave();
    const onSave = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(undefined);
    const { result } = renderAutosave({ value: null, onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange("Entered"));
    let firstFlush: Promise<void> = Promise.resolve();
    act(() => {
      firstFlush = result.current.flush();
    });
    act(() => result.current.onChange("Entered a store"));
    let secondFlush: Promise<void> = Promise.resolve();
    act(() => {
      secondFlush = result.current.flush();
    });

    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      first.resolve();
      await Promise.all([firstFlush, secondFlush]);
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith("Entered a store");
  });

  it("keeps the PHI's text while the box has focus", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderAutosave({ value: null, onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange("Entered a store"));
    await act(() => result.current.flush());
    act(() => result.current.onChange("Entered a store at night"));
    // The report listener sends the first save back while the PHI types.
    rerender({ value: "Entered a store", onSave });

    expect(result.current.text).toBe("Entered a store at night");
  });

  it("shows the saved value once the box loses focus with nothing unsaved", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderAutosave({ value: null, onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange("Entered a store"));
    await act(async () => result.current.onBlur());
    // Another tab edits the field.
    rerender({ value: "Entered a store at night", onSave });

    expect(result.current.text).toBe("Entered a store at night");
  });

  it("keeps unsaved text after a failed save, and the next save tries again", async () => {
    const onSave = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const { result } = renderAutosave({ value: null, onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange("Entered a store"));
    await act(async () => result.current.onBlur());

    expect(result.current.saveFailed).toBe(true);
    expect(result.current.text).toBe("Entered a store");

    await act(() => result.current.flush());

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith("Entered a store");
    expect(result.current.saveFailed).toBe(false);
  });

  it("rejects flush when the save fails, so a section can stop a removal", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("offline"));
    const { result } = renderAutosave({ value: null, onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange("Entered a store"));

    await act(async () => {
      await expect(result.current.flush()).rejects.toThrow("offline");
    });
    expect(result.current.saveFailed).toBe(true);
    expect(result.current.text).toBe("Entered a store");
  });

  // Vitest fails the run on an unhandled rejection, so these also check that
  // the saves the hook starts itself catch their failures.
  it("shows a failed save after a pause without an unhandled rejection", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("offline"));
    const { result } = renderAutosave({ value: null, onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange("Entered a store"));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));

    expect(result.current.saveFailed).toBe(true);
  });

  it("tries a failed save once more when it unmounts, without an unhandled rejection", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("offline"));
    const { result, unmount } = renderAutosave({ value: null, onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange("Entered a store"));
    await act(async () => result.current.onBlur());
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it("saves unsaved text right away when it unmounts", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderAutosave({ value: null, onSave });

    act(() => result.current.onFocus());
    act(() => result.current.onChange("Entered a store"));
    unmount();

    expect(onSave).toHaveBeenCalledWith("Entered a store");
  });
});
