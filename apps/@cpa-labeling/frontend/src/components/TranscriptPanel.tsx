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

import { forwardRef } from "react";

import type { TranscriptMessage } from "../types";

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
  highlightSection?: string | null;
}

const TranscriptPanel = forwardRef<HTMLDivElement, TranscriptPanelProps>(
  ({ messages, highlightSection }, ref) => {
    if (messages.length === 0) {
      return <div className="empty-content">No transcript messages</div>;
    }

    // Pre-compute which messages start a new section
    const sectionStarts = new Set<number>();
    let prevSection: string | null = null;
    messages.forEach((msg, idx) => {
      if (msg.section && msg.section !== prevSection) {
        sectionStarts.add(idx);
      }
      if (msg.section) prevSection = msg.section;
    });

    return (
      <div className="transcript-messages" ref={ref}>
        {messages.map((message, index) => {
          const isNewSection = sectionStarts.has(index);

          const isHighlighted =
            highlightSection &&
            message.section
              ?.toLowerCase()
              .includes(highlightSection.toLowerCase());

          return (
            <div key={index}>
              {/* Section header marker */}
              {isNewSection && message.section && (
                <div
                  id={`transcript-section-${message.section.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  data-section={message.section}
                  className="transcript-section-header"
                >
                  {message.section}
                </div>
              )}
              <div
                className={`transcript-message ${message.role.toLowerCase()} ${isHighlighted ? "highlighted" : ""}`}
                data-section={message.section || undefined}
              >
                <div className="message-role">{message.role}</div>
                <div className="message-content">{message.content}</div>
                {message.section && (
                  <div className="message-section">
                    Section: {message.section}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

TranscriptPanel.displayName = "TranscriptPanel";

export default TranscriptPanel;
