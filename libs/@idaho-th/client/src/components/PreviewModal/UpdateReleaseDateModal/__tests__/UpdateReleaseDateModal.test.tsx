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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import toast from "react-hot-toast";

import { RELEASE_DATE_IN_PAST_ERROR } from "~@idaho-th/shared";

import { UpdateReleaseDateModal } from "../UpdateReleaseDateModal";

const testDoubles = vi.hoisted(() => ({
  updateHousingApplication: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../../../hooks/housingApplication", () => ({
  useUpdateHousingApplication: () => ({
    mutate: testDoubles.updateHousingApplication,
    isPending: false,
  }),
}));

/**
 * 10:30pm Mountain on 2026-09-10 — which is already 2026-09-11 both in UTC and
 * in the suite's America/New_York timezone. Freezing here proves the rule is
 * measured in Mountain time: a browser-clock implementation would reject
 * 09/10/2026, the very day the calendar still offers.
 */
const FROZEN_NOW = new Date("2026-09-11T04:30:00Z");

// 8 days before TODAY_DATE — one day past the 7-day grace period, so it is
// still rejected.
const PAST_DATE = "09/02/2026";
// Within the 7-day grace period (1 day before TODAY_DATE), so it is accepted.
const WITHIN_GRACE_PERIOD_DATE = "09/09/2026";
const TODAY_DATE = "09/10/2026";
const FUTURE_DATE = "10/20/2026";
const PAST_DATE_MESSAGE = "Release date can't be more than 7 days in the past.";
const RELEASE_DATE_INVALID = "Enter a valid date.";

const applicationId = "application-1";

function renderModal(
  overrides: Partial<Parameters<typeof UpdateReleaseDateModal>[0]> = {},
) {
  const onClose = vi.fn();
  const result = render(
    <UpdateReleaseDateModal
      isOpen
      onClose={onClose}
      applicationId={applicationId}
      currentDate="01/01/2027"
      {...overrides}
    />,
  );
  return { onClose, ...result };
}

const dateInput = () => screen.getByLabelText("Release date");

const submitButton = () =>
  screen.getByRole("button", { name: "Update", hidden: true });

// The modal marks everything outside itself aria-hidden, and the calendar
// renders into a portal outside it — hence `hidden: true` throughout.
const dayCell = (name: string) =>
  screen.getByRole("gridcell", { name, hidden: true });

const findDayCell = (name: string) =>
  screen.findByRole("gridcell", { name, hidden: true });

async function enterDate(
  user: ReturnType<typeof userEvent.setup>,
  date: string,
) {
  const input = dateInput();
  await user.clear(input);
  await user.type(input, date);
}

describe("UpdateReleaseDateModal", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // `shouldAdvanceTime` is required, not incidental: plain fake timers
    // deadlock user-event's internal delays, and these tests are built on it.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(FROZEN_NOW);
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    testDoubles.updateHousingApplication.mockReset();
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.success).mockReset();

    testDoubles.updateHousingApplication.mockImplementation(
      (_variables, options) => {
        options?.onSuccess?.();
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows guidance for an unknown exact date in a tooltip", async () => {
    renderModal();

    await user.hover(
      screen.getByText("Release date").nextElementSibling as HTMLElement,
    );
    expect(
      await screen.findByText(
        /If you don't know the exact date, pick the 1st of the month\. You can update this later\./,
      ),
    ).toBeInTheDocument();
  });

  describe("calendar", () => {
    // An empty field opens the calendar on the current month, which is where
    // the cutoff is visible.
    const renderEmptyModal = () => renderModal({ currentDate: null });

    it("offers today, every later day, and up to 7 days back — marking anything further back unavailable", async () => {
      renderEmptyModal();

      await user.click(dateInput());

      expect(
        await findDayCell("Not available Wednesday, September 2nd, 2026"),
      ).toBeInTheDocument();
      expect(
        dayCell("Not available Tuesday, September 1st, 2026"),
      ).toBeInTheDocument();
      expect(
        dayCell("Choose Thursday, September 3rd, 2026"),
      ).toBeInTheDocument();
      expect(
        dayCell("Choose Wednesday, September 9th, 2026"),
      ).toBeInTheDocument();
      expect(
        dayCell("Choose Thursday, September 10th, 2026"),
      ).toBeInTheDocument();
      expect(
        dayCell("Choose Friday, September 11th, 2026"),
      ).toBeInTheDocument();
      expect(
        dayCell("Choose Wednesday, September 30th, 2026"),
      ).toBeInTheDocument();
    });

    it("fills the field from a chosen day", async () => {
      renderEmptyModal();

      await user.click(dateInput());
      await user.click(
        await findDayCell("Choose Tuesday, September 15th, 2026"),
      );

      expect(dateInput()).toHaveValue("09/15/2026");
    });
  });

  describe("a typed past date", () => {
    it("says nothing while it is still being typed", async () => {
      renderModal();

      await enterDate(user, PAST_DATE);

      expect(dateInput()).toHaveValue(PAST_DATE);
      expect(screen.queryByText(PAST_DATE_MESSAGE)).not.toBeInTheDocument();
      expect(dateInput()).toHaveAttribute("aria-invalid", "false");
      expect(submitButton()).toBeEnabled();
    });

    it("explains the rule once Submit is pressed", async () => {
      renderModal();

      await enterDate(user, PAST_DATE);
      await user.click(submitButton());

      expect(dateInput()).toHaveValue(PAST_DATE);
      expect(screen.getByText(PAST_DATE_MESSAGE)).toBeInTheDocument();
      expect(dateInput()).toHaveAttribute("aria-invalid", "true");
    });

    it("describes the input with the message, so a screen reader reaches it", async () => {
      renderModal();

      await enterDate(user, PAST_DATE);
      await user.click(submitButton());

      const describedBy = dateInput().getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy as string)).toHaveTextContent(
        PAST_DATE_MESSAGE,
      );
    });

    it("clears the message as soon as the date is edited again", async () => {
      renderModal();

      await enterDate(user, PAST_DATE);
      await user.click(submitButton());
      expect(screen.getByText(PAST_DATE_MESSAGE)).toBeInTheDocument();

      await enterDate(user, FUTURE_DATE);

      expect(screen.queryByText(PAST_DATE_MESSAGE)).not.toBeInTheDocument();
      expect(dateInput()).toHaveAttribute("aria-invalid", "false");
      expect(submitButton()).toBeEnabled();
    });

    it("writes nothing when Submit is pressed", async () => {
      renderModal();

      await enterDate(user, PAST_DATE);
      await user.click(submitButton());

      expect(testDoubles.updateHousingApplication).not.toHaveBeenCalled();
    });
  });

  describe("a typed invalid calendar date", () => {
    // Matches the MM/dd/yyyy shape but names no real day — month 13, day 45.
    const INVALID_DATE = "13/45/2026";
    const INVALID_DATE_MESSAGE = "Enter a valid date.";

    it("says nothing while it is still being typed", async () => {
      renderModal();

      await enterDate(user, INVALID_DATE);

      expect(dateInput()).toHaveValue(INVALID_DATE);
      expect(screen.queryByText(INVALID_DATE_MESSAGE)).not.toBeInTheDocument();
      expect(dateInput()).toHaveAttribute("aria-invalid", "false");
    });

    it("explains the problem once Submit is pressed", async () => {
      renderModal();

      await enterDate(user, INVALID_DATE);
      await user.click(submitButton());

      expect(dateInput()).toHaveValue(INVALID_DATE);
      expect(screen.getByText(INVALID_DATE_MESSAGE)).toBeInTheDocument();
      expect(dateInput()).toHaveAttribute("aria-invalid", "true");
    });

    it("does not also claim the date is in the past", async () => {
      renderModal();

      await enterDate(user, INVALID_DATE);
      await user.click(submitButton());

      expect(screen.queryByText(PAST_DATE_MESSAGE)).not.toBeInTheDocument();
    });

    it("writes nothing when Submit is pressed", async () => {
      renderModal();

      await enterDate(user, INVALID_DATE);
      await user.click(submitButton());

      expect(testDoubles.updateHousingApplication).not.toHaveBeenCalled();
    });

    it("clears the message as soon as the date is edited again", async () => {
      renderModal();

      await enterDate(user, INVALID_DATE);
      await user.click(submitButton());
      expect(screen.getByText(INVALID_DATE_MESSAGE)).toBeInTheDocument();

      await enterDate(user, FUTURE_DATE);

      expect(screen.queryByText(INVALID_DATE_MESSAGE)).not.toBeInTheDocument();
      expect(submitButton()).toBeEnabled();
    });
  });

  describe("an incomplete date", () => {
    const INCOMPLETE_DATE_MESSAGE = "Enter a complete date.";

    // Matches nothing in toCalendarDay: a mid-keystroke month/day, and a year
    // one digit short — the latter is the case that used to slip past the
    // Submit guard even though it still isn't a real, judgeable date.
    it.each(["09/1", "12/31/202"])(
      "explains the date is incomplete once Submit is pressed for %s",
      async (incompleteDate) => {
        renderModal();

        await enterDate(user, incompleteDate);
        expect(
          screen.queryByText(INCOMPLETE_DATE_MESSAGE),
        ).not.toBeInTheDocument();

        await user.click(submitButton());

        expect(dateInput()).toHaveValue(incompleteDate);
        expect(screen.getByText(INCOMPLETE_DATE_MESSAGE)).toBeInTheDocument();
        expect(screen.queryByText(PAST_DATE_MESSAGE)).not.toBeInTheDocument();
        expect(
          screen.queryByText(RELEASE_DATE_INVALID),
        ).not.toBeInTheDocument();
        expect(dateInput()).toHaveAttribute("aria-invalid", "true");
      },
    );

    it("writes nothing when Submit is pressed", async () => {
      renderModal();

      await enterDate(user, "12/31/202");
      await user.click(submitButton());

      expect(testDoubles.updateHousingApplication).not.toHaveBeenCalled();
    });

    it("clears the message as soon as the date is edited again", async () => {
      renderModal();

      await enterDate(user, "12/31/202");
      await user.click(submitButton());
      expect(screen.getByText(INCOMPLETE_DATE_MESSAGE)).toBeInTheDocument();

      await enterDate(user, FUTURE_DATE);

      expect(
        screen.queryByText(INCOMPLETE_DATE_MESSAGE),
      ).not.toBeInTheDocument();
      expect(submitButton()).toBeEnabled();
    });
  });

  describe("today", () => {
    it("is accepted even late in the Mountain evening", async () => {
      renderModal();

      await enterDate(user, TODAY_DATE);

      expect(screen.queryByText(PAST_DATE_MESSAGE)).not.toBeInTheDocument();
      expect(submitButton()).toBeEnabled();
    });
  });

  describe("a date within the 7-day grace period", () => {
    it("is accepted, not flagged as in the past", async () => {
      renderModal();

      await enterDate(user, WITHIN_GRACE_PERIOD_DATE);
      await user.click(submitButton());

      expect(screen.queryByText(PAST_DATE_MESSAGE)).not.toBeInTheDocument();
      expect(dateInput()).toHaveAttribute("aria-invalid", "false");
      expect(submitButton()).toBeEnabled();
    });

    it("is submitted to the server", async () => {
      renderModal();

      await enterDate(user, WITHIN_GRACE_PERIOD_DATE);
      await user.click(submitButton());

      expect(testDoubles.updateHousingApplication).toHaveBeenCalledWith(
        {
          id: applicationId,
          data: { expectedReleaseDate: "2026-09-09" },
        },
        expect.anything(),
      );
    });
  });

  describe("a future date", () => {
    it("submits the new date on its own, without formData", async () => {
      renderModal();

      await enterDate(user, FUTURE_DATE);
      await user.click(submitButton());

      expect(testDoubles.updateHousingApplication).toHaveBeenCalledWith(
        {
          id: applicationId,
          data: { expectedReleaseDate: "2026-10-20" },
        },
        expect.anything(),
      );
    });

    it("shows a success toast and closes on a successful update", async () => {
      const { onClose } = renderModal();

      await enterDate(user, FUTURE_DATE);
      await user.click(submitButton());

      expect(onClose).toHaveBeenCalled();
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        "Release date updated.",
      );
    });
  });

  describe("an application that already holds a past release date", () => {
    it("opens with nothing flagged", () => {
      renderModal({ currentDate: PAST_DATE });

      expect(screen.queryByText(PAST_DATE_MESSAGE)).not.toBeInTheDocument();
      expect(dateInput()).toHaveValue(PAST_DATE);
      expect(submitButton()).toBeEnabled();
    });

    it("still dismisses on Submit without writing the untouched date", async () => {
      const { onClose } = renderModal({ currentDate: PAST_DATE });

      await user.click(submitButton());

      expect(onClose).toHaveBeenCalled();
      expect(testDoubles.updateHousingApplication).not.toHaveBeenCalled();
    });
  });

  describe("a failed update", () => {
    function rejectWith(message: string) {
      testDoubles.updateHousingApplication.mockImplementation(
        (_variables, options) => {
          options?.onError?.(new Error(message));
        },
      );
    }

    it("renders the rejection inline instead of a toast", async () => {
      rejectWith(RELEASE_DATE_IN_PAST_ERROR);
      renderModal();

      await enterDate(user, FUTURE_DATE);
      await user.click(submitButton());

      // The client saw nothing wrong with this date, but wasRejectedByServer
      // only ever means one thing, so the hint falls back to the past-date copy.
      expect(screen.getByText(PAST_DATE_MESSAGE)).toBeInTheDocument();
      expect(screen.queryByText(RELEASE_DATE_INVALID)).not.toBeInTheDocument();
      expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
    });

    it("never puts the server's own message on screen", async () => {
      rejectWith(RELEASE_DATE_IN_PAST_ERROR);
      renderModal();

      await enterDate(user, FUTURE_DATE);
      await user.click(submitButton());

      expect(
        screen.queryByText(RELEASE_DATE_IN_PAST_ERROR),
      ).not.toBeInTheDocument();
    });

    it("keeps the existing failure toast for an unrelated error", async () => {
      rejectWith("Database is on fire");
      renderModal();

      await enterDate(user, FUTURE_DATE);
      await user.click(submitButton());

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "Failed to update release date.",
      );
      expect(screen.queryByText(PAST_DATE_MESSAGE)).not.toBeInTheDocument();
    });
  });

  it("has no accessibility violations while showing the past-date message", async () => {
    const { container } = renderModal();

    await enterDate(user, PAST_DATE);
    await user.click(submitButton());

    expect(await axe(container)).toHaveNoViolations();
  });
});
