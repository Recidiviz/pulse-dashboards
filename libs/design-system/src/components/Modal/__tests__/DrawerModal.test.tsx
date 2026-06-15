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

import { fireEvent, render, screen } from "@testing-library/react";
import { rem } from "polished";
import ReactModal from "react-modal";

import { DrawerModal } from "../DrawerModal";

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

const getPortal = (): HTMLElement =>
  document.querySelector(".ReactModal__Overlay")?.parentElement as HTMLElement;

const getContent = (): HTMLElement =>
  document.querySelector(".ReactModal__Content") as HTMLElement;

describe("DrawerModal", () => {
  it("renders nothing when isOpen is false", () => {
    render(<DrawerModal isOpen={false}>content</DrawerModal>);
    expect(getContent()).toBeNull();
  });

  it("renders children when isOpen is true", () => {
    render(
      <DrawerModal isOpen>
        <div>hello</div>
      </DrawerModal>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders with the default width of 555", () => {
    render(<DrawerModal isOpen>content</DrawerModal>);
    expect(getPortal()).toHaveStyleRule("width", rem(555), {
      modifier: "&& .ReactModal__Content",
    });
  });

  it("renders with a custom width", () => {
    render(
      <DrawerModal isOpen width={800}>
        content
      </DrawerModal>,
    );
    expect(getPortal()).toHaveStyleRule("width", rem(800), {
      modifier: "&& .ReactModal__Content",
    });
  });

  it("calls onRequestClose when ESC is pressed", () => {
    const onRequestClose = vi.fn();
    render(
      <DrawerModal isOpen onRequestClose={onRequestClose}>
        content
      </DrawerModal>,
    );
    fireEvent.keyDown(getContent(), {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
    });
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });
});
