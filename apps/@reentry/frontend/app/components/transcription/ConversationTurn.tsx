// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

"use client";
import { ContentCut, PlayArrow } from "@mui/icons-material";
import { MenuItem, Popover, Select } from "@mui/material";
import type React from "react";
import { useRef, useState } from "react";

import { formatDuration } from "~@reentry/frontend/utils";
import { showErrorToast } from "~@reentry/frontend-shared";

interface ConversationTurnProps {
  turn: {
    id: string;
    role: string;
    content: string;
    startTime: string;
    endTime: string;
    duration: string;
    speakerTag: number;
    wordCount: number;
  };
  index: number;
  isActive: boolean;
  isSplitMode: boolean;
  getSpeakerColor: (role: string) => string;
  uniqueSpeakers: string[];
  onSpeakerChange: (index: number, speaker: string) => void;
  onTurnClick: (startTime: number) => void;
  onToggleSplitMode: (index: number) => void;
  onSplitTurn: (index: number, splitPoint: number) => void;
  enableEditing?: boolean;
  setRef: (el: HTMLDivElement | null) => void;
}

export const ConversationTurn: React.FC<ConversationTurnProps> = ({
  turn,
  index,
  isActive,
  isSplitMode,
  getSpeakerColor,
  uniqueSpeakers,
  onSpeakerChange,
  onTurnClick,
  onToggleSplitMode,
  onSplitTurn,
  enableEditing = true,
  setRef,
}) => {
  const [splitAnchorEl, setSplitAnchorEl] = useState<HTMLElement | null>(null);
  const [splitPosition, setSplitPosition] = useState(0);
  const [beforeText, setBeforeText] = useState("");
  const [afterText, setAfterText] = useState("");
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [showCursorIndicator, setShowCursorIndicator] = useState(false);
  const [popoverAlignment, setPopoverAlignment] = useState<"left" | "right">(
    "left",
  );
  const contentRef = useRef<HTMLDivElement>(null);

  const splitPopoverOpen = Boolean(splitAnchorEl);

  const formatTime = (timeString: string) => {
    const seconds = Number.parseFloat(timeString.replace("s", ""));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Track cursor position while hovering in split mode
  const handleContentMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSplitMode || !contentRef.current) return;

    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!range) {
      setCursorPosition(null);
      return;
    }

    const preRange = document.createRange();
    preRange.selectNodeContents(contentRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const position = preRange.toString().length;

    setCursorPosition(position);
    setShowCursorIndicator(true);
  };

  // Handle mouse enter/leave for cursor indicator
  const handleContentMouseEnter = () => {
    if (isSplitMode) {
      setShowCursorIndicator(true);
    }
  };

  const handleContentMouseLeave = () => {
    setShowCursorIndicator(false);
    setCursorPosition(null);
  };

  // Handle click to split in split mode
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSplitMode || !contentRef.current) return;

    // Get click position in text
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!range) return;

    const preRange = document.createRange();
    preRange.selectNodeContents(contentRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const position = preRange.toString().length;

    if (position === 0 || position === turn.content.length) {
      showErrorToast("Cannot split at the very beginning or end of the turn");
      return;
    }

    // Split text at position
    const before = turn.content.substring(0, position).trim();
    const after = turn.content.substring(position).trim();

    if (!before || !after) {
      showErrorToast("Cannot split: one side would be empty");
      return;
    }

    setBeforeText(before);
    setAfterText(after);
    setSplitPosition(position);

    // Determine if cursor is in the right 40% of the screen
    const screenWidth = window.innerWidth;
    const cursorXPercent = (e.clientX / screenWidth) * 100;
    const alignment = cursorXPercent > 60 ? "right" : "left";
    setPopoverAlignment(alignment);

    // Create an anchor element at the click position for the popover
    const anchorEl = document.createElement("div");
    anchorEl.style.position = "absolute";
    anchorEl.style.left = `${e.clientX}px`;
    anchorEl.style.top = `${e.clientY}px`;
    document.body.appendChild(anchorEl);

    setSplitAnchorEl(anchorEl);
  };

  // Close split popover
  const handleCloseSplitPopover = () => {
    if (splitAnchorEl) {
      document.body.removeChild(splitAnchorEl);
    }
    setSplitAnchorEl(null);
    setBeforeText("");
    setAfterText("");
    setSplitPosition(0);
  };

  // Confirm split
  const handleConfirmSplit = () => {
    onSplitTurn(index, splitPosition);
    handleCloseSplitPopover();
    onToggleSplitMode(index); // Deactivate split mode
  };

  const startTime = Number.parseFloat(turn.startTime.replace("s", ""));

  return (
    <>
      <div
        ref={setRef}
        className={`w-full bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 transition-all duration-300 ${
          isActive ? "ring-2 ring-[#006c67] ring-offset-2 shadow-lg" : ""
        } ${isSplitMode ? "ring-2 ring-[#006c67] ring-offset-2 shadow-lg" : ""}`}
        style={{ borderLeftColor: getSpeakerColor(turn.role) }}
      >
        <div className="p-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {enableEditing ? (
                <>
                  <Select
                    size="small"
                    value={turn.role}
                    onChange={(e) => onSpeakerChange(index, e.target.value)}
                    sx={{
                      minWidth: 120,
                      height: 28,
                      backgroundColor: getSpeakerColor(turn.role),
                      color: "white",
                      borderRadius: "9999px",
                      fontSize: "11px",
                      fontWeight: 500,
                      fontFamily: "'Public Sans', sans-serif",
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                      "& .MuiSelect-select": {
                        paddingY: "4px",
                        paddingX: "8px",
                        fontFamily: "'Public Sans', sans-serif",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                      "& .MuiSvgIcon-root": {
                        color: "white",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          fontFamily: "'Public Sans', sans-serif",
                          "& .MuiMenuItem-root": {
                            fontFamily: "'Public Sans', sans-serif",
                          },
                          "& .MuiList-root": {
                            fontFamily: "'Public Sans', sans-serif",
                          },
                        },
                      },
                    }}
                  >
                    {uniqueSpeakers.map((speaker) => (
                      <MenuItem key={speaker} value={speaker}>
                        {speaker}
                      </MenuItem>
                    ))}
                  </Select>

                  {/* Split Turn Button */}
                  <button
                    onClick={() => onToggleSplitMode(index)}
                    className={`p-1 rounded transition-colors ${
                      isSplitMode
                        ? "bg-[#006c67] text-white"
                        : "text-[#2b5469]/70 hover:bg-gray-100"
                    }`}
                    title={isSplitMode ? "Cancel split mode" : "Split turn"}
                  >
                    <ContentCut sx={{ fontSize: 16 }} />
                  </button>
                </>
              ) : (
                <div
                  className="px-3 py-1 rounded-full text-white text-xs font-medium font-['Public_Sans']"
                  style={{ backgroundColor: getSpeakerColor(turn.role) }}
                >
                  {turn.role}
                </div>
              )}
            </div>

            <div
              className="flex items-center gap-4 text-xs text-[#2a5469]/70 font-['Public_Sans'] cursor-pointer hover:text-[#006c67]"
              onClick={() => {
                console.log(
                  `[ConversationTurn] Turn clicked, seeking to ${startTime}s`,
                );
                onTurnClick(startTime);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onTurnClick(startTime);
                }
              }}
              title="Click to jump to this point in the audio"
            >
              <div className="flex items-center gap-1">
                <PlayArrow sx={{ fontSize: 14 }} className="text-[#006c67]" />
                <span>
                  {formatTime(turn.startTime)} - {formatTime(turn.endTime)}
                </span>
              </div>
              <span>
                {formatDuration(Number(turn.duration.replace("s", "")) * 1000)}
              </span>
            </div>
          </div>

          {/* Split mode instruction */}
          {isSplitMode && (
            <div className="mb-2 p-2 bg-[#e8f4f3] border border-[#006c67]/30 rounded text-xs text-[#006c67] font-['Public_Sans']">
              <div className="flex items-center gap-2">
                <ContentCut sx={{ fontSize: 14 }} />
                <div className="flex-1">
                  <strong>Split mode:</strong> Click where you want to split the
                  turn. You can change speaker roles after splitting.
                </div>
                {cursorPosition !== null && (
                  <span className="text-[#2b5469]/70">
                    Pos: {cursorPosition}
                  </span>
                )}
              </div>
            </div>
          )}

          <div
            ref={contentRef}
            className={`text-[#002321] text-sm font-medium font-['Public_Sans'] leading-[20px] relative ${
              isSplitMode ? "cursor-text" : "select-text cursor-text"
            }`}
            style={{ whiteSpace: "pre-wrap" }}
            onClick={isSplitMode ? handleContentClick : undefined}
            onMouseMove={isSplitMode ? handleContentMouseMove : undefined}
            onMouseEnter={isSplitMode ? handleContentMouseEnter : undefined}
            onMouseLeave={isSplitMode ? handleContentMouseLeave : undefined}
          >
            {isSplitMode && showCursorIndicator && cursorPosition !== null ? (
              <>
                <span>{turn.content.substring(0, cursorPosition)}</span>
                <span className="inline-block w-0.5 h-5 bg-[#006c67] animate-pulse relative -top-0.5" />
                <span>{turn.content.substring(cursorPosition)}</span>
              </>
            ) : (
              turn.content
            )}
          </div>
        </div>
      </div>

      {/* Split Confirmation Popover */}
      <Popover
        open={splitPopoverOpen}
        anchorEl={splitAnchorEl}
        onClose={handleCloseSplitPopover}
        anchorOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: popoverAlignment,
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            },
          },
        }}
      >
        <div className="p-3 min-w-[280px] max-w-[400px]">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <ContentCut sx={{ fontSize: 16, color: "#006c67" }} />
            <span className="text-[#002321] text-sm font-['Public_Sans'] font-semibold">
              Split turn here?
            </span>
          </div>

          {/* Compact Preview */}
          <div className="mb-3 space-y-1">
            <div className="flex items-start gap-2">
              <span className="text-[#2b5469]/60 text-xs font-['Public_Sans'] font-medium min-w-[30px]">
                1st:
              </span>
              <span className="text-[#002321] text-xs font-['Public_Sans'] line-clamp-2">
                {beforeText.length > 60
                  ? `${beforeText.substring(0, 60)}...`
                  : beforeText}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#2b5469]/60 text-xs font-['Public_Sans'] font-medium min-w-[30px]">
                2nd:
              </span>
              <span className="text-[#002321] text-xs font-['Public_Sans'] line-clamp-2">
                {afterText.length > 60
                  ? `${afterText.substring(0, 60)}...`
                  : afterText}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCloseSplitPopover}
              className="px-3 py-1.5 text-[#2b5469] rounded text-xs font-['Public_Sans'] font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSplit}
              className="px-3 py-1.5 bg-[#006c67] text-white rounded text-xs font-['Public_Sans'] font-medium hover:bg-[#005550] transition-colors"
            >
              Split
            </button>
          </div>
        </div>
      </Popover>
    </>
  );
};
