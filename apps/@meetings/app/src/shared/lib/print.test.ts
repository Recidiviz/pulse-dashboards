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

import { JSDOM } from "jsdom";

import { escapeHtml, printHtmlDocument } from "./print";

// The RN test environment has no DOM, so back DOMPurify with jsdom
jest.mock("dompurify", () => {
  const { JSDOM: MockJSDOM } = jest.requireActual("jsdom");
  const createDOMPurify = jest.requireActual("dompurify");
  return {
    __esModule: true,
    default: createDOMPurify(new MockJSDOM("").window),
  };
});

describe("escapeHtml", () => {
  it("leaves plain text alone", () => {
    expect(escapeHtml("Met with the client on Tuesday.")).toBe(
      "Met with the client on Tuesday.",
    );
  });

  it("escapes angle brackets so markup renders as text", () => {
    expect(escapeHtml("<b>note</b>")).toBe("&lt;b&gt;note&lt;/b&gt;");
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("Smith & Sons")).toBe("Smith &amp; Sons");
  });

  it("escapes the ampersand before the brackets, not after", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});

describe("printHtmlDocument", () => {
  it("strips scripts and event handlers from unescaped markup", () => {
    const printDocument = new JSDOM("").window.document;
    (window as unknown as { open: unknown }).open = jest.fn(() => ({
      document: printDocument,
      focus: jest.fn(),
      print: jest.fn(),
      close: jest.fn(),
    }));

    printHtmlDocument({
      title: "Test",
      body: `<p>kept</p><img src=x onerror=window.__xss=1><svg onload=window.__xss=1></svg><script>window.__xss=1</script>`,
    });

    expect(
      printDocument.body.querySelectorAll(
        "[onerror], [onload], script, img[onerror]",
      ),
    ).toHaveLength(0);
    expect(printDocument.body.textContent).toBe("kept");
  });
});
