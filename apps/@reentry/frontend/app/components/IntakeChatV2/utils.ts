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

import {
  Message,
  StepStatus,
} from "~@reentry/frontend/components/IntakeChatV2/Chat/types";
import { IntakeFields } from "~@reentry/frontend/components/IntakeChatV2/types";
import { Section } from "~@reentry/frontend/types/intake";

/**
 * Validate IntakeLogin form fields.
 * Returns the first error message, or null if all fields are valid.
 */
export function validateIntakeFields(fields: IntakeFields): string | null {
  const { firstName, lastName, month, day, year, stateCode } = fields;

  const currentYear = new Date().getFullYear();

  if (!firstName.trim()) {
    return "Please enter your first name";
  }
  if (!lastName.trim()) {
    return "Please enter your last name";
  }
  if (!month || !day || !year) {
    return "Please enter your complete date of birth";
  }

  if (!/^\d{1,2}$/.test(month) || +month < 1 || +month > 12) {
    return "Please enter a valid month (1–12)";
  }

  if (!/^\d{1,2}$/.test(day) || +day < 1 || +day > 31) {
    return "Please enter a valid day (1–31)";
  }

  if (!/^\d{4}$/.test(year) || +year < 1900 || +year > currentYear) {
    return "Please enter a valid year";
  }

  if (!stateCode) {
    return "Please select a state";
  }

  return null;
}

export const getInitials = (fullName?: string): string =>
  fullName
    ? fullName
        .split(" ")
        .slice(0, 2)
        .map((n) => n.charAt(0).toUpperCase())
        .join("")
    : "";

export function getSectionStatuses(
  messages: Message[],
  sections?: Section[],
): StepStatus[] {
  if (!sections) return [];
  if (messages.length === 0) {
    return sections.map(() => "not_started");
  }

  const currentSectionTitle = messages[messages.length - 1].section;
  const currentIdx = sections.findIndex(
    (section) => section.title === currentSectionTitle,
  );

  return sections.map((_, idx) => {
    if (idx < currentIdx) return "completed";
    if (idx === currentIdx) return "in_progress";
    return "not_started";
  });
}

export function getMessagesForCurrentSection(messages: Message[]): Message[] {
  if (!messages.length) return [];
  const currentSection = messages[messages.length - 1].section;
  return messages.filter((msg) => msg.section === currentSection);
}
