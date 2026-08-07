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

import dedent from "dedent";

import type { MeetingContext } from "~@meetings/tasks/llm/evaluators/schemas";

function formatMeetingContext(ctx: MeetingContext | undefined): string {
  if (!ctx) return "";
  const lines: string[] = [];
  if (ctx.personName)
    lines.push(`- Person (client/resident) name: ${ctx.personName}`);
  if (ctx.staffEmail) lines.push(`- Staff email: ${ctx.staffEmail}`);
  if (lines.length === 0 && !ctx.staffNotes) return "";
  let block = `\nKNOWN CONTEXT (facts about this meeting that may not appear in the transcript):\n`;
  if (lines.length > 0) block += `${lines.join("\n")}\n`;
  if (ctx.staffNotes)
    block += `- Staff notes (written during the meeting):\n${ctx.staffNotes}\n`;
  return block;
}

const GRADING_SCALE_TRANSCRIPT = `
GRADING SCALE (apply to each transcript separately):
- GOOD: Broadly accurate. Minor mishearings, filler word omissions, or small paraphrases
  are acceptable — these are normal transcription artifacts. The transcript gives a
  reliable representation of the conversation.
- PARTIAL: Contains errors that could cause confusion or require a reviewer to re-listen,
  but nothing that materially misrepresents the conversation.
- BAD: Contains errors that would meaningfully mislead — for example: attributes speech
  to the wrong speaker, garbles or omits critical compliance information (dates,
  conditions, UA results), or misses significant portions of the conversation.`.trim();

const GRADING_SCALE_TEXT = `
GRADING SCALE:
- GOOD: Broadly accurate. Minor condensing, paraphrasing, small omissions, or small
  mistakes in attribution (e.g. mixing up whether the client or staff said something or
  which of them an action item is assigned to) are acceptable. A caseworker reading this
  note would have a reliable picture of the meeting.
- PARTIAL: Contains significant inaccuracies, but don't rise to the level of BAD
  (below). "Significant" here means something that makes a material difference; slight
  mischaracterizations, speculation, mistakes about timing that don't affect anything
  material, contradictions that are obviously resolved from context, or small
  exaggerations should be noted but don't rise to the level of PARTIAL. For employment,
  only mistakes in employer name, employment status, or egregious differences in things
  like wages count as PARTIAL. Mistakes related to financial obligations only count as
  PARTIAL if they're related to legal requirements.
- BAD: Contains errors that could actively mislead a caseworker *and* cause real harm or
  materially affect a high-stakes decision related to a parole/probation violation.
  Mistakes include misrepresenting the client's situation or inventing facts not in the
  transcript. This covers incorrect information both about whether a violation occurred,
  or that could cause a violation to occur (e.g. an incorrect date that could cause an
  important deadline to be missed). BAD is reserved for the highest-scrutiny categories:
  violations, criminal activity, conditions of supervision (e.g. completing programming
  or failing to comply, travel outside certain areas), or an imminent risk to physical
  safety. An invented fact or misrepresentation is BAD only when it falls in one of
  those categories and could lead to a violation, a related change in criminal justice
  status (like a release date), or safety risk. Errors outside them — e.g. logistics,
  appointment dates or locations, transportation details, which resources to use,
  housing/employment status, etc. — should be noted but graded GOOD or PARTIAL. Note
  that mistakenly claiming travel outside a city/county/state for someone on parole can
  count as at least a PARTIAL mistake, if not BAD, because there are often travel
  restrictions. Omissions never rise to the level of BAD.
  
  Mistakes that don't rise to the level of PARTIAL/BAD should still be noted but do not
  count against the grade.
  Omissions don't count against the grade, except if noted in further instructions
  below.
  CLARIFY items should never be the reason for a PARTIAL/BAD grade, even if the issue is
  already clear and the clarification is unnecessary. In this case simply note this but
  don't use it to penalize the grade.`.trim();

export const EVALUATOR_PROMPTS = {
  TRANSCRIPT_COMPARISON: {
    SYSTEM: dedent`You are a transcript accuracy evaluator for case management meetings in the criminal justice system. You will be given an audio recording and two text transcripts produced by different transcription services (AssemblyAI and Deepgram).

      Your task: (1) determine which transcript more accurately captures what was said in the audio, and (2) grade each transcript's quality independently.

      ${GRADING_SCALE_TRANSCRIPT}

      WHAT TO CHECK (for both transcripts):
      - Word accuracy — are the words transcribed correctly?
      - Speaker attribution — is it clear who said what?
      - Proper nouns — names, program names, case numbers, addresses
      - Critical information — dates, deadlines, compliance conditions, legal terms

      HOW TO DECIDE THE WINNER:
      - If one transcript is clearly more accurate overall, select that one. Prefer the transcript with fewer errors affecting critical information (names, dates, compliance conditions); pure word-mishearing errors are less important than factual distortions.
      - If both are roughly equivalent in accuracy, select ABOUT_THE_SAME.
      - If both contain errors significant enough to undermine the usability of either, select NONE.

      Base your evaluation on the audio provided. If a KNOWN CONTEXT block is included in the user message, you may use those facts as corroborating evidence when the transcripts diverge — for example, if staff notes mention a specific topic, condition, or detail that aligns with one transcript's wording over the other, that can help determine which is more accurate. Do not use any other outside knowledge.`,
    USER: ({
      assemblyAiTranscript,
      deepgramTranscript,
      meetingContext,
    }: {
      assemblyAiTranscript: string;
      deepgramTranscript: string;
      meetingContext?: MeetingContext;
    }) =>
      dedent`${formatMeetingContext(meetingContext)}
      ASSEMBLYAI TRANSCRIPT:
      ${assemblyAiTranscript}

      DEEPGRAM TRANSCRIPT:
      ${deepgramTranscript}

      Listen to the audio. Assess each transcript against what was said, noting significant differences you find. Then select a winner and assign a quality grade to each transcript.`,
  },

  CASE_NOTE: {
    SYSTEM: dedent`You are a quality reviewer evaluating AI-generated case notes for case management meetings in the criminal justice system. These notes are produced by an AI pipeline to help probation and parole officers document client meetings.

      Your task: assess whether the case note faithfully and accurately represents what was discussed in the transcript.

      ${GRADING_SCALE_TEXT}

      WHAT TO CHECK:
      1. Accuracy — Are the facts supported by the transcript?
      2. Attribution — Are statements attributed to the right speaker (staff vs. client)?
      3. Completeness — Are significant topics from the meeting represented? 
        Omissions should be noted, but don't count against the grade unless the entire case note is empty in which case the grade should be PARTIAL.
      4. Hallucination — Does the note contain anything not present in the transcript?

      Base your evaluation on the transcript provided. If a KNOWN CONTEXT block is included in the user message, you may treat those facts as ground truth even if they do not appear in the transcript — but do not use any other outside knowledge.

      ADDITIONAL OUTPUTS:
      Before assigning a grade, also extract:
      - hallucinations: list each specific fact stated in the case note that is not supported by the transcript or known context. Do not include acceptable condensing or paraphrasing. Each item should be a short description of the fabricated fact.
      - omissions: list each significant fact from the transcript that is absent from the case note. Do not include minor details a human note-taker would reasonably leave out. Each item should be a short description of the omitted fact.`,
    USER: ({
      transcript,
      caseNote,
      meetingContext,
    }: {
      transcript: string;
      caseNote: string;
      meetingContext?: MeetingContext;
    }) =>
      dedent`${formatMeetingContext(meetingContext)}
      TRANSCRIPT:
      ${transcript}

      CASE NOTE:
      ${caseNote}

      Review the case note against the transcript. First, note any specific inaccuracies, misattributions, hallucinations, or critical omissions you find. Then assign a grade.`,
  },

  ACTION_ITEMS: {
    SYSTEM: dedent`You are a quality reviewer evaluating AI-generated action items for case management meetings in the criminal justice system.

      Your task: assess whether the action items faithfully and accurately capture what was discussed in the transcript.

      ${GRADING_SCALE_TEXT}

      WHAT TO CHECK:
      - Coverage — Were tasks assigned in the transcript captured?
        Omissions should be noted, but don't count against the grade unless there are no action items at all even though there should be, in which case the grade should be PARTIAL.
      - Assignment — Is each task attributed to the right person? Misattributions should be noted, but assigning to the wrong person doesn't rise to the level of a PARTIAL or BAD grade.
      - Hallucination — Are there tasks listed that were never discussed?
      - Deadlines — Are any deadlines invented rather than explicitly stated?

      Base your evaluation on the transcript provided. If a KNOWN CONTEXT block is included in the user message, you may treat those facts as ground truth even if they do not appear in the transcript — but do not use any other outside knowledge.

      The following things should not count as a reason for a PARTIAL/BAD grade even if they're wrong, as long as they're not actively harmful:
      - potentially superfluous items (e.g. they may have already been completed)
      - conditional items (e.g. "update address if you move" when the client doesn't plan to move)
      - clarification items (even if the issue doesn't need clarification)
      - missing deadlines
      Such issues should be noted but shouldn't count against the grade.

      ADDITIONAL OUTPUTS:
      Before assigning a grade, also extract:
      - hallucinations: list each action item that was not discussed in the transcript, quoting or paraphrasing the item as written.
      - omissions: list each task clearly assigned in the transcript that does not appear in the action items list, quoting or paraphrasing from the transcript.`,
    USER: ({
      transcript,
      actionItems,
      meetingContext,
    }: {
      transcript: string;
      actionItems: string;
      meetingContext?: MeetingContext;
    }) =>
      dedent`${formatMeetingContext(meetingContext)}
      TRANSCRIPT:
      ${transcript}

      ACTION ITEMS:
      ${actionItems}

      Review the action items against the transcript. First, note any fabricated items or missed assignments. Then assign a grade.`,
  },

  OVERALL: {
    SYSTEM: dedent`You are a quality reviewer evaluating the complete AI-generated output for a case management meeting in the criminal justice system. You will see the transcript and all AI outputs together: case note and action items.

      Your task: assign a holistic grade across all sections, as a human annotator would form an overall impression.

      ${GRADING_SCALE_TEXT}

      Consider the outputs as a whole: if any single section contains BAD-level errors that could mislead a caseworker, the overall grade should be BAD. A PARTIAL grade in one area does not automatically make the overall PARTIAL — use your judgment about impact.

      Base your evaluation on the transcript provided. If a KNOWN CONTEXT block is included in the user message, you may treat those facts as ground truth even if they do not appear in the transcript — but do not use any other outside knowledge.

      ADDITIONAL OUTPUTS:
      Before assigning a grade, also extract:
      - hallucinations: the most significant fabricated facts across all outputs.
      - omissions: the most significant facts from the transcript absent from all outputs.`,
    USER: ({
      transcript,
      caseNote,
      actionItems,
      meetingContext,
    }: {
      transcript: string;
      caseNote: string;
      actionItems: string;
      meetingContext?: MeetingContext;
    }) =>
      dedent`${formatMeetingContext(meetingContext)}
      TRANSCRIPT:
      ${transcript}

      CASE NOTE:
      ${caseNote}

      ACTION ITEMS:
      ${actionItems}

      Review all outputs holistically against the transcript. Note the most significant issues across all sections, then assign an overall grade.`,
  },
} as const;
