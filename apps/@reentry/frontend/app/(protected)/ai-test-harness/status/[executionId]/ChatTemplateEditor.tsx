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

"use client";

import { Popover } from "@mui/material";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  MessageSquare,
  Pencil,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";

import Sidebar from "~@reentry/frontend/(protected)/intake/[intakeId]/chat-history/Sidebar";
import { $api } from "~@reentry/frontend/api";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {
  CaseWorkerBubbleTail,
  UserBubbleTail,
} from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

type IntakeMessage = components["schemas"]["IntakeMessageResponse"];
type IntakeSection = components["schemas"]["IntakeSectionResponse"];
type IntakeWithSections = components["schemas"]["IntakeWithSectionsResponse"];

type MessageRole = "client" | "caseworker" | "system";

type DisplayMessage = {
  id: string;
  from_role: MessageRole;
  content: string;
  isInserted?: boolean;
};

type EditedMessages = Record<string, string>;

// ---------- Editable message bubble ----------

const EditableMessageBubble = ({
  message,
  editedContent,
  onEdit,
}: {
  message: DisplayMessage;
  editedContent: string | undefined;
  onEdit: (messageId: string, newContent: string) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [editText, setEditText] = useState("");

  const isClient = message.from_role === "client";
  const canEdit = !message.isInserted;
  const displayContent = editedContent ?? message.content;
  const isEdited =
    editedContent !== undefined && editedContent !== message.content;

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setEditText(editedContent ?? message.content);
    setAnchorEl(e.currentTarget);
  };

  const handleSave = () => {
    onEdit(message.id, editText);
    setAnchorEl(null);
  };

  const handleClose = () => setAnchorEl(null);

  if (isClient) {
    return (
      <div className="flex w-full px-4 justify-end group/bubble">
        <div className="flex flex-col items-end sm:flex-row sm:items-end gap-2">
          {/* Edit button — fades in on hover, only for non-inserted messages */}
          {canEdit && (
            <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity mb-1 self-end">
              <button
                type="button"
                onClick={handleEditClick}
                className="p-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
                title="Edit message"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="relative inline-flex flex-col items-end">
            <div
              className={`py-2 px-3 rounded-[16px] shadow-sm max-w-[80vw] sm:max-w-sm md:max-w-md bg-[#2B6C75] text-white break-words ${
                isEdited ? "ring-2 ring-amber-400 ring-offset-1" : ""
              } ${message.isInserted ? "opacity-90" : ""}`}
            >
              <p className="break-words whitespace-pre-wrap text-base leading-snug">
                {displayContent}
              </p>
              {isEdited && (
                <span className="text-[10px] text-amber-200 mt-0.5 block">
                  edited
                </span>
              )}
              {message.isInserted && (
                <span className="text-[10px] text-teal-200 mt-0.5 block">
                  inserted
                </span>
              )}
            </div>
            <UserBubbleTail />
          </div>

          {/* Edit popover */}
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  p: 2,
                  width: 320,
                },
              },
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-gray-700">
                Edit client message
              </div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#003331]"
                rows={4}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm text-white bg-[#003331] rounded-full hover:bg-gray-950 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </Popover>
        </div>
      </div>
    );
  }

  // Caseworker / system message
  return (
    <div className="flex w-full px-4 justify-start group/bubble">
      <div className="flex flex-row items-end gap-2">
        <div className="relative inline-flex flex-col items-start">
          <div
            className={`py-2 px-3 rounded-[16px] shadow-sm max-w-[80vw] sm:max-w-sm md:max-w-md bg-white text-[#1E3A3A] break-words ${
              isEdited ? "ring-2 ring-amber-400 ring-offset-1" : ""
            } ${message.isInserted ? "opacity-90" : ""}`}
          >
            <p className="text-base leading-snug break-words whitespace-pre-wrap">
              {displayContent}
            </p>
            {isEdited && (
              <span className="text-[10px] text-amber-500 mt-0.5 block">
                edited
              </span>
            )}
            {message.isInserted && (
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                inserted
              </span>
            )}
          </div>
          <CaseWorkerBubbleTail />
        </div>

        {/* Edit button */}
        {canEdit && (
          <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity mb-1">
            <button
              type="button"
              onClick={handleEditClick}
              className="p-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
              title="Edit message"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Edit popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              p: 2,
              width: 320,
            },
          },
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium text-gray-700">
            Edit caseworker message
          </div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#003331]"
            rows={4}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 text-sm text-white bg-[#003331] rounded-full hover:bg-gray-950 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Popover>
    </div>
  );
};

// ---------- Insert after button ----------

const InsertAfterButton = ({
  afterId,
  onInsert,
}: {
  afterId: string;
  onInsert: (
    afterId: string,
    role: "client" | "caseworker",
    content: string,
  ) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [role, setRole] = useState<"client" | "caseworker">("caseworker");
  const [content, setContent] = useState("");

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
    setRole("caseworker");
    setContent("");
  };

  const handleSave = () => {
    if (!content.trim()) return;
    onInsert(afterId, role, content.trim());
    setAnchorEl(null);
    setContent("");
  };

  const handleClose = () => {
    setAnchorEl(null);
    setContent("");
  };

  return (
    <div className="flex items-center gap-2 px-4 py-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
      <div className="flex-1 h-px bg-gray-200" />
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center justify-center w-5 h-5 rounded-full bg-white border border-gray-300 shadow-sm text-gray-400 hover:text-gray-700 hover:border-gray-500 transition-colors"
        title="Insert message after"
      >
        <Plus className="w-3 h-3" />
      </button>
      <div className="flex-1 h-px bg-gray-200" />

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              p: 2,
              width: 320,
            },
          },
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium text-gray-700">
            Insert message
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole("caseworker")}
              className={`flex-1 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                role === "caseworker"
                  ? "bg-[#003331] text-white border-[#003331]"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Caseworker
            </button>
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`flex-1 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                role === "client"
                  ? "bg-[#2B6C75] text-white border-[#2B6C75]"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Client
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#003331]"
            rows={4}
            placeholder="Type your message..."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-3 py-1.5 text-sm text-white bg-[#003331] rounded-full hover:bg-gray-950 transition-colors disabled:opacity-50"
            >
              Insert
            </button>
          </div>
        </div>
      </Popover>
    </div>
  );
};

// ---------- Section messages with fetch ----------

const EditableSectionMessages = ({
  section,
  intakeId,
  editedMessages,
  onEdit,
  onMessagesLoaded,
}: {
  section: IntakeSection;
  intakeId: string;
  editedMessages: EditedMessages;
  onEdit: (messageId: string, newContent: string) => void;
  onMessagesLoaded?: (messages: DisplayMessage[]) => void;
}) => {
  const accessToken = useAuth().getAccessToken();
  const encodedSectionTitle = encodeURIComponent(section.title);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);

  const { data, isLoading, error } = $api.useQuery(
    "get",
    "/intake/admin/{intake_id}/{section_title}/messages",
    {
      params: {
        path: { intake_id: intakeId, section_title: encodedSectionTitle },
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
    { enabled: section.status !== "not_started" },
  );

  const rawMessages: IntakeMessage[] = data || [];

  const normalize = (text?: string) => text?.trim().toLowerCase() || "";
  const formattedMessages = rawMessages.filter((msg, index, arr) => {
    const norm = normalize(msg.content);
    const isWelcomeBack = norm.includes(
      "thanks for joining again! let's continue our conversation",
    );
    if (isWelcomeBack && normalize(arr[index - 1]?.content) === norm)
      return false;
    if (isWelcomeBack && section.status === "completed") return false;
    return true;
  });

  // Initialize displayMessages from API data (only once)
  useEffect(() => {
    if (
      !isLoading &&
      !error &&
      formattedMessages.length > 0 &&
      displayMessages.length === 0
    ) {
      setDisplayMessages(
        formattedMessages.map((m) => ({
          id: m.id,
          from_role: m.from_role as MessageRole,
          content: m.content,
        })),
      );
    }
  }, [isLoading, error, data]);

  // Notify parent whenever displayMessages changes
  useEffect(() => {
    if (displayMessages.length > 0) {
      onMessagesLoaded?.(displayMessages);
    }
  }, [displayMessages]);

  const handleInsert = (
    afterId: string,
    role: "client" | "caseworker",
    content: string,
  ) => {
    const idx = displayMessages.findIndex((m) => m.id === afterId);
    if (idx === -1) return;
    const newMsg: DisplayMessage = {
      id: `inserted-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from_role: role,
      content,
      isInserted: true,
    };
    setDisplayMessages((prev) => [
      ...prev.slice(0, idx + 1),
      newMsg,
      ...prev.slice(idx + 1),
    ]);
  };

  if (section.status === "not_started") {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <MessageSquare size={36} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm">This section has not been started yet.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full pt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#006B66]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Failed to load messages.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex flex-col gap-1">
        {displayMessages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            No messages in this section.
          </div>
        ) : (
          displayMessages.map((message) => (
            <div key={message.id} className="group/row flex flex-col">
              <EditableMessageBubble
                message={message}
                editedContent={
                  message.isInserted ? undefined : editedMessages[message.id]
                }
                onEdit={onEdit}
              />
              <InsertAfterButton afterId={message.id} onInsert={handleInsert} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ---------- Main editor ----------

const ChatTemplateEditor = ({
  intake,
  configDisplayName,
  onClose,
}: {
  intake: IntakeWithSections;
  configDisplayName?: string | null;
  onClose: () => void;
}) => {
  const sections = intake.intake_sections || [];
  const [activeSection, setActiveSection] = useState<string | null>(
    sections[0]?.title ?? null,
  );
  const [editedMessages, setEditedMessages] = useState<EditedMessages>({});
  const [allSectionMessages, setAllSectionMessages] = useState<
    Record<string, DisplayMessage[]>
  >({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleEdit = (messageId: string, newContent: string) => {
    setEditedMessages((prev) => ({ ...prev, [messageId]: newContent }));
  };

  const handleMessagesLoaded = (
    sectionTitle: string,
    messages: DisplayMessage[],
  ) => {
    setAllSectionMessages((prev) => ({ ...prev, [sectionTitle]: messages }));
  };

  const handleExport = () => {
    const template = {
      ...(configDisplayName ? { config_display_name: configDisplayName } : {}),
      sections: sections.map((section) => ({
        title: section.title,
        messages: (allSectionMessages[section.title] ?? []).map((msg) => ({
          from_role: msg.from_role,
          content: (!msg.isInserted && editedMessages[msg.id]) ?? msg.content,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-template-${intake.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const editedCount = Object.keys(editedMessages).length;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      {/* Modal */}
      <div className="w-full max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Export as a Template
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Hover over any message to edit client messages or insert new ones.
              {editedCount > 0 && (
                <span className="ml-2 text-amber-600 font-medium">
                  {editedCount} message{editedCount !== 1 ? "s" : ""} edited
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#003331] text-white rounded-full text-sm font-medium hover:bg-gray-950 transition-colors flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          {sidebarOpen ? (
            <div className="flex-none border-r border-gray-200 overflow-y-auto bg-white">
              <Sidebar
                onClose={() => setSidebarOpen(false)}
                activeSection={activeSection}
                onSectionSelect={setActiveSection}
                intakeSections={sections}
              />
            </div>
          ) : (
            <div className="flex items-start pt-4 flex-none border-r border-gray-200">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors m-2"
                aria-label="Show sidebar"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}

          {/* Chat panel */}
          <div className="flex-1 min-w-0 flex flex-col">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare size={48} className="mb-4 text-gray-300" />
                <p className="text-sm">Select a section to view messages</p>
              </div>
            ) : (
              sections.map((section) => {
                const isActive = section.title === activeSection;
                return (
                  <div
                    key={section.title}
                    className={`flex flex-col h-full ${isActive ? "" : "hidden"}`}
                  >
                    <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                      <h3 className="text-base font-medium text-gray-900">
                        {section.title}
                      </h3>
                    </div>
                    <div className="flex-1 min-h-0 bg-gray-50">
                      <EditableSectionMessages
                        section={section}
                        intakeId={intake.id}
                        editedMessages={editedMessages}
                        onEdit={handleEdit}
                        onMessagesLoaded={(msgs) =>
                          handleMessagesLoaded(section.title, msgs)
                        }
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTemplateEditor;
