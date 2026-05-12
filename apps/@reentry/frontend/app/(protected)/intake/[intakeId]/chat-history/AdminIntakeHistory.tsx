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
import { useEffect, useRef, useState } from "react";

import Chatbubble from "~@reentry/frontend/(protected)/intake/[intakeId]/chat-history/Chatbubble";
import Sidebar from "~@reentry/frontend/(protected)/intake/[intakeId]/chat-history/Sidebar";
import { StatusPill } from "~@reentry/frontend/components/base/StatusPill";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import type { components } from "~@reentry/openapi-types";

type ClientRecord = components["schemas"]["ClientRecordResponse"];
type Intake = components["schemas"]["IntakeWithSectionsResponse"];
type IntakeSection = components["schemas"]["IntakeSectionResponse"];

const AdminIntakeHistory = ({
  clientRecord,
  intake,
}: {
  clientRecord: ClientRecord;
  intake: Intake;
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { trackClientIntakeChatHistoryViewed } = useAnalytics();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (intake?.intake_sections?.length && !activeSection) {
      const sections = intake.intake_sections;
      const firstSection = sections[0].title;
      const lastActiveSection = sections.findLast(
        (s) => s.status !== "not_started",
      )?.title;
      const currentSection = lastActiveSection ?? firstSection;

      setActiveSection(currentSection);
      trackClientIntakeChatHistoryViewed({
        justiceInvolvedPersonId: clientRecord.pseudonymized_client_id,
        section: currentSection,
      });
    }
  }, [intake, activeSection]);

  const sections: IntakeSection[] = intake.intake_sections || [];

  return (
    <div className="h-full mx-auto bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen ? (
        <div className="flex-none" ref={sidebarRef}>
          <Sidebar
            onClose={() => setSidebarOpen(!sidebarOpen)}
            activeSection={activeSection}
            onSectionSelect={(sectionTitle) => {
              trackClientIntakeChatHistoryViewed({
                justiceInvolvedPersonId: clientRecord.pseudonymized_client_id,
                section: sectionTitle,
              });
              setActiveSection(sectionTitle);
            }}
            intakeSections={sections}
          />
        </div>
      ) : (
        <div className="flex items-start pt-4 flex-none">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Show sidebar"
            type="button"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Chat Panel */}
      <div className="pl-4 flex-col flex-1 min-h-0 transition-all duration-300">
        {activeSection ? (
          sections
            .filter((section) => section.title === activeSection)
            .map((section) => (
              <div key={section.title} className="flex flex-col h-full min-h-0">
                <div className="flex items-center pb-4 border-b flex-shrink-0">
                  <h2 className="text-sm font-bold">
                    {section.title}
                    <StatusPill status={section.status} />
                  </h2>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <Chatbubble
                    section={section}
                    intakeId={intake.id}
                    isActive={true}
                    client={clientRecord}
                    smallText
                  />
                </div>
              </div>
            ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">
              Select a section to view messages
            </p>
            <p className="text-sm text-center">
              Choose a section from the sidebar to see the conversation history
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminIntakeHistory;
