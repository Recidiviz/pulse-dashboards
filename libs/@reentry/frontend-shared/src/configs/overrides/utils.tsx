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

import type {
  GuardrailType,
  HardStopGuardrailType,
  SoftStopGuardrailType,
} from "../../websockets/eventTypes";
import { getIntakeTenantConfig } from "../tenantConfig";
import type { GuardrailCopyMap, GuardrailModalContent } from "../types";

export function buildGuardrailCopy(
  agencyName: string,
  overrides?: Partial<{
    crisis: GuardrailModalContent;
    harmToOthers: GuardrailModalContent;
    promptInjection: GuardrailModalContent;
  }>,
): GuardrailCopyMap {
  const crisis = overrides?.crisis ?? {
    title: "Assessment Paused for Safety",
    body: (
      <>
        Based on your message, it sounds like you may be going through a really
        difficult moment right now. You don't have to go through this alone.
        <br />
        <br />
        <strong>
          If you are in an {agencyName} facility, please talk to a staff member
          or counselor right away — they can help.
        </strong>{" "}
        To keep you safe, this chat has also been flagged to {agencyName} staff
        so they can help.
        <br />
        <br />
        You can reach the <strong>988 Suicide &amp; Crisis Lifeline</strong> by
        calling or texting <strong>988</strong>, anytime. Trained counselors
        will listen to you, provide support, and connect you to resources if
        necessary.
        <br />
        <br />
        When you are ready, contact the staff member who enabled this assessment
        for you to re-start it.
      </>
    ),
    buttonLabel: "Stop Assessment",
  };

  const harmToOthers = overrides?.harmToOthers ?? {
    title: "Assessment Paused for Safety",
    body: (
      <>
        Our system flagged your most recent message because it appears to
        indicate an intent to harm someone.{" "}
        <strong>
          If you need help managing these emotions or are in crisis, please
          notify a counselor or case manager right away.
        </strong>
        <br />
        <br />
        The assessment is temporarily locked. To keep everyone safe, this chat
        has been flagged for {agencyName} review.
        <br />
        <br />
        When you are ready, contact the staff member who enabled this assessment
        for you to re-start it.
      </>
    ),
    buttonLabel: "Stop Assessment",
  };

  const promptInjection = overrides?.promptInjection ?? {
    title: "Assessment paused",
    body: (
      <>
        Our system flagged your most recent message because it appeared to
        conflict with how this assessment is designed to work. This is an
        automated safety check.
        <br />
        <br />
        This assessment is only able to help with your intake questions. If you
        have other questions or concerns, please speak with an {agencyName}{" "}
        staff member.
      </>
    ),
    buttonLabel: "Continue Assessment",
  };

  return {
    crisis,
    "openai_moderation:self-harm": crisis,
    harm_to_others: harmToOthers,
    "openai_moderation:harm_to_others": harmToOthers,
    prompt_injection: promptInjection,
  };
}

const FALLBACK_CRISIS: GuardrailModalContent = {
  title: "Assessment Paused for Safety",
  body: (
    <>
      Based on your message, it sounds like you may be going through a really
      difficult moment right now. You don't have to go through this alone.
      <br />
      <br />
      <strong>
        If you are in a facility, please talk to a staff member or counselor
        right away — they can help.
      </strong>{" "}
      To keep you safe, this chat has also been flagged to staff so they can
      help.
      <br />
      <br />
      You can reach the <strong>988 Suicide &amp; Crisis Lifeline</strong> by
      calling or texting <strong>988</strong>, anytime. Trained counselors will
      listen to you, provide support, and connect you to resources if necessary.
      <br />
      <br />
      When you are ready, contact the staff member who enabled this assessment
      for you to re-start it.
    </>
  ),
  buttonLabel: "Stop Assessment",
};

const FALLBACK_HARM_TO_OTHERS: GuardrailModalContent = {
  title: "Assessment Paused for Safety",
  body: (
    <>
      Our system flagged your most recent message because it appears to indicate
      an intent to harm someone.{" "}
      <strong>
        If you need help managing these emotions or are in crisis, please notify
        a counselor or case manager right away.
      </strong>
      <br />
      <br />
      The assessment is temporarily locked. To keep everyone safe, this chat has
      been flagged for staff review.
      <br />
      <br />
      When you are ready, contact the staff member who enabled this assessment
      for you to re-start it.
    </>
  ),
  buttonLabel: "Stop Assessment",
};

const FALLBACK_SOFT_STOP: GuardrailModalContent = {
  title: "Assessment paused",
  body: (
    <>
      Our system flagged your most recent message because it appeared to
      conflict with how this assessment is designed to work. This is an
      automated safety check.
      <br />
      <br />
      This assessment is only able to help with your intake questions. If you
      have other questions or concerns, please speak with a staff member at the
      facility.
    </>
  ),
  buttonLabel: "Continue Assessment",
};

export function getGuardrailCopy(
  type: GuardrailType,
  stateCode: string | null | undefined,
): GuardrailModalContent {
  if (stateCode) {
    const stateCopy = getIntakeTenantConfig(stateCode).guardrails?.[type];
    if (stateCopy) return stateCopy;
  }
  if (type === "prompt_injection") return FALLBACK_SOFT_STOP;
  if (type === "crisis" || type === "openai_moderation:self-harm")
    return FALLBACK_CRISIS;
  return FALLBACK_HARM_TO_OTHERS;
}

export const GUARDRAIL_DISPLAY_NAMES: Record<
  HardStopGuardrailType | SoftStopGuardrailType,
  string
> = {
  crisis: "Mental health crisis / intent to self-harm",
  harm_to_others: "Intent to harm others",
  "openai_moderation:self-harm": "Mental health crisis / intent to self-harm",
  "openai_moderation:harm_to_others": "Intent to harm others",
  prompt_injection: "Prompt injection / adversarial use",
};

export function getGuardrailDisplayName(
  type: HardStopGuardrailType | SoftStopGuardrailType,
): string {
  return GUARDRAIL_DISPLAY_NAMES[type] ?? type;
}

export function formatGuardrailDisplayNames(
  types: (HardStopGuardrailType | SoftStopGuardrailType)[],
): string {
  return types.map(getGuardrailDisplayName).join(", ");
}
