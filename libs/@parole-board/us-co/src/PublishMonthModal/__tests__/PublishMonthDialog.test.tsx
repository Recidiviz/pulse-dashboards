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

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useRef, useState } from "react";
import ReactModal from "react-modal";

import { publishFailedMessage } from "../copy";
import { PublishMonthDialog } from "../PublishMonthDialog";
import {
  PublishMonthReview,
  PublishMonthReviewProps,
} from "../PublishMonthReview";
import { PublishMonthSkeleton } from "../PublishMonthSkeleton";

const MONTH = "September 2026";
const PUBLISH_DESCRIPTION = `${MONTH} goes live on the public calendar for board members, hearing officers and victim services. To change it later, click Edit month, which takes it off the public calendar until you publish again.`;
const PUBLISH_CONFIRM =
  "I have reviewed this month's calendar and confirm it is ready to publish to the public site.";
const ALREADY_PUBLISHED = `${MONTH} is already published.`;
const FAILURE = `${MONTH} wasn't published. The public calendar hasn't changed. Try again or contact Recidiviz support.`;

type HarnessProps = Partial<
  Omit<PublishMonthReviewProps, "confirmed" | "onConfirmedChange" | "dialogRef">
> & {
  initialConfirmed?: boolean;
  onClose?: () => void;
};

/**
 * The dialog and its body with the checkbox held in state, as the container
 * will hold it. Closing clears the checkbox, as the container will.
 */
function Harness({
  initialConfirmed = false,
  onClose = vi.fn(),
  submitting,
  ...rest
}: HarnessProps) {
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  return (
    <PublishMonthDialog
      isOpen
      monthLabel={MONTH}
      onClose={onClose}
      submitting={submitting}
      dialogRef={dialogRef}
    >
      <PublishMonthReview
        counts={{ entryDays: 13, entryCount: 37 }}
        holidayWarnings={[]}
        confirmed={confirmed}
        onConfirmedChange={setConfirmed}
        submitting={submitting}
        dialogRef={dialogRef}
        onCancel={vi.fn()}
        onPublish={vi.fn()}
        {...rest}
      />
    </PublishMonthDialog>
  );
}

function renderDialog(props: HarnessProps = {}) {
  const onClose = vi.fn();
  const onCancel = vi.fn();
  const onPublish = vi.fn();
  const view = render(
    <Harness
      onClose={onClose}
      onCancel={onCancel}
      onPublish={onPublish}
      {...props}
    />,
  );
  return { ...view, onClose, onCancel, onPublish, user: userEvent.setup() };
}

const publishButton = (name = "Publish calendar") =>
  screen.getByRole("button", { name });
const checkbox = () => screen.getByRole("checkbox");
// react-modal reads keyCode, which user-event doesn't set.
const pressEscape = (element: Element) =>
  fireEvent.keyDown(element, { key: "Escape", keyCode: 27 });

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

describe("PublishMonthDialog", () => {
  describe("copy", () => {
    it("shows the first-publish copy and the month's counts", () => {
      renderDialog();

      const dialog = screen.getByRole("dialog", { name: `Publish ${MONTH}` });
      expect(
        within(dialog).getByRole("heading", { name: `Publish ${MONTH}` }),
      ).toBeInTheDocument();
      expect(within(dialog).getByText(PUBLISH_DESCRIPTION)).toBeInTheDocument();
      expect(
        within(dialog).getByRole("row", { name: "Hearing days 13" }),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByRole("row", { name: "Hearings scheduled 37" }),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByRole("checkbox", { name: PUBLISH_CONFIRM }),
      ).not.toBeChecked();
      expect(
        within(dialog).getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
      expect(publishButton()).toBeInTheDocument();
    });

    it("builds the failure copy from the month", () => {
      expect(publishFailedMessage(MONTH)).toBe(FAILURE);
    });
  });

  describe("holiday warnings", () => {
    it("lists each entry on a holiday without blocking publishing", async () => {
      const { user, onPublish } = renderDialog({
        holidayWarnings: [
          {
            id: "a",
            label: "FCF",
            dateLabel: "September 7",
            holidayName: "Labor Day",
          },
          {
            id: "b",
            label: "ACC",
            dateLabel: "September 7",
            holidayName: "Labor Day",
          },
        ],
      });

      expect(
        screen.getByText("2 items fall on a state holiday"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("FCF · September 7 · Labor Day"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("ACC · September 7 · Labor Day"),
      ).toBeInTheDocument();
      // The warning is part of the review, not news, so it isn't announced.
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      await user.click(checkbox());
      await user.click(publishButton());
      expect(onPublish).toHaveBeenCalledOnce();
    });

    it("uses the singular for one entry", () => {
      renderDialog({
        holidayWarnings: [
          {
            id: "a",
            label: "FCF",
            dateLabel: "September 7",
            holidayName: "Labor Day",
          },
        ],
      });

      expect(
        screen.getByText("1 item falls on a state holiday"),
      ).toBeInTheDocument();
    });

    it("shows no warning when nothing falls on a holiday", () => {
      renderDialog();

      expect(screen.queryByText(/on a state holiday/)).not.toBeInTheDocument();
    });
  });

  describe("the confirm checkbox", () => {
    it("keeps the publish button disabled until the box is ticked", async () => {
      const { user, onPublish } = renderDialog();

      expect(publishButton()).toBeDisabled();
      await user.click(publishButton());
      expect(onPublish).not.toHaveBeenCalled();

      await user.click(checkbox());
      expect(checkbox()).toBeChecked();
      expect(publishButton()).toBeEnabled();
      await user.click(publishButton());
      expect(onPublish).toHaveBeenCalledOnce();

      await user.click(checkbox());
      expect(publishButton()).toBeDisabled();
    });

    it("toggles once from a click on the label", async () => {
      const { user } = renderDialog();

      await user.click(screen.getByText(PUBLISH_CONFIRM));
      expect(checkbox()).toBeChecked();
      await user.click(screen.getByText(PUBLISH_CONFIRM));
      expect(checkbox()).not.toBeChecked();
    });

    it("toggles from a click on the panel outside the checkbox", async () => {
      const { user } = renderDialog();
      const group = screen.getByRole("group", { name: "Publish confirmation" });

      // The group sits inside the panel, so a click on its padding lands on
      // the panel, outside the input and label.
      await user.click(group);
      expect(checkbox()).toBeChecked();
      await user.click(group);
      expect(checkbox()).not.toBeChecked();
    });

    it("toggles with Space", async () => {
      const { user } = renderDialog();

      checkbox().focus();
      await user.keyboard(" ");
      expect(checkbox()).toBeChecked();
    });

    it("doesn't publish on Enter, even when ticked: only the button publishes", async () => {
      const { user, onPublish } = renderDialog({ initialConfirmed: true });

      checkbox().focus();
      await user.keyboard("{Enter}");

      expect(onPublish).not.toHaveBeenCalled();
      expect(checkbox()).toBeChecked();
    });
  });

  describe("while publishing", () => {
    it("waits on the publish button and disables every control", async () => {
      const { user, onCancel } = renderDialog({
        initialConfirmed: true,
        submitting: true,
      });

      expect(publishButton()).toHaveAttribute("aria-busy", "true");
      expect(publishButton()).toBeDisabled();
      expect(checkbox()).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

      await user.click(screen.getByRole("group"));
      expect(checkbox()).toBeChecked();
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("holds focus on the dialog while the publish runs", () => {
      const { rerender } = renderDialog({ initialConfirmed: true });
      publishButton().focus();

      rerender(<Harness initialConfirmed submitting />);

      expect(screen.getByRole("dialog")).toHaveFocus();
    });

    it("ignores Escape", () => {
      const { onClose } = renderDialog({
        initialConfirmed: true,
        submitting: true,
      });

      pressEscape(checkbox());
      expect(onClose).not.toHaveBeenCalled();
    });

    it("returns focus to the publish button when a retryable publish fails", () => {
      const { rerender } = renderDialog({
        initialConfirmed: true,
        submitting: true,
      });

      rerender(<Harness initialConfirmed error={FAILURE} />);

      expect(publishButton()).toHaveFocus();
    });

    it("moves focus to the checkbox when the failure clears it", () => {
      const { rerender } = renderDialog({ submitting: true });

      rerender(<Harness error="The month changed." />);

      expect(checkbox()).toHaveFocus();
    });

    it("moves focus to Close when the failure can't be retried", () => {
      const { rerender } = renderDialog({
        initialConfirmed: true,
        submitting: true,
      });

      rerender(<Harness closeOnly error="Already published." />);

      expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    });
  });

  describe("errors", () => {
    it("announces the error between the content and the buttons", () => {
      renderDialog({ initialConfirmed: true, error: FAILURE });

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(FAILURE);
      expect(publishButton()).toHaveAccessibleDescription(FAILURE);
      // The checkbox stays ticked, so the editor can try again.
      expect(publishButton()).toBeEnabled();
      expect(
        checkbox().compareDocumentPosition(alert) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        alert.compareDocumentPosition(publishButton()) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("offers only Close when another tab already published the month", async () => {
      const { user, onCancel } = renderDialog({
        error: ALREADY_PUBLISHED,
        closeOnly: true,
      });

      expect(screen.getByRole("alert")).toHaveTextContent(ALREADY_PUBLISHED);
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
        "Close",
      ]);
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe("focus and closing", () => {
    it("takes focus when it opens and reaches the checkbox and both buttons by Tab", async () => {
      const { user } = renderDialog({ initialConfirmed: true });
      const dialog = screen.getByRole("dialog");

      await waitFor(() => expect(dialog).toHaveFocus());
      await user.tab();
      expect(checkbox()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
      await user.tab();
      expect(publishButton()).toHaveFocus();
    });

    it("closes on Escape", () => {
      const { onClose } = renderDialog();

      pressEscape(checkbox());
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("closes on a click outside the dialog, but not while publishing", () => {
      const { onClose, rerender } = renderDialog({ initialConfirmed: true });
      const overlay = () =>
        document.querySelector(".ReactModal__Overlay") as Element;

      rerender(<Harness onClose={onClose} submitting />);
      fireEvent.click(overlay());
      expect(onClose).not.toHaveBeenCalled();

      rerender(<Harness onClose={onClose} />);
      fireEvent.click(overlay());
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("calls onCancel from Cancel", async () => {
      const { user, onCancel, onClose } = renderDialog();

      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalledOnce();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("loading", () => {
    it("shows the heading and description over a skeleton with Cancel ready", async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(
        <PublishMonthDialog isOpen monthLabel={MONTH} onClose={vi.fn()}>
          <PublishMonthSkeleton onCancel={onCancel} />
        </PublishMonthDialog>,
      );

      expect(
        screen.getByRole("status", { name: "Loading the publish preview" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: `Publish ${MONTH}` }),
      ).toBeInTheDocument();
      expect(screen.getByText(PUBLISH_DESCRIPTION)).toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(publishButton()).toBeDisabled();
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe("accessibility", () => {
    it.each([false, true])(
      "has no axe violations with the box ticked: %s",
      async (initialConfirmed) => {
        renderDialog({
          initialConfirmed,
          holidayWarnings: [
            {
              id: "a",
              label: "FCF",
              dateLabel: "September 7",
              holidayName: "Labor Day",
            },
          ],
          error: FAILURE,
        });

        expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
      },
    );

    it("has no axe violations with only Close offered", async () => {
      renderDialog({ closeOnly: true, error: ALREADY_PUBLISHED });

      expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
    });

    it("has no axe violations while the preview loads", async () => {
      render(
        <PublishMonthDialog isOpen monthLabel={MONTH} onClose={vi.fn()}>
          <PublishMonthSkeleton onCancel={vi.fn()} />
        </PublishMonthDialog>,
      );

      expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
    });
  });
});
