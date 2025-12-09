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

import { ChevronRight, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import Sidebar from "~@reentry/frontend/(protected)/clients/intake/[id]/chat-history/Sidebar";
import {
  ClientRecord,
  IntakeSection,
} from "~@reentry/frontend/(protected)/clients/intake/[id]/types";
import { StatusPill } from "~@reentry/frontend/components/base/StatusPill";
import { ChatMessageBubble } from "~@reentry/frontend/components/IntakeChatV2/Chat/ChatMessageBubble";
import type { Message as ChatMessage } from "~@reentry/frontend/components/IntakeChatV2/Chat/types";
import { trpc } from "~@reentry/frontend/trpc";
import { components } from "~@reentry/openapi-types";

import styles from "./AdminIntakeHistoryV2.module.css";

interface AdminIntakeHistoryV2Props {
  clientRecord: ClientRecord;
  clientPseudoId: string;
}

const AdminIntakeHistoryV2 = ({
  clientPseudoId,
  clientRecord,
}: AdminIntakeHistoryV2Props) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { data: intakeHistory, isLoading } =
    trpc.staff.getIntakeHistory.useQuery({
      clientPseudoId,
    });

  const sections = intakeHistory?.sections || [];

  const intakeSectionsForSidebar: IntakeSection[] = sections.map((section) => ({
    status:
      section.completion_status as components["schemas"]["IntakeSectionStatus"],
    title: section.title,
    description: section.description,
  }));

  // Auto-select first section on load
  useEffect(() => {
    if (sections.length && !activeSection) {
      setActiveSection(sections[0].id);
    }
  }, [sections, activeSection]);

  // Chat container height adjustment (should not exceed sidebar height and handle browser resizing)
  useEffect(() => {
    if (!sidebarRef.current || !chatContainerRef.current || !sidebarOpen)
      return;
    const mq = window.matchMedia("(min-width: 768px)");
    const BUFFER_PADDING = 50;
    const measureAndResize = () => {
      if (!sidebarRef.current || !chatContainerRef.current) return;
      if (mq.matches) {
        const sidebarHeight = sidebarRef.current.getBoundingClientRect().height;
        sidebarRef.current.style.height = `${sidebarHeight}px`;
        chatContainerRef.current.style.maxHeight = `${sidebarHeight + BUFFER_PADDING}px`;
        chatContainerRef.current.style.overflowY = "auto";
      } else {
        sidebarRef.current.style.height = "auto";
        chatContainerRef.current.style.maxHeight = "none";
        chatContainerRef.current.style.overflowY = "visible";
      }
    };

    measureAndResize();
    window.addEventListener("resize", measureAndResize);
    mq.addEventListener("change", measureAndResize);

    return () => {
      window.removeEventListener("resize", measureAndResize);
      mq.removeEventListener("change", measureAndResize);
    };
  }, [sidebarOpen, sections.length, intakeHistory?.messages?.length]);

  const clientInitials =
    clientRecord.full_name.given_names[0].toUpperCase() +
    clientRecord.full_name.surname[0].toUpperCase();

  // Group messages by section title
  const messagesBySection: Record<string, ChatMessage[]> = useMemo(() => {
    const grouped: Record<string, ChatMessage[]> = {};

    (intakeHistory?.messages || []).forEach((message) => {
      const sectionTitle = message.section;

      if (!grouped[sectionTitle]) grouped[sectionTitle] = [];

      grouped[sectionTitle].push({
        id: message.id || `content-${String(message.content).slice(0, 20)}`,
        content: String(message.content),
        from_role: message.from_role,
        section: sectionTitle,
      });
    });
    return grouped;
  }, [intakeHistory?.messages]);

  if (isLoading) {
    return <div className={styles["loading"]}>Loading intake history...</div>;
  }

  if (!intakeHistory) {
    return (
      <div className={styles["notFound"]}>
        No conversation history available
      </div>
    );
  }

  return (
    <div className={styles["wrapper"]}>
      {sidebarOpen ? (
        <div className={styles["sidebar"]} ref={sidebarRef}>
          <Sidebar
            onClose={() => setSidebarOpen(!sidebarOpen)}
            activeSection={activeSection}
            onSectionSelect={(id) => setActiveSection(id)}
            intakeSections={intakeSectionsForSidebar}
          />
        </div>
      ) : (
        <div className={styles["sidebarClosedToggleWrapper"]}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={styles["sidebarToggleButton"]}
            aria-label="Show sidebar"
            type="button"
          >
            <ChevronRight className={styles["mutedIcon"]} />
          </button>
        </div>
      )}

      <div className={styles["chatContainer"]} ref={chatContainerRef}>
        {activeSection ? (
          sections
            .filter((section) => section.id === activeSection)
            .map((section) => {
              const sectionMessages = messagesBySection[section.title] || [];
              return (
                <div key={section.id} className={styles["section"]}>
                  <div className={styles["sectionHeader"]}>
                    <h2 className={styles["sectionTitle"]}>
                      {section.title}
                      <StatusPill status={section.completion_status} />
                    </h2>
                  </div>
                  <div className={styles["scroller"]}>
                    {sectionMessages.length === 0 ? (
                      <div className={styles["emptySectionNotice"]}>
                        No messages in this section
                      </div>
                    ) : (
                      sectionMessages.map((message) => (
                        <ChatMessageBubble
                          key={message.id}
                          message={message}
                          clientInitials={clientInitials}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })
        ) : (
          <div className={styles["emptyStateWrapper"]}>
            <MessageSquare size={48} className={styles["mutedIcon"]} />
            <p className={styles["emptyStateTitle"]}>
              Select a section to view messages
            </p>
            <p className={styles["emptyStateSubtitle"]}>
              Choose a section from the sidebar to see the conversation history
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminIntakeHistoryV2;
