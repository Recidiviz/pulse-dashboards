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

import type { StatusTone } from "~@meetings/app/admin/ui/StatusBadge";

/**
 * The grading scale Label Studio raters follow, copied word for word from the
 * rater instructions so reviewers can check a grade against it.
 */
export const GRADING_SCALE: {
  grade: string;
  tone: StatusTone;
  text: string;
}[] = [
  {
    grade: "GOOD",
    tone: "good",
    text: "The output is broadly accurate and only contains small distortions or inaccuracies. A caseworker reading this note would have a reliable picture of the meeting. Mistakes that don't rise to the level of PARTIAL/BAD should still be noted in free text feedback.",
  },
  {
    grade: "PARTIAL",
    tone: "partial",
    text: "The output contains significant inaccuracies or problematic content, but nothing likely to cause real harm. \"Significant\" here means something that makes a material difference. Slight mischaracterizations, speculation, mistakes about timing that don't affect anything material, contradictions that are obviously resolved from context, or small exaggerations should be noted in the free text output but don't rise to the level of PARTIAL.",
  },
  {
    grade: "BAD",
    tone: "bad",
    text: "Not just inaccurate, but inaccurate in a way that could cause real harm to the client or materially affect a high-stakes decision related to a parole/probation violation if it stayed in the system of record. For example: it misleads a caseworker into thinking the client said or did something they did not, or omits a critical safety issue, in a way that could plausibly lead to a consequence like being sent back to prison for a parole violation, a change in risk level, another punitive action against the client, or a safety risk. This also includes incorrect information that itself could cause a violation to occur (e.g. an incorrect date that could cause an important deadline to be missed). BAD is reserved for the highest-scrutiny categories: violations, criminal activity, conditions of supervision (e.g. completing programming or failing to comply, travel outside certain areas), or risk to physical safety. Errors outside of that — e.g. logistics, appointment dates or locations, transportation details, which resources to use, housing/employment status, etc. — should be noted but graded GOOD or PARTIAL. Omissions almost never rise to the level of BAD.",
  },
  {
    grade: "N/A",
    tone: "neutral",
    text: "Use only when the audio was not clear enough to judge the output. Do not use N/A just because you disagree with the output.",
  },
];

export const GRADING_CLARIFICATIONS: string[] = [
  "Almost all mistakes related to employment are PARTIAL at most, as they wouldn’t impact a violation. Within employment, the only things that rise to the level of PARTIAL are mistakes in employer name or employment status, or egregious differences in things like wages. Other mistakes related to employment (mischaracterizing the company type, etc.) should be noted but don’t rise to PARTIAL.",
  "Similarly, almost all mistakes related to housing are PARTIAL at most. Only housing status (including e.g. whether they’re staying with family vs. renting, temporary vs. permanent housing) and housing location rise to the level of PARTIAL; other mistakes should be noted but don’t rise to that level.",
  "Mistakes related to financial obligations only count as PARTIAL if they're related to legal requirements.",
  "Mistakenly claiming that a client traveled outside a city/county/state can count as at least a PARTIAL mistake, if not BAD, because there are often travel restrictions. (You don’t need to know that particular client’s terms of supervision; unless specifically stated otherwise you can assume that there may be travel restrictions when you give your grade.)",
  "CLARIFY items should never be the reason for a PARTIAL/BAD grade, even if the issue is already clear and the clarification is unnecessary. In this case simply note this but don't use it to penalize the grade.",
  "Omitted action items should be noted, but almost never rise to the level of PARTIAL, unless there are no action items at all even though there should be, in which case the grade should be PARTIAL.",
  "Incorrect assignments of action items should be noted, almost never rise to the level of PARTIAL or BAD.",
  "Mistakes in action items related to the following should be noted but don’t count against the grade: potentially superfluous items (e.g. they may have already been completed), conditional items (e.g. \"update address if you move\" when the client doesn't plan to move), clarification items (even if the issue doesn't need clarification), an empty deadline field.",
];
