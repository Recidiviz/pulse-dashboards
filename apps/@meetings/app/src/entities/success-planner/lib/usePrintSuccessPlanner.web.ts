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

import { checkInQuestionConfig } from "~@jii/configs";
import { Person } from "~@meetings/app/shared/api";
import {
  escapeHtml,
  printHtmlDocument,
} from "~@meetings/app/shared/lib/print.web";

import copy from "../config/successPlannerCopy";
import { SUCCESS_PLANNER_SECTIONS } from "../config/successPlannerSections";
import {
  getAnswerState,
  SuccessPlanner,
  SuccessPlannerQuestion,
  SupportSystemContact,
} from "../model/successPlanner";
import { getSuccessPlannerSummary } from "./getSuccessPlannerSummary";

function renderAnswer(
  planner: SuccessPlanner,
  question: SuccessPlannerQuestion,
): string {
  switch (getAnswerState(planner.answers, question.id)) {
    case "unreached":
      return `<p class="muted">Not answered yet</p>`;
    case "skipped":
      return `<p class="muted">No response provided</p>`;
    case "answered": {
      const value = planner.answers[question.id];

      const questionCopy = copy.questions[question.id];
      const answerCopy: Record<string, string> =
        "answers" in questionCopy ? questionCopy.answers : {};
      const standardAnswerCopy: Record<string, string> =
        copy.standardRadioAnswers;

      const answerAsString = () => {
        const format = checkInQuestionConfig[question.id].format;

        if (format === "FREE_TEXT") {
          return value as string;
        } else if (format === "RADIO") {
          return (
            answerCopy[value as string] ??
            standardAnswerCopy[value as string] ??
            value
          );
        } else if (format === "CHECKBOX") {
          return (value as string[]).map((s) => answerCopy[s] ?? s).join("; ");
        }
        return "—";
      };

      if (question.answerType === "table") {
        const rows = (value as SupportSystemContact[])
          .map(
            (contact) =>
              `<tr><td>${escapeHtml(contact.name)}</td><td>${escapeHtml(contact.relationship ?? "—")}</td></tr>`,
          )
          .join("");
        return `<table><tr><th>Name</th><th>How do you know them?</th></tr>${rows}</table>`;
      }
      return `<p>${escapeHtml(answerAsString())}</p>`;
    }
  }
}

export function usePrintSuccessPlanner({
  person,
  planner,
}: {
  person: Person;
  planner: SuccessPlanner;
}) {
  return () => {
    const { title, subtitle } = getSuccessPlannerSummary(planner);

    printHtmlDocument({
      title: `120-Day Check-In - ${person.fullName}`,
      body: `
        <h1>${escapeHtml(person.fullName)}</h1>
        <p>ID: ${escapeHtml(person.displayPersonExternalId)}</p>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(subtitle)}</p>
        ${SUCCESS_PLANNER_SECTIONS.map(
          (section) => `
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.questions
            .map(
              (question) =>
                `<h3>${escapeHtml(question.label)}</h3>${renderAnswer(planner, question)}`,
            )
            .join("")}
        `,
        ).join("")}
      `,
    });
  };
}
