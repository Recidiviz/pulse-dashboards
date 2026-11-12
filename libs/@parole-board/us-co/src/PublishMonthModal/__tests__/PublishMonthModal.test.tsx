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

import { QueryClient, useQuery } from "@tanstack/react-query";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import toast from "react-hot-toast";
import ReactModal from "react-modal";

import type { PublishPreview } from "~@parole-board/common";
import { useMonthQueryOptions } from "~@parole-board/common";
import {
  calendarApiConfig,
  calendarApiError,
  monthDetail,
  publishPreview,
} from "~@parole-board/common/fixtures";
import {
  createFakeCalendarTrpc,
  createFakeHost,
  FakeCalendarProcedures,
  renderWithHost,
} from "~@parole-board/common/testing";

import { PREVIEW_LOAD_ERROR_TITLE } from "../copy";
import { PublishMonthModal } from "../PublishMonthModal";

vi.mock("react-hot-toast", () => ({ default: vi.fn() }));

const MONTH = { id: "month-2026-9", year: 2026, month: 9 };
const PUBLISH_CONFIRM =
  "I have reviewed this month's calendar and confirm it is ready to publish to the public site.";
const FAILURE =
  "September 2026 wasn't published. The public calendar hasn't changed. Try again or contact Recidiviz support.";
const CONFLICT =
  "September 2026 changed since you opened this review. Check the updated counts and publish again.";
/** The publication of a month that Edit month has since taken back to DRAFT. */
const EARLIER_PUBLICATION = {
  publishedAt: new Date("2026-08-01T16:00:00Z"),
  publishedByEmail: "editor-a@example.com",
};

/**
 * months.publish's result, with the month as months.get reads it after the
 * publish.
 */
function publishResult(revision = 2) {
  return {
    monthId: MONTH.id,
    status: "PUBLISHED" as const,
    revision,
    month: monthDetail({
      ...MONTH,
      status: "PUBLISHED",
      revision,
      latestPublication: {
        publishedAt: new Date("2026-08-20T18:00:00Z"),
        publishedByEmail: "editor-a@example.com",
      },
    }),
  };
}

/** Reads the month, as the open month view does, so it's cached and active. */
function MonthReader() {
  useQuery(useMonthQueryOptions(MONTH));
  return null;
}

/**
 * The dialog behind an "Open" button, as the month header opens it. With
 * withMonth, the month view's read of the month sits beside it.
 */
function Harness({ withMonth = false }: { withMonth?: boolean }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      {withMonth && <MonthReader />}
      <button onClick={() => setIsOpen(true)}>Open</button>
      <PublishMonthModal
        isOpen={isOpen}
        month={MONTH}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

/**
 * Renders the dialog open on September 2026 against a fake calendar API.
 * Each procedure defaults to the never-published draft, publishing
 * successfully.
 */
function renderModal({
  procedures = {},
  withMonth = false,
}: { procedures?: FakeCalendarProcedures; withMonth?: boolean } = {}) {
  const calls = {
    preview: vi.fn((_input: unknown) => publishPreview()),
    publish: vi.fn((_input: unknown) => publishResult()),
    get: vi.fn((_input: unknown) => monthDetail({ ...MONTH })),
  };
  const calendarTrpc = createFakeCalendarTrpc({
    queryClient: new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    procedures: {
      "admin.config.get": () => calendarApiConfig,
      "admin.months.publishPreview": calls.preview,
      "admin.months.publish": calls.publish,
      "admin.months.get": calls.get,
      ...procedures,
    },
  });
  const host = createFakeHost({ calendarTrpc });
  const track = vi.spyOn(
    host.analyticsStore,
    "trackPbPublicCalendarMonthPublished",
  );
  const view = renderWithHost(<Harness withMonth={withMonth} />, {
    host,
  });
  return { ...view, calls, calendarTrpc, track, user: userEvent.setup() };
}

const checkbox = () => screen.getByRole("checkbox");
const publishButton = () =>
  screen.getByRole("button", { name: "Publish calendar" });
const dialog = () => screen.queryByRole("dialog");

/** Waits for the preview, ticks the box and presses the publish button. */
async function confirmAndPublish(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("checkbox"));
  await user.click(publishButton());
}

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

beforeEach(() => {
  // 2026-08-20, noon in Denver: 12 days before September starts.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-08-20T18:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PublishMonthModal", () => {
  describe("loading the preview", () => {
    it("shows the skeleton, then the preview's counts and the checkbox in one window", async () => {
      renderModal();

      expect(
        screen.getByLabelText("Loading the publish preview"),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("row", { name: "Hearing days 13" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("row", { name: "Hearings scheduled 37" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: PUBLISH_CONFIRM }),
      ).not.toBeChecked();
      expect(publishButton()).toBeDisabled();
    });

    it("shows a retryable error when the preview fails to load", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      let fail = true;
      const { user } = renderModal({
        procedures: {
          "admin.months.publishPreview": () => {
            if (fail) throw calendarApiError("INTERNAL_SERVER_ERROR", "boom");
            return publishPreview();
          },
        },
      });

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(PREVIEW_LOAD_ERROR_TITLE);
      expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();

      fail = false;
      await user.click(
        within(alert).getByRole("button", { name: "Try again" }),
      );
      expect(
        await screen.findByRole("row", { name: "Hearing days 13" }),
      ).toBeInTheDocument();
    });

    it("lists the entries that fall on a holiday, without blocking publishing", async () => {
      const { user, calls } = renderModal({
        procedures: {
          "admin.months.publishPreview": () =>
            publishPreview({
              holidayWarnings: [
                {
                  entryId: "entry-1",
                  date: "2026-09-07",
                  label: "FCF",
                  kind: "HEARING",
                  holidayName: "Labor Day",
                },
              ],
            }),
        },
      });

      expect(
        await screen.findByText("FCF · September 7 · Labor Day"),
      ).toBeInTheDocument();
      await confirmAndPublish(user);
      await waitFor(() => expect(calls.publish).toHaveBeenCalledOnce());
    });
  });

  describe("publishing", () => {
    it("publishes the revision the editor reviewed, then closes, toasts and tracks it once", async () => {
      const { user, calls, track } = renderModal({
        procedures: {
          "admin.months.publishPreview": () => publishPreview({ revision: 4 }),
        },
      });

      await confirmAndPublish(user);

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(calls.publish).toHaveBeenCalledExactlyOnceWith({
        monthId: MONTH.id,
        expectedRevision: 4,
      });
      expect(toast).toHaveBeenCalledWith("September 2026 is published.", {
        id: "pb-calendar-month-published",
      });
      expect(track).toHaveBeenCalledExactlyOnceWith({
        year: 2026,
        month: 9,
        hearingDays: 13,
        hearingCount: 37,
        holidayWarningCount: 0,
        isRepublish: false,
        daysBeforeMonthStart: 12,
      });
    });

    it("closes as soon as the publish succeeds, storing the returned month and reading no preview again", async () => {
      // A second read of the preview would never answer, so the dialog
      // would hang if it waited on one.
      const preview = vi
        .fn<(input: unknown) => PublishPreview | Promise<never>>()
        .mockReturnValueOnce(publishPreview())
        .mockReturnValue(new Promise<never>(() => undefined));
      const { user, calls, calendarTrpc } = renderModal({
        procedures: { "admin.months.publishPreview": preview },
      });

      await confirmAndPublish(user);

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(preview).toHaveBeenCalledOnce();
      expect(calls.get).not.toHaveBeenCalled();
      expect(
        calendarTrpc.queryClient.getQueryData(
          calendarTrpc.querier.admin.months.get.queryKey({
            year: 2026,
            month: 9,
          }),
        ),
      ).toMatchObject({ status: "PUBLISHED", revision: 2 });
    });

    it("doesn't publish on Enter in the ticked checkbox", async () => {
      const { user, calls } = renderModal();
      await user.click(await screen.findByRole("checkbox"));

      await user.keyboard("{Enter}");

      expect(calls.publish).not.toHaveBeenCalled();
      expect(dialog()).toBeInTheDocument();
    });

    it("republishes a month back in draft after Edit month", async () => {
      const { user, calls, track } = renderModal({
        procedures: {
          "admin.months.publishPreview": () =>
            publishPreview({
              revision: 6,
              latestPublication: EARLIER_PUBLICATION,
            }),
        },
      });

      expect(
        await screen.findByRole("dialog", { name: "Publish September 2026" }),
      ).toBeInTheDocument();
      await confirmAndPublish(user);

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(calls.publish).toHaveBeenCalledExactlyOnceWith({
        monthId: MONTH.id,
        expectedRevision: 6,
      });
      expect(toast).toHaveBeenCalledWith(
        "September 2026 is published.",
        expect.anything(),
      );
      expect(track).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ isRepublish: true }),
      );
    });

    it("shows a CONFLICT, the refreshed preview and a cleared checkbox, and publishes the new revision next", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const preview = vi
        .fn<(input: unknown) => PublishPreview>()
        .mockReturnValueOnce(publishPreview())
        .mockReturnValue(
          publishPreview({
            revision: 2,
            counts: { entryDays: 14, entryCount: 38 },
          }),
        );
      const publish = vi
        .fn()
        .mockImplementationOnce(() => {
          throw calendarApiError("CONFLICT", CONFLICT);
        })
        .mockReturnValue(publishResult(3));
      const { user, track } = renderModal({
        procedures: {
          "admin.months.publishPreview": preview,
          "admin.months.publish": publish,
        },
      });

      await confirmAndPublish(user);

      expect(await screen.findByRole("alert")).toHaveTextContent(CONFLICT);
      expect(
        await screen.findByRole("row", { name: "Hearing days 14" }),
      ).toBeInTheDocument();
      expect(preview).toHaveBeenCalledTimes(2);
      expect(checkbox()).not.toBeChecked();
      expect(publishButton()).toBeDisabled();
      expect(track).not.toHaveBeenCalled();

      await confirmAndPublish(user);
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(publish).toHaveBeenLastCalledWith({
        monthId: MONTH.id,
        expectedRevision: 2,
      });
      expect(track).toHaveBeenCalledOnce();
    });

    it.each([
      ["PRECONDITION_FAILED", "September 2026 is already published."],
      ["NOT_FOUND", "This month no longer exists."],
    ] as const)("offers only Close after %s", async (code, message) => {
      const { user, track } = renderModal({
        procedures: {
          "admin.months.publish": () => {
            throw calendarApiError(code, message);
          },
        },
      });

      await confirmAndPublish(user);

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Publish calendar" }),
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(track).not.toHaveBeenCalled();
    });

    it("shows the failure copy and keeps the checkbox when the server fails and the month didn't change", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const publish = vi
        .fn()
        .mockImplementationOnce(() => {
          throw calendarApiError("INTERNAL_SERVER_ERROR", "db down");
        })
        .mockReturnValue(publishResult());
      const { user, calls, track } = renderModal({
        procedures: { "admin.months.publish": publish },
      });

      await confirmAndPublish(user);

      expect(await screen.findByRole("alert")).toHaveTextContent(FAILURE);
      expect(calls.get).toHaveBeenCalledWith({ year: 2026, month: 9 });
      expect(checkbox()).toBeChecked();
      expect(track).not.toHaveBeenCalled();
      expect(toast).not.toHaveBeenCalled();

      await waitFor(() => expect(publishButton()).toBeEnabled());
      await user.click(publishButton());
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(track).toHaveBeenCalledOnce();
    });

    it("checks the month the failed publish refetched, without reading it again", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { user, calls } = renderModal({
        withMonth: true,
        procedures: {
          "admin.months.publish": () => {
            throw calendarApiError("INTERNAL_SERVER_ERROR", "db down");
          },
        },
      });
      await waitFor(() => expect(calls.get).toHaveBeenCalledOnce());

      await confirmAndPublish(user);

      expect(await screen.findByRole("alert")).toHaveTextContent(FAILURE);
      // The first read, and the failed publish's refetch.
      expect(calls.get).toHaveBeenCalledTimes(2);
    });

    it("treats a lost response as success when the month shows a newer publication", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { user, track } = renderModal({
        procedures: {
          "admin.months.publish": () => {
            throw new Error("Failed to fetch");
          },
          "admin.months.get": () =>
            monthDetail({
              ...MONTH,
              status: "PUBLISHED",
              latestPublication: {
                publishedAt: new Date("2026-08-20T18:00:00Z"),
                publishedByEmail: "editor-a@example.com",
              },
            }),
        },
      });

      await confirmAndPublish(user);

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(toast).toHaveBeenCalledWith(
        "September 2026 is published.",
        expect.anything(),
      );
      expect(track).toHaveBeenCalledOnce();
    });

    it("shows the failure copy when a republished month is still in draft after a network error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { user, track } = renderModal({
        procedures: {
          "admin.months.publishPreview": () =>
            publishPreview({
              revision: 6,
              latestPublication: EARLIER_PUBLICATION,
            }),
          "admin.months.publish": () => {
            throw new Error("Failed to fetch");
          },
          "admin.months.get": () =>
            monthDetail({
              ...MONTH,
              revision: 6,
              latestPublication: EARLIER_PUBLICATION,
            }),
        },
      });

      await confirmAndPublish(user);

      expect(await screen.findByRole("alert")).toHaveTextContent(FAILURE);
      expect(track).not.toHaveBeenCalled();
    });

    it("shows the failure copy when the month can't be read after a network error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { user, track } = renderModal({
        procedures: {
          "admin.months.publish": () => {
            throw new Error("Failed to fetch");
          },
          "admin.months.get": () => {
            throw new Error("Failed to fetch");
          },
        },
      });

      await confirmAndPublish(user);

      expect(await screen.findByRole("alert")).toHaveTextContent(FAILURE);
      expect(track).not.toHaveBeenCalled();
    });
  });

  describe("closing", () => {
    it("clears the checkbox when Cancel closes the dialog and it opens again", async () => {
      const { user } = renderModal();

      await user.click(await screen.findByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("checkbox")).not.toBeChecked();
    });

    it("reads the preview again each time the dialog opens", async () => {
      const { user, calls } = renderModal();
      await screen.findByRole("checkbox");

      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));

      await screen.findByRole("checkbox");
      expect(calls.preview).toHaveBeenCalledTimes(2);
    });

    it("closes on Escape and clears the checkbox", async () => {
      const { user } = renderModal();

      await user.click(await screen.findByRole("checkbox"));
      // react-modal reads keyCode, which user-event doesn't set.
      fireEvent.keyDown(screen.getByRole("dialog"), {
        key: "Escape",
        keyCode: 27,
      });
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("checkbox")).not.toBeChecked();
    });
  });

  describe("accessibility", () => {
    it("has no axe violations with the checkbox unticked and ticked", async () => {
      const { user } = renderModal();
      await screen.findByRole("checkbox");

      expect(await axe(document.body)).toHaveNoViolations();
      await user.click(checkbox());
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });
});
