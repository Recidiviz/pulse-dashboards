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

import DOMPurify from "dompurify";

/**
 * Escapes text before it goes into a print document. Print bodies are assembled
 * as HTML strings, so anything the user or the model wrote has to be escaped or
 * it breaks the layout.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const PRINT_STYLES = `
  body { font-family: sans-serif; padding: 32px; color: #0D2B3A; }
  h1 { font-size: 24px; }
  h2 { font-size: 18px; margin-top: 32px; text-transform: uppercase; }
  h3 { font-size: 14px; margin: 16px 0 4px; font-weight: 500; color: #526C78; }
  p { font-size: 15px; margin: 0; white-space: pre-wrap; }
  p.muted { color: #9AA9B1; }
  p.notice { margin-top: 24px; padding: 8px 12px; border: 1px solid #E1E5E7; border-radius: 4px; }
  p.status { font-size: 13px; font-style: italic; color: #526C78; margin-bottom: 8px; }
  .tag { margin-left: 8px; padding: 2px 8px; border: 1px solid #E1E5E7; border-radius: 10px; font-size: 11px; font-weight: 500; color: #526C78; text-transform: none; vertical-align: middle; }
  ul { font-size: 15px; margin: 4px 0 0; padding-left: 20px; }
  table { border-collapse: collapse; margin-top: 4px; }
  th, td { border: 1px solid #E1E5E7; padding: 6px 12px; font-size: 14px; text-align: left; }
`;

export function printHtmlDocument({
  title,
  body,
}: {
  title: string;
  /**
   * HTML assembled by the caller. Sanitized here, but interpolated values
   * still need {@link escapeHtml} so they print as text.
   */
  body: string;
}) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.title = title;
  const style = printWindow.document.createElement("style");
  style.textContent = PRINT_STYLES;
  printWindow.document.head.appendChild(style);

  printWindow.document.body.innerHTML = DOMPurify.sanitize(body);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
