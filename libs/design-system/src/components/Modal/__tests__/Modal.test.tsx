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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReactModal from "react-modal";

import { Modal, ModalHeading } from "../Modal";

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

const getOverlay = (): HTMLElement =>
  document.querySelector(".ReactModal__Overlay") as HTMLElement;

const getContent = (): HTMLElement =>
  document.querySelector(".ReactModal__Content") as HTMLElement;

describe("Modal", () => {
  it("renders nothing when isOpen is false", () => {
    render(<Modal isOpen={false}>content</Modal>);
    expect(getContent()).toBeNull();
  });

  it("renders children in a portal when isOpen is true", () => {
    render(
      <Modal isOpen>
        <div>hello</div>
      </Modal>,
    );
    expect(getContent()).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("exposes contentLabel as the content aria-label", () => {
    render(
      <Modal isOpen contentLabel="My modal">
        content
      </Modal>,
    );
    expect(getContent().getAttribute("aria-label")).toBe("My modal");
  });

  it("calls onRequestClose when ESC is pressed", () => {
    const onRequestClose = vi.fn();
    render(
      <Modal isOpen onRequestClose={onRequestClose}>
        content
      </Modal>,
    );
    fireEvent.keyDown(getContent(), {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
    });
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("calls onRequestClose when the overlay is clicked", () => {
    const onRequestClose = vi.fn();
    render(
      <Modal isOpen onRequestClose={onRequestClose}>
        content
      </Modal>,
    );
    fireEvent.click(getOverlay());
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onRequestClose when modal content is clicked", () => {
    const onRequestClose = vi.fn();
    render(
      <Modal isOpen onRequestClose={onRequestClose}>
        <button data-testid="child">child</button>
      </Modal>,
    );
    fireEvent.mouseDown(screen.getByTestId("child"));
    fireEvent.click(screen.getByTestId("child"));
    expect(onRequestClose).not.toHaveBeenCalled();
  });

  it("locks body scroll while open and restores it on close", async () => {
    document.body.style.overflow = "auto";
    const { rerender } = render(
      <Modal isOpen={false} closeTimeoutMS={0}>
        content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("auto");
    rerender(
      <Modal isOpen closeTimeoutMS={0}>
        content
      </Modal>,
    );
    // the scroll lock engages in onAfterOpen, which react-modal defers to
    // the next animation frame
    await waitFor(() => expect(document.body.style.overflow).toBe("hidden"));
    rerender(
      <Modal isOpen={false} closeTimeoutMS={0}>
        content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("auto");
  });

  it("skips the scroll lock when disableBackgroundScroll is false", async () => {
    document.body.style.overflow = "auto";
    const onAfterOpen = vi.fn();
    render(
      <Modal isOpen disableBackgroundScroll={false} onAfterOpen={onAfterOpen}>
        content
      </Modal>,
    );
    await waitFor(() => expect(onAfterOpen).toHaveBeenCalled());
    expect(document.body.style.overflow).toBe("auto");
  });

  it("invokes the onAfterOpen and onAfterClose passthroughs", async () => {
    const onAfterOpen = vi.fn();
    const onAfterClose = vi.fn();
    const { rerender } = render(
      <Modal
        isOpen={false}
        closeTimeoutMS={0}
        onAfterOpen={onAfterOpen}
        onAfterClose={onAfterClose}
      >
        content
      </Modal>,
    );
    rerender(
      <Modal
        isOpen
        closeTimeoutMS={0}
        onAfterOpen={onAfterOpen}
        onAfterClose={onAfterClose}
      >
        content
      </Modal>,
    );
    await waitFor(() => expect(onAfterOpen).toHaveBeenCalledTimes(1));
    rerender(
      <Modal
        isOpen={false}
        closeTimeoutMS={0}
        onAfterOpen={onAfterOpen}
        onAfterClose={onAfterClose}
      >
        content
      </Modal>,
    );
    expect(onAfterClose).toHaveBeenCalledTimes(1);
  });

  it("ModalHeading renders as an h3", () => {
    render(<ModalHeading>Title</ModalHeading>);
    const heading = screen.getByText("Title");
    expect(heading.tagName).toBe("H3");
  });
});
