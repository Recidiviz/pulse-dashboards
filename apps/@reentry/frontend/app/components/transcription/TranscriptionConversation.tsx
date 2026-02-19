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
import {
  Add,
  Check,
  Close,
  Download,
  Edit,
  MergeType,
  Undo,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Popover,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { formatDuration } from "~@reentry/frontend/utils";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

import { ConversationTurn } from "./ConversationTurn";
import TranscriptionValidationWarnings from "./TranscriptionValidationWarnings";

interface TranscriptionViewProps {
  sessionId: string;
  currentAudioTime?: number;
  onTurnClick?: (startTime: number) => void;
  onActiveTurnChange?: (role: string | null) => void;
}

interface ConversationTurnType {
  id: string;
  role: string;
  content: string;
  startTime: string;
  endTime: string;
  startTimeMs: number;
  endTimeMs: number;
  duration: string;
  speakerTag: number;
  wordCount: number;
}

type RawConversationTurn = Omit<
  ConversationTurnType,
  "startTimeMs" | "endTimeMs"
>;

const TranscriptionConversation: React.FC<TranscriptionViewProps> = ({
  sessionId,
  currentAudioTime = 0,
  onTurnClick,
  onActiveTurnChange,
}) => {
  const auth = useAuth();
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(-1);
  const [modifiedConversation, setModifiedConversation] = useState<
    ConversationTurnType[] | null
  >(null);
  const [mergeAnchorEl, setMergeAnchorEl] = useState<HTMLElement | null>(null);
  const [sourceSpeaker, setSourceSpeaker] = useState("");
  const [targetSpeaker, setTargetSpeaker] = useState("");
  const [assignRolesAnchorEl, setAssignRolesAnchorEl] =
    useState<HTMLElement | null>(null);
  const [clientSpeaker, setClientSpeaker] = useState<string | null>(null);
  const [caseworkerSpeaker, setCaseworkerSpeaker] = useState<string | null>(
    null,
  );
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [manualSpeakers, setManualSpeakers] = useState<string[]>([]);
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [activeSplitTurnIndex, setActiveSplitTurnIndex] = useState<
    number | null
  >(null);
  const [history, setHistory] = useState<
    Array<{ conversation: ConversationTurnType[]; action: string }>
  >([]);
  const turnRefs = useRef<(HTMLDivElement | null | undefined)[]>([]);

  const mergePopoverOpen = Boolean(mergeAnchorEl);
  const assignRolesPopoverOpen = Boolean(assignRolesAnchorEl);

  const { data, error, isLoading } = $api.useQuery(
    "get",
    "/transcription/{recording_session_id}/transcription",
    {
      params: {
        path: {
          recording_session_id: sessionId || "",
        },
      },
      headers: {
        Authorization: `Bearer ${auth.getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    {
      enabled: !!sessionId,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  );

  // Transform conversation data to include millisecond timestamps
  const transformConversationData = (
    conversation: RawConversationTurn[],
  ): ConversationTurnType[] => {
    return conversation.map((turn) => {
      // Parse time strings like "12.345s" to milliseconds
      const startTimeMs = Math.round(
        parseFloat(turn.startTime.replace("s", "")) * 1000,
      );
      const endTimeMs = Math.round(
        parseFloat(turn.endTime.replace("s", "")) * 1000,
      );

      return {
        ...turn,
        startTimeMs,
        endTimeMs,
      };
    });
  };

  // Calculate speaker statistics
  const calculateSpeakerStats = (conversation: ConversationTurnType[]) => {
    const stats: Record<string, { turns: number; duration: string }> = {};

    conversation.forEach((turn) => {
      if (!stats[turn.role]) {
        stats[turn.role] = { turns: 0, duration: "0s" };
      }
      stats[turn.role].turns += 1;

      const currentDuration = Number.parseFloat(
        stats[turn.role].duration.replace("s", ""),
      );
      const turnDuration = Number.parseFloat(turn.duration.replace("s", ""));
      stats[turn.role].duration =
        `${(currentDuration + turnDuration).toFixed(1)}s`;
    });

    return stats;
  };

  // Initialize modified conversation when data loads
  useEffect(() => {
    if (data?.transcription?.conversation && !modifiedConversation) {
      const transformedConversation = transformConversationData(
        data.transcription.conversation,
      );
      setModifiedConversation(transformedConversation);
    }
  }, [data]);

  // Generate consistent colors for speakers
  const getSpeakerColor = (role: string) => {
    // Special colors for Client and Caseworker
    if (role.toLowerCase() === "client") {
      return "#1976d2"; // Blue
    }
    if (role.toLowerCase() === "caseworker") {
      return "#2e7d32"; // Green
    }

    const colors = [
      "#d32f2f", // Red
      "#f57c00", // Orange
      "#7b1fa2", // Purple
      "#0288d1", // Light Blue
      "#c2185b", // Pink
      "#5d4037", // Brown
      "#00897b", // Teal
      "#6d4c41", // Brown
    ];

    // Use hash of role to get consistent color
    let hash = 0;
    for (let i = 0; i < role.length; i++) {
      hash = role.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Save current state to history before making changes
  const saveToHistory = (actionDescription: string) => {
    if (!modifiedConversation) return;
    setHistory((prev) => [
      ...prev,
      { conversation: [...modifiedConversation], action: actionDescription },
    ]);
  };

  // Undo last action
  const handleUndo = () => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];
    setModifiedConversation(lastState.conversation);
    setHistory((prev) => prev.slice(0, -1));
    showSuccessToast(`Undid: ${lastState.action}`);
  };

  // Get unique speakers from conversation (including manual speakers)
  const uniqueSpeakers = useMemo(() => {
    if (!modifiedConversation) return manualSpeakers;
    const conversationSpeakers = Array.from(
      new Set(modifiedConversation.map((turn) => turn.role)),
    );
    // Combine and deduplicate to prevent manual speakers from appearing twice
    return Array.from(
      new Set([...conversationSpeakers, ...manualSpeakers]),
    ).sort();
  }, [modifiedConversation, manualSpeakers]);

  // Check if export is allowed (requires exactly one Client and one Caseworker)
  const canExport = useMemo(() => {
    const hasClient = uniqueSpeakers.some((s) => s.toLowerCase() === "client");
    const hasCaseworker = uniqueSpeakers.some(
      (s) => s.toLowerCase() === "caseworker",
    );
    return hasClient && hasCaseworker;
  }, [uniqueSpeakers]);

  // Initialize role assignments when popover opens
  useEffect(() => {
    if (assignRolesPopoverOpen && uniqueSpeakers.length > 0) {
      // Find existing Client and Caseworker speakers
      const client = uniqueSpeakers.find((s) => s.toLowerCase() === "client");
      const caseworker = uniqueSpeakers.find(
        (s) => s.toLowerCase() === "caseworker",
      );

      setClientSpeaker(client || null);
      setCaseworkerSpeaker(caseworker || null);

      // Initialize custom names for speakers that aren't Client or Caseworker
      const names: Record<string, string> = {};
      uniqueSpeakers.forEach((speaker) => {
        if (
          speaker.toLowerCase() !== "client" &&
          speaker.toLowerCase() !== "caseworker"
        ) {
          names[speaker] = "";
        }
      });
      setCustomNames(names);
    }
  }, [assignRolesPopoverOpen, uniqueSpeakers]);

  const exportTooltip = useMemo(() => {
    if (canExport) return "Save conversation changes";
    const hasClient = uniqueSpeakers.some((s) => s.toLowerCase() === "client");
    const hasCaseworker = uniqueSpeakers.some(
      (s) => s.toLowerCase() === "caseworker",
    );
    if (!hasClient && !hasCaseworker) {
      return "Please mark one speaker as Client and one as Caseworker before saving";
    }
    if (!hasClient) {
      return "Please mark one speaker as Client before saving";
    }
    if (!hasCaseworker) {
      return "Please mark one speaker as Caseworker before saving";
    }
    return "";
  }, [canExport, uniqueSpeakers]);

  // Handle role assignment (Client or Caseworker)
  const handleRoleToggle = (speaker: string, role: "Client" | "Caseworker") => {
    if (role === "Client") {
      // Toggle client assignment
      setClientSpeaker(clientSpeaker === speaker ? null : speaker);
    } else {
      // Toggle caseworker assignment
      setCaseworkerSpeaker(caseworkerSpeaker === speaker ? null : speaker);
    }
  };

  // Check if speaker has a role assigned
  const getSpeakerRole = (speaker: string): string | null => {
    if (clientSpeaker === speaker) return "Client";
    if (caseworkerSpeaker === speaker) return "Caseworker";
    return null;
  };

  // Check if speaker is manually added (not from conversation)
  const isManualSpeaker = (speaker: string): boolean => {
    return manualSpeakers.includes(speaker);
  };

  // Add a new manual speaker
  const handleAddSpeaker = () => {
    const trimmedName = newSpeakerName.trim();
    if (!trimmedName) return;

    if (uniqueSpeakers.includes(trimmedName)) {
      showErrorToast("A speaker with this name already exists");
      return;
    }

    setManualSpeakers([...manualSpeakers, trimmedName]);
    setNewSpeakerName("");
    showSuccessToast(`Speaker "${trimmedName}" added successfully`);
  };

  // Remove a manual speaker
  const handleRemoveSpeaker = (speaker: string) => {
    setManualSpeakers(manualSpeakers.filter((s) => s !== speaker));
    // Clear role assignments if this speaker had any
    if (clientSpeaker === speaker) setClientSpeaker(null);
    if (caseworkerSpeaker === speaker) setCaseworkerSpeaker(null);
  };

  // Apply speaker role assignments to conversation
  const handleApplyRenames = () => {
    if (!modifiedConversation) return;

    // Save current state to history
    saveToHistory("Assign speaker roles");

    // Create mapping of old names to new names
    const nameMapping: Record<string, string> = {};

    uniqueSpeakers.forEach((speaker) => {
      if (clientSpeaker === speaker) {
        nameMapping[speaker] = "Client";
      } else if (caseworkerSpeaker === speaker) {
        nameMapping[speaker] = "Caseworker";
      } else {
        // Keep original name if no role assigned and no custom name
        nameMapping[speaker] = customNames[speaker]?.trim() || speaker;
      }
    });

    // Apply renames
    const updated = modifiedConversation.map((turn) => ({
      ...turn,
      role: nameMapping[turn.role] || turn.role,
    }));

    setModifiedConversation(updated);
    setAssignRolesAnchorEl(null);
    showSuccessToast("Speaker roles applied successfully");
  };

  // Handle speaker reassignment for a specific turn
  const handleSpeakerChange = (turnIndex: number, newSpeaker: string) => {
    if (!modifiedConversation) return;

    const updated = [...modifiedConversation];
    updated[turnIndex] = { ...updated[turnIndex], role: newSpeaker };
    setModifiedConversation(updated);
  };

  // Toggle split mode for a specific turn (only one at a time)
  const handleToggleSplitMode = (turnIndex: number) => {
    setActiveSplitTurnIndex((prev) => (prev === turnIndex ? null : turnIndex));
  };

  // Split a turn at the specified position
  const handleSplitTurn = (turnIndex: number, splitPoint: number) => {
    if (!modifiedConversation) return;

    // Save current state to history
    saveToHistory("Split turn");

    const turn = modifiedConversation[turnIndex];

    // Extract text before and after split point
    const beforeText = turn.content.substring(0, splitPoint).trim();
    const afterText = turn.content.substring(splitPoint).trim();

    if (!beforeText || !afterText) {
      showErrorToast("Cannot split: one side would be empty");
      return;
    }
    console.log(turn);
    // Calculate time split based on character position ratio
    // Use the original untrimmed split point for more accurate timing
    const totalChars = turn.content.length;
    const splitRatio = splitPoint / totalChars;

    const startTimeMs = turn.startTimeMs;
    const endTimeMs = turn.endTimeMs;
    const totalDurationMs = endTimeMs - startTimeMs;
    console.log(startTimeMs, endTimeMs, totalDurationMs);
    // Calculate the split time point
    const splitTimeMs = Math.round(startTimeMs + totalDurationMs * splitRatio);
    console.log(splitTimeMs);

    // Find a different speaker for the second turn
    const currentSpeaker = turn.role;
    const otherSpeakers = uniqueSpeakers.filter((s) => s !== currentSpeaker);
    const newSpeaker =
      otherSpeakers.length > 0 ? otherSpeakers[0] : currentSpeaker;

    // Create first turn (before split)
    const beforeTurn: ConversationTurnType = {
      ...turn,
      id: `${turn.id}_split_1`,
      content: beforeText,
      startTime: turn.startTime, // Keep original start
      startTimeMs: startTimeMs,
      endTime: `${(splitTimeMs / 1000).toFixed(3)}s`,
      endTimeMs: splitTimeMs,
      duration: `${((splitTimeMs - startTimeMs) / 1000).toFixed(1)}s`,
      wordCount: beforeText.split(/\s+/).filter((w) => w.length > 0).length,
    };

    // Create second turn (after split) with different speaker
    const afterTurn: ConversationTurnType = {
      ...turn,
      id: `${turn.id}_split_2`,
      role: newSpeaker, // Assign to different speaker
      content: afterText,
      startTime: `${(splitTimeMs / 1000).toFixed(3)}s`,
      startTimeMs: splitTimeMs,
      endTime: turn.endTime, // Keep original end
      endTimeMs: endTimeMs,
      duration: `${((endTimeMs - splitTimeMs) / 1000).toFixed(1)}s`,
      wordCount: afterText.split(/\s+/).filter((w) => w.length > 0).length,
    };
    console.log(beforeTurn, afterTurn);
    const updated = [...modifiedConversation];
    updated.splice(turnIndex, 1, beforeTurn, afterTurn);
    setModifiedConversation(updated);
  };

  // Handle merging two speakers
  const handleMergeSpeakers = () => {
    if (!modifiedConversation || !sourceSpeaker || !targetSpeaker) return;

    // Prevent merging Caseworker with Client
    const isSourceCaseworker = sourceSpeaker.toLowerCase() === "caseworker";
    const isSourceClient = sourceSpeaker.toLowerCase() === "client";
    const isTargetCaseworker = targetSpeaker.toLowerCase() === "caseworker";
    const isTargetClient = targetSpeaker.toLowerCase() === "client";

    if (
      (isSourceCaseworker && isTargetClient) ||
      (isSourceClient && isTargetCaseworker)
    ) {
      showErrorToast(
        "Cannot merge Caseworker with Client. These are special roles that must remain separate.",
      );
      return;
    }

    // Save current state to history
    saveToHistory(`Merge "${sourceSpeaker}" into "${targetSpeaker}"`);

    const updated = modifiedConversation.map((turn) => ({
      ...turn,
      role: turn.role === sourceSpeaker ? targetSpeaker : turn.role,
    }));

    setModifiedConversation(updated);
    setMergeAnchorEl(null);
    setSourceSpeaker("");
    setTargetSpeaker("");
    showSuccessToast(
      `Successfully merged "${sourceSpeaker}" into "${targetSpeaker}"`,
    );
  };

  // Export modifications as JSON
  const handleExport = () => {
    if (!modifiedConversation || !data) return;

    const exportData = {
      ...data.transcription,
      conversation: modifiedConversation,
      metadata: {
        ...data.transcription.metadata,
        speakers: calculateSpeakerStats(modifiedConversation),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcription-${sessionId}-modified.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Find and focus on the active conversation turn based on current audio time
  useEffect(() => {
    if (!modifiedConversation) return;

    // Find the turn that contains the current audio time
    const activeIndex = modifiedConversation.findIndex((turn) => {
      const startTime = Number.parseFloat(turn.startTime.replace("s", ""));
      const endTime = Number.parseFloat(turn.endTime.replace("s", ""));
      return currentAudioTime >= startTime && currentAudioTime <= endTime;
    });

    if (activeIndex !== -1 && activeIndex !== activeTurnIndex) {
      setActiveTurnIndex(activeIndex);

      // Notify parent of active turn change
      const activeTurn = modifiedConversation[activeIndex];
      onActiveTurnChange?.(activeTurn.role);

      // Scroll the active turn into view
      const activeElement = turnRefs.current[activeIndex];
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } else if (activeIndex === -1 && activeTurnIndex !== -1) {
      // No active turn, clear the highlight
      setActiveTurnIndex(-1);
      onActiveTurnChange?.(null);
    }
  }, [currentAudioTime, modifiedConversation, activeTurnIndex]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        p={4}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading transcription...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error" variant="h6">
          Error loading transcription
        </Typography>
        <Typography color="error" variant="body2">
          Please try again later or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  const transcription = data.transcription;
  const validation = data.validation;
  const hasConversation =
    modifiedConversation && modifiedConversation.length > 0;

  return (
    <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-5 pl-6 pt-6 pr-6 mb-[-1.25rem]">
      {/* Validation Warnings */}
      <div className="w-full md:max-w-[70%] flex flex-col gap-4">
        {validation && (
          <TranscriptionValidationWarnings
            validation={validation}
            hasConversation={hasConversation}
          />
        )}
      </div>

      {/* Assign Roles Popover */}
      <Popover
        open={assignRolesPopoverOpen}
        anchorEl={assignRolesAnchorEl}
        onClose={() => setAssignRolesAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              maxHeight: "70vh",
              maxWidth: "400px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              mt: 1,
            },
          },
        }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#002321] text-base font-bold font-['Public_Sans']">
              Assign Speaker Roles
            </h2>
            <IconButton
              onClick={() => setAssignRolesAnchorEl(null)}
              size="small"
              sx={{ color: "#2b5469" }}
            >
              <Close fontSize="small" />
            </IconButton>
          </div>

          {/* Info message */}
          <div className="mb-3 p-2 bg-[#e8f4f3] rounded border border-[#006c67]/20">
            <p className="text-[#002321] text-xs font-['Public_Sans']">
              Mark one speaker as <strong>Client</strong> and one as{" "}
              <strong>Caseworker</strong>.
            </p>
          </div>

          {/* Add Speaker Section */}
          <div className="mb-3">
            <span className="text-[rgba(43,84,105,0.5)] font-['Public_Sans'] text-[10px] font-bold leading-[1.2] tracking-[-0.12px] uppercase mb-1.5 block">
              ADD SPEAKER
            </span>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newSpeakerName}
                onChange={(e) => setNewSpeakerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSpeaker()}
                placeholder="Speaker name"
                className="flex-1 px-2 py-1.5 border border-[#2b5469]/20 rounded text-xs font-['Public_Sans'] focus:outline-none focus:border-[#006c67] focus:ring-1 focus:ring-[#006c67]"
              />
              <button
                onClick={handleAddSpeaker}
                className="px-2 py-1.5 bg-[#006c67] text-white rounded text-xs font-['Public_Sans'] font-medium hover:bg-[#005550] transition-colors flex items-center gap-1"
              >
                <Add sx={{ fontSize: 14 }} />
                Add
              </button>
            </div>
          </div>

          {/* Speaker List */}
          <div className="mb-3">
            <span className="text-[rgba(43,84,105,0.5)] font-['Public_Sans'] text-[10px] font-bold leading-[1.2] tracking-[-0.12px] uppercase mb-2 block">
              SPEAKERS ({uniqueSpeakers.length})
            </span>
            <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto">
              {uniqueSpeakers.map((speaker) => {
                const assignedRole = getSpeakerRole(speaker);
                const isClient = assignedRole === "Client";
                const isCaseworker = assignedRole === "Caseworker";
                const isManual = isManualSpeaker(speaker);

                return (
                  <div
                    key={speaker}
                    className="flex items-center gap-2 p-2 bg-white border border-[#2b5469]/10 rounded hover:border-[#006c67]/30 transition-colors"
                  >
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getSpeakerColor(speaker) }}
                    />

                    {/* Speaker info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#002321] text-xs font-medium font-['Public_Sans'] truncate">
                          {speaker}
                        </span>
                        {isManual && (
                          <span className="text-[9px] text-[#2b5469]/60 font-['Public_Sans'] uppercase">
                            Manual
                          </span>
                        )}
                        {assignedRole && (
                          <span className="text-[9px] text-[#2b5469]/60 font-['Public_Sans']">
                            → {assignedRole}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRoleToggle(speaker, "Client")}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-['Public_Sans'] font-medium transition-all ${
                          isClient
                            ? "bg-[#1976d2] text-white"
                            : "bg-white border border-[#1976d2] text-[#1976d2] hover:bg-[#1976d2]/10"
                        }`}
                      >
                        {isClient && <Check sx={{ fontSize: 10, mr: 0.3 }} />}
                        Client
                      </button>
                      <button
                        onClick={() => handleRoleToggle(speaker, "Caseworker")}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-['Public_Sans'] font-medium transition-all ${
                          isCaseworker
                            ? "bg-[#2e7d32] text-white"
                            : "bg-white border border-[#2e7d32] text-[#2e7d32] hover:bg-[#2e7d32]/10"
                        }`}
                      >
                        {isCaseworker && (
                          <Check sx={{ fontSize: 10, mr: 0.3 }} />
                        )}
                        Caseworker
                      </button>
                    </div>

                    {/* Remove button for manual speakers */}
                    {isManual && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveSpeaker(speaker)}
                        sx={{ color: "#d32f2f", padding: "2px" }}
                      >
                        <Close sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="mb-3 p-2 bg-[#f8f9fa] rounded">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[rgba(43,84,105,0.5)] font-['Public_Sans'] text-[9px] font-bold uppercase block mb-0.5">
                  Client
                </span>
                <span className="text-[#002321] text-xs font-['Public_Sans'] font-medium">
                  {clientSpeaker || "Not assigned"}
                </span>
              </div>
              <div>
                <span className="text-[rgba(43,84,105,0.5)] font-['Public_Sans'] text-[9px] font-bold uppercase block mb-0.5">
                  Caseworker
                </span>
                <span className="text-[#002321] text-xs font-['Public_Sans'] font-medium">
                  {caseworkerSpeaker || "Not assigned"}
                </span>
              </div>
            </div>
          </div>

          {/* Warning if not complete */}
          {(!clientSpeaker || !caseworkerSpeaker) && (
            <div className="mb-3 p-2 bg-[#fff3cd] border border-[#ffc107]/30 rounded">
              <p className="text-[#856404] text-[10px] font-['Public_Sans']">
                ⚠️ Assign both roles to save
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setAssignRolesAnchorEl(null)}
              className="px-3 py-1.5 border border-[#2b5469]/20 text-[#2b5469] rounded text-xs font-['Public_Sans'] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyRenames}
              disabled={!clientSpeaker || !caseworkerSpeaker}
              className={`px-3 py-1.5 rounded text-xs font-['Public_Sans'] font-medium transition-colors ${
                clientSpeaker && caseworkerSpeaker
                  ? "bg-[#006c67] text-white hover:bg-[#005550]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Apply
            </button>
          </div>
        </div>
      </Popover>

      {/* Merge Speakers Popover */}
      <Popover
        open={mergePopoverOpen}
        anchorEl={mergeAnchorEl}
        onClose={() => setMergeAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              mt: 1,
              maxWidth: "350px",
            },
          },
        }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#002321] text-base font-bold font-['Public_Sans']">
              Merge Speakers
            </h2>
            <IconButton
              onClick={() => setMergeAnchorEl(null)}
              size="small"
              sx={{ color: "#2b5469" }}
            >
              <Close fontSize="small" />
            </IconButton>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3 mb-3">
            <div className="p-2 bg-[#e8f4f3] rounded border border-[#006c67]/20">
              <p className="text-[#002321] text-xs font-['Public_Sans']">
                Merge all turns from one speaker into another.
              </p>
            </div>

            <div>
              <span className="text-[rgba(43,84,105,0.5)] font-['Public_Sans'] text-[10px] font-bold leading-[1.2] tracking-[-0.12px] uppercase mb-1.5 block">
                Merge this speaker
              </span>
              <Select
                fullWidth
                value={sourceSpeaker}
                onChange={(e) => setSourceSpeaker(e.target.value)}
                displayEmpty
                size="small"
                sx={{
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily: "'Public Sans', sans-serif",
                  "& .MuiSelect-select": {
                    fontFamily: "'Public Sans', sans-serif",
                    paddingY: "6px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#2b5469/20",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#006c67",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      fontFamily: "'Public Sans', sans-serif",
                      "& .MuiMenuItem-root": {
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: "12px",
                        paddingY: "6px",
                      },
                      "& .MuiList-root": {
                        fontFamily: "'Public Sans', sans-serif",
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <span className="font-['Public_Sans'] text-gray-400 text-xs">
                    Select speaker
                  </span>
                </MenuItem>
                {uniqueSpeakers.map((speaker) => (
                  <MenuItem key={speaker} value={speaker}>
                    <div className="flex items-center gap-1.5 font-['Public_Sans']">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getSpeakerColor(speaker) }}
                      />
                      <span className="text-xs">{speaker}</span>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </div>

            <div>
              <span className="text-[rgba(43,84,105,0.5)] font-['Public_Sans'] text-[10px] font-bold leading-[1.2] tracking-[-0.12px] uppercase mb-1.5 block">
                Into this speaker
              </span>
              <Select
                fullWidth
                value={targetSpeaker}
                onChange={(e) => setTargetSpeaker(e.target.value)}
                displayEmpty
                disabled={!sourceSpeaker}
                size="small"
                sx={{
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily: "'Public Sans', sans-serif",
                  "& .MuiSelect-select": {
                    fontFamily: "'Public Sans', sans-serif",
                    paddingY: "6px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#2b5469/20",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#006c67",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      fontFamily: "'Public Sans', sans-serif",
                      "& .MuiMenuItem-root": {
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: "12px",
                        paddingY: "6px",
                      },
                      "& .MuiList-root": {
                        fontFamily: "'Public Sans', sans-serif",
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <span className="font-['Public_Sans'] text-gray-400 text-xs">
                    Select speaker
                  </span>
                </MenuItem>
                {uniqueSpeakers
                  .filter((s) => s !== sourceSpeaker)
                  .map((speaker) => (
                    <MenuItem key={speaker} value={speaker}>
                      <div className="flex items-center gap-1.5 font-['Public_Sans']">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getSpeakerColor(speaker) }}
                        />
                        <span className="text-xs">{speaker}</span>
                      </div>
                    </MenuItem>
                  ))}
              </Select>
            </div>
          </div>

          {/* Warning for invalid merge */}
          {sourceSpeaker &&
            targetSpeaker &&
            ((sourceSpeaker.toLowerCase() === "caseworker" &&
              targetSpeaker.toLowerCase() === "client") ||
              (sourceSpeaker.toLowerCase() === "client" &&
                targetSpeaker.toLowerCase() === "caseworker")) && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-[10px] font-['Public_Sans']">
                  ⚠️ Cannot merge Caseworker with Client
                </p>
              </div>
            )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setMergeAnchorEl(null)}
              className="px-3 py-1.5 border border-[#2b5469]/20 text-[#2b5469] rounded text-xs font-['Public_Sans'] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMergeSpeakers}
              disabled={!sourceSpeaker || !targetSpeaker}
              className={`px-3 py-1.5 rounded text-xs font-['Public_Sans'] font-medium transition-colors ${
                sourceSpeaker && targetSpeaker
                  ? "bg-[#006c67] text-white hover:bg-[#005550]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Merge
            </button>
          </div>
        </div>
      </Popover>

      {/* Only show transcription content if conversation exists */}
      {hasConversation && (
        <>
          {/* Header with metadata and controls */}
          <div className="w-full flex flex-col justify-start items-start gap-4">
            <div className="w-full flex items-center justify-between">
              <div className="justify-start text-[#002321] text-lg font-bold font-['Public_Sans'] leading-snug">
                Interview Transcription
              </div>
              <div className="flex gap-2">
                <Tooltip
                  title={
                    history.length > 0
                      ? `Undo: ${history[history.length - 1].action}`
                      : "No actions to undo"
                  }
                  arrow
                >
                  <span>
                    <button
                      onClick={handleUndo}
                      disabled={history.length === 0}
                      className={`px-4 py-2 border rounded-[32px] text-sm font-['Public_Sans'] font-medium transition-colors flex items-center gap-2 ${
                        history.length > 0
                          ? "border-[#006c67] text-[#006c67] hover:bg-[#006c67]/5"
                          : "border-gray-300 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <Undo sx={{ fontSize: 16 }} />
                      Undo
                    </button>
                  </span>
                </Tooltip>
                <button
                  onClick={(e) => setAssignRolesAnchorEl(e.currentTarget)}
                  className="px-4 py-2 border border-[#006c67] text-[#006c67] rounded-[32px] text-sm font-['Public_Sans'] font-medium hover:bg-[#006c67]/5 transition-colors flex items-center gap-2"
                >
                  <Edit sx={{ fontSize: 16 }} />
                  Assign Roles
                </button>
                <button
                  onClick={(e) => setMergeAnchorEl(e.currentTarget)}
                  disabled={uniqueSpeakers.length < 2}
                  className={`px-4 py-2 border rounded-[32px] text-sm font-['Public_Sans'] font-medium transition-colors flex items-center gap-2 ${
                    uniqueSpeakers.length < 2
                      ? "border-gray-300 text-gray-400 cursor-not-allowed"
                      : "border-[#006c67] text-[#006c67] hover:bg-[#006c67]/5"
                  }`}
                >
                  <MergeType sx={{ fontSize: 16 }} />
                  Merge Speakers
                </button>
                <Tooltip title={exportTooltip} arrow>
                  <span>
                    <button
                      onClick={handleExport}
                      disabled={!canExport}
                      className={`px-4 py-2 rounded-[32px] text-sm font-['Public_Sans'] font-medium transition-colors flex items-center gap-2 ${
                        canExport
                          ? "bg-[#006c67] text-white hover:bg-[#005550]"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Download sx={{ fontSize: 16 }} />
                      Save conversation
                    </button>
                  </span>
                </Tooltip>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-[#2a5469]/90 text-sm font-medium font-['Public_Sans']">
              <div>
                <strong>Total Duration:</strong>{" "}
                {formatDuration(
                  Number(
                    transcription.metadata.totalDuration.replace("s", ""),
                  ) * 1000,
                )}
              </div>
              <div>
                <strong>Speakers:</strong> {uniqueSpeakers.length}
              </div>
            </div>

            {/* Save Requirements Alert */}
            {!canExport && (
              <div className="p-3 bg-[#fff3cd] border border-[#ffc107]/30 rounded-lg">
                <p className="text-[#856404] text-sm font-['Public_Sans']">
                  <strong>Save Requirements:</strong> Please mark one speaker as
                  "Client" and one as "Caseworker" before saving. Use the
                  "Assign Roles" button to assign these roles.
                </p>
              </div>
            )}
          </div>

          {/* Conversation turns */}
          <div className="max-h-[45vh] overflow-y-auto space-y-2 self-center pb-32">
            {modifiedConversation.map((turn, index) => {
              const isActive = index === activeTurnIndex;
              const isSplitMode = activeSplitTurnIndex === index;

              return (
                <ConversationTurn
                  key={`${turn.id}-${index}`}
                  turn={turn}
                  index={index}
                  isActive={isActive}
                  isSplitMode={isSplitMode}
                  getSpeakerColor={getSpeakerColor}
                  uniqueSpeakers={uniqueSpeakers}
                  onSpeakerChange={handleSpeakerChange}
                  onTurnClick={(startTime) => onTurnClick?.(startTime)}
                  onToggleSplitMode={handleToggleSplitMode}
                  onSplitTurn={handleSplitTurn}
                  setRef={(el) => {
                    turnRefs.current[index] = el;
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TranscriptionConversation;
