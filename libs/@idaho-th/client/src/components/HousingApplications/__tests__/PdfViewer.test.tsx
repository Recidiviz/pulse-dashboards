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

import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import React from "react";

import { PdfViewer } from "../PdfViewer";

vi.mock("react-pdf", () => ({
  Document: ({ children }: { children: ReactNode }) => (
    <div data-testid="pdf-document">{children}</div>
  ),
  Page: ({
    pageNumber,
    width,
    scale,
  }: {
    pageNumber: number;
    width: number;
    scale: number;
  }) => (
    <div
      data-testid="pdf-page"
      data-page-number={pageNumber}
      data-width={width}
      data-scale={scale}
    />
  ),
  pdfjs: { GlobalWorkerOptions: {} },
}));

describe("PdfViewer", () => {
  it("renders loader when signedUrl is null", () => {
    render(<PdfViewer signedUrl={null} pageNumber={1} />);
    expect(screen.getByText(/Loading the page/i)).toBeInTheDocument();
  });

  it("renders a Page once container width is measured", async () => {
    const originalResizeObserver = window.ResizeObserver;
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "clientWidth",
    );

    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 800,
    });

    class ResizeObserverMock {
      observe = () => undefined;
      unobserve = () => undefined;
      disconnect = () => undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).ResizeObserver = ResizeObserverMock;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).ResizeObserver = ResizeObserverMock;

    try {
      render(
        <PdfViewer signedUrl="https://example.com/app.pdf" pageNumber={2} />,
      );

      const page = await screen.findByTestId("pdf-page");
      expect(page).toHaveAttribute("data-page-number", "2");
      expect(page).toHaveAttribute("data-width", "800");
    } finally {
      window.ResizeObserver = originalResizeObserver;
      globalThis.ResizeObserver = originalResizeObserver;
      if (originalDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          "clientWidth",
          originalDescriptor,
        );
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
      }
    }
  });

  it("updates width when ResizeObserver fires", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "clientWidth",
    );
    let clientWidth = 700;

    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get: () => clientWidth,
    });

    let capturedCallback: ResizeObserverCallback | null = null;
    class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) {
        capturedCallback = callback;
      }
      observe = () => undefined;
      unobserve = () => undefined;
      disconnect = () => undefined;
    }

    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
    globalThis.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;

    try {
      render(
        <PdfViewer signedUrl="https://example.com/app.pdf" pageNumber={1} />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("pdf-page")).toHaveAttribute(
          "data-width",
          "700",
        );
      });

      clientWidth = 900;

      await act(async () => {
        if (capturedCallback) capturedCallback([], {} as ResizeObserver);
      });

      await waitFor(() => {
        expect(screen.getByTestId("pdf-page")).toHaveAttribute(
          "data-width",
          "900",
        );
      });
    } finally {
      window.ResizeObserver = originalResizeObserver;
      globalThis.ResizeObserver = originalResizeObserver;
      if (originalDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          "clientWidth",
          originalDescriptor,
        );
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
      }
    }
  });
});
