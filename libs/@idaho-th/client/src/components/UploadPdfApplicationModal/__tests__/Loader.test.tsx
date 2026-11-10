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

import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Loader } from "../Loader";

vi.mock("../../assets/check.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../assets/sparkle-duo.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

const STAGES = [
  "1. Uploading document",
  "2. Detecting page orientation",
  "3. Extracting information",
] as const;

const UPLOAD_STAGE_MS = 5_000;
const SCANNING_STAGE_MS = 5_000;
const STAGE_DURATIONS_MS = [UPLOAD_STAGE_MS, SCANNING_STAGE_MS, 30_000];

const CATCH_UP_MS = 350;
const COMPLETION_ANIMATION_MS = 800;
const HOLD_MS = 700;
const PAINT_MS = 50;

const STAGE_BAR_TEST_IDS = ["stage-bar-0", "stage-bar-1", "stage-bar-2"];

/** Bars render in stage order (uploading, scanning, extracting). */
function getBarFills(): HTMLElement[] {
  return STAGE_BAR_TEST_IDS.map((testId) => screen.getByTestId(testId));
}

function renderLoader(
  props: { stageIndex: number; isProcessingComplete: boolean },
  onBarFilled: () => void,
) {
  return render(
    <Loader
      stages={STAGES}
      stageDurationsMs={STAGE_DURATIONS_MS}
      onBarFilled={onBarFilled}
      {...props}
    />,
  );
}

describe("Loader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("caps a stage's bar at 95% when its expected duration elapses with no incoming signal", () => {
    const onBarFilled = vi.fn();
    renderLoader({ stageIndex: 0, isProcessingComplete: false }, onBarFilled);

    act(() => {
      vi.advanceTimersByTime(PAINT_MS);
    });

    const [uploadBar] = getBarFills();
    expect(uploadBar).toHaveStyleRule("width", "95%");
    expect(uploadBar).toHaveStyleRule(
      "transition",
      `width ${UPLOAD_STAGE_MS}ms linear`,
    );

    // No terminating signal ever arrives — well past the stage's expected
    // duration, the bar must still be capped at 95%, not advanced to 100%.
    act(() => {
      vi.advanceTimersByTime(UPLOAD_STAGE_MS * 3);
    });

    expect(uploadBar).toHaveStyleRule("width", "95%");
    expect(screen.getByText("1. Uploading document")).toBeInTheDocument();
    expect(onBarFilled).not.toHaveBeenCalled();
  });

  test("catches up and advances promptly when a stage's terminating signal arrives before the cap", () => {
    const onBarFilled = vi.fn();
    const { rerender } = renderLoader(
      { stageIndex: 0, isProcessingComplete: false },
      onBarFilled,
    );

    act(() => {
      vi.advanceTimersByTime(PAINT_MS);
    });
    // Only a fifth of the upload stage's budget has elapsed.
    act(() => {
      vi.advanceTimersByTime(UPLOAD_STAGE_MS / 5);
    });

    rerender(
      <Loader
        stages={STAGES}
        stageDurationsMs={STAGE_DURATIONS_MS}
        stageIndex={1}
        isProcessingComplete={false}
        onBarFilled={onBarFilled}
      />,
    );

    // The active bar is frozen at roughly its elapsed fraction of the 95%
    // cap (~1/5 of the stage elapsed -> ~1/5 of 95%) rather than jumping
    // straight to 100%, proving the catch-up is a distinct fast-fill, not a
    // snap. Matches any value well below the cap, since exact elapsed time
    // has some rAF-driven jitter.
    const [uploadBar] = getBarFills();
    expect(uploadBar).toHaveStyleRule("width", /^([0-8]?\d)(\.\d+)?%$/);

    act(() => {
      vi.advanceTimersByTime(PAINT_MS);
    });
    expect(uploadBar).toHaveStyleRule("width", "100%");
    expect(uploadBar).toHaveStyleRule(
      "transition",
      `width ${CATCH_UP_MS}ms linear`,
    );

    act(() => {
      vi.advanceTimersByTime(CATCH_UP_MS);
    });

    expect(
      screen.getByText("2. Detecting page orientation"),
    ).toBeInTheDocument();
    const [, scanningBar] = getBarFills();
    expect(scanningBar).toHaveStyleRule("width", "95%");
    expect(scanningBar).toHaveStyleRule(
      "transition",
      `width ${SCANNING_STAGE_MS}ms linear`,
    );
    expect(onBarFilled).not.toHaveBeenCalled();
  });

  test("cascades through remaining stages when multiple signals arrive in a burst", () => {
    const onBarFilled = vi.fn();
    const { rerender } = renderLoader(
      { stageIndex: 0, isProcessingComplete: false },
      onBarFilled,
    );

    act(() => {
      vi.advanceTimersByTime(PAINT_MS);
    });

    // Extraction resolves while the UI is still showing the very first
    // stage — scanning and extracting are both skipped through in one burst.
    rerender(
      <Loader
        stages={STAGES}
        stageDurationsMs={STAGE_DURATIONS_MS}
        stageIndex={2}
        isProcessingComplete
        onBarFilled={onBarFilled}
      />,
    );

    // The cascade takes real time to march through each stage — it hasn't
    // reached the end yet after only a small slice of that time.
    act(() => {
      vi.advanceTimersByTime(PAINT_MS);
    });
    expect(screen.queryByText("Application ready")).not.toBeInTheDocument();
    expect(onBarFilled).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(
        (PAINT_MS + CATCH_UP_MS) * 3 + COMPLETION_ANIMATION_MS + HOLD_MS,
      );
    });

    expect(screen.getByText("Application ready")).toBeInTheDocument();
    expect(onBarFilled).toHaveBeenCalledTimes(1);
  });

  test("plays the checkmark/sweep/hold sequence and calls onBarFilled exactly once when extraction completes", () => {
    const onBarFilled = vi.fn();
    const { rerender } = renderLoader(
      { stageIndex: 0, isProcessingComplete: false },
      onBarFilled,
    );

    act(() => {
      vi.advanceTimersByTime(PAINT_MS);
    });

    rerender(
      <Loader
        stages={STAGES}
        stageDurationsMs={STAGE_DURATIONS_MS}
        stageIndex={1}
        isProcessingComplete={false}
        onBarFilled={onBarFilled}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(PAINT_MS + CATCH_UP_MS);
    });

    rerender(
      <Loader
        stages={STAGES}
        stageDurationsMs={STAGE_DURATIONS_MS}
        stageIndex={2}
        isProcessingComplete={false}
        onBarFilled={onBarFilled}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(PAINT_MS + CATCH_UP_MS);
    });
    expect(screen.getByText("3. Extracting information")).toBeInTheDocument();

    rerender(
      <Loader
        stages={STAGES}
        stageDurationsMs={STAGE_DURATIONS_MS}
        stageIndex={2}
        isProcessingComplete
        onBarFilled={onBarFilled}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(PAINT_MS + CATCH_UP_MS);
    });
    // The checkmark/"Application ready" moment plays as soon as the final
    // bar's catch-up finishes, but the hold before onBarFilled fires hasn't
    // elapsed yet.
    expect(screen.getByText("Application ready")).toBeInTheDocument();
    expect(onBarFilled).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(COMPLETION_ANIMATION_MS + HOLD_MS);
    });

    expect(screen.getByText("Application ready")).toBeInTheDocument();
    expect(onBarFilled).toHaveBeenCalledTimes(1);

    const bars = getBarFills();
    bars.forEach((bar) => {
      expect(bar).toHaveStyleRule("width", "100%");
    });
  });

  test("renders a single-stage loader (e.g. reopening a draft) without numbered steppers", () => {
    const onBarFilled = vi.fn();
    render(
      <Loader
        stages={["Opening application"]}
        stageDurationsMs={[UPLOAD_STAGE_MS]}
        stageIndex={0}
        isProcessingComplete={false}
        onBarFilled={onBarFilled}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(PAINT_MS);
    });

    expect(screen.getByText("Opening application")).toBeInTheDocument();
    expect(screen.queryByTestId("stage-bar-1")).not.toBeInTheDocument();
  });
});
