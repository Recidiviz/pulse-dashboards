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

import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Modal from "react-modal";

import { $api } from "~@reentry/frontend/api";
import { LoadingSpinner } from "~@reentry/frontend/components/clients/AddClientModal/LoadingSpinner";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { showErrorToast } from "~@reentry/frontend-shared";

interface TestPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaId: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const TestPersonaModal = ({
  isOpen,
  onClose,
  personaId,
}: TestPersonaModalProps) => {
  const { getAccessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch persona details
  const { data: persona } = $api.useQuery(
    "get",
    "/ai-personas/{persona_id}",
    {
      params: { path: { persona_id: personaId ?? "" } },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    {
      enabled: !!personaId && isOpen,
    },
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! I'm ${persona?.name || "loading..."}. Feel free to ask me anything to test how I respond!`,
          timestamp: new Date(),
        },
      ]);
      setInputMessage("");
    }
  }, [isOpen, persona?.name]);

  // Test persona mutation
  const testPersonaMutation = $api.useMutation(
    "post",
    "/ai-personas/{persona_id}/test",
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !persona || !personaId) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call real API endpoint to generate persona response
      const result = await testPersonaMutation.mutateAsync({
        params: {
          path: { persona_id: personaId },
        },
        body: {
          message: userMessage.content,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      const aiResponse: Message = {
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const detail =
        error instanceof Error &&
        "response" in error &&
        (error as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail;
      showErrorToast(detail || "Failed to generate response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessages([]);
    setInputMessage("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="outline-none mx-4 md:mx-0"
      overlayClassName="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      ariaHideApp={false}
    >
      <div className="w-full max-w-[700px] bg-white rounded-xl shadow-[0px_8px_56px_0px_rgba(43,84,105,0.12)] shadow-[0px_4px_8px_0px_rgba(43,84,105,0.06)] shadow-[0px_0px_1px_0px_rgba(43,84,105,0.10)] flex flex-col overflow-hidden h-[600px]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2b5469]/20 flex justify-between items-start">
          <div className="flex-1">
            <div className="text-[#002321] text-base font-medium font-['Public_Sans'] leading-tight">
              Test Persona: {persona?.name || "Loading..."}
            </div>
            {persona && (
              <div className="text-sm text-gray-600 mt-1">
                Age: {persona.age} • {persona.communication_style}
              </div>
            )}
          </div>
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={handleClose}
            aria-label="Close modal"
            type="button"
          >
            <X size={14} className="text-[#004D48]" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-[#003331] text-white"
                    : "bg-white border border-gray-200 text-gray-900"
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === "user" ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <LoadingSpinner />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-gray-200 bg-white"
        >
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message to test the persona..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-3 bg-[#003331] text-white rounded-lg hover:bg-gray-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TestPersonaModal;
