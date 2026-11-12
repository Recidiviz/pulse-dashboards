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
  if (ctx.meetingStart)
    lines.push(
      `- Meeting date and time: ${ctx.meetingStart}. Treat that day as "today" when judging relative dates and deadlines.`,
    );
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
  violations; criminal activity; conditions of supervision (e.g. completing programming
  or failing to comply, travel outside certain areas); drug or alcohol test results and
  admissions of use; court dates and hearings; parole, release, or discharge dates;
  misconduct reports and program eligibility; or an imminent risk to physical safety.
  An error does not have to invent a violation to be BAD. An invented fact or
  misrepresentation is BAD only when it falls in one of
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
  don't use it to penalize the grade.
  A SUCCESS PLAN section, if present, is chosen by staff from a dropdown of standard
  options, so its wording is generic by design and isn't expected to be individualized
  to the client. As long as it's broadly appropriate to the meeting, treat it as fine.
  Issues in a SUCCESS PLAN section should still be noted, but should never be the reason
  for a BAD grade.`.trim();

// Added to the case note, action items and overall judges, before "Base your
// evaluation on the transcript provided". They make a single wrong high-stakes
// fact BAD, list mistakes the judges tended to miss in outputs QA rated BAD,
// and have the judge fact-check the output in its rationale before grading.
const HIGH_STAKES_INSTRUCTIONS = `HIGH-STAKES FACT CHECK:
Before grading, find every statement in the output about the topics below. For each one, locate the passage in the transcript (or KNOWN CONTEXT) it comes from and compare them detail by detail: numbers, dates, names, which item is which, and positive versus negative.
- Conditions of supervision and their exact terms, including numeric thresholds (e.g. a blood alcohol limit, a curfew time, a travel area, a no-contact order).
- Required programming or treatment: which program or class type, and how many sessions are done or remain. If the output speaks of requirements in general (e.g. "required classes") where the transcript distinguishes kinds (e.g. DV classes and DUI classes), check that the statement is true of each kind.
- Drug and alcohol test results: which test, its date, and whether it was positive/dirty or negative/clean. Keep the most recent result separate from earlier ones.
- Court dates, hearings and other legal deadlines, including which court or case each date belongs to.
- Contact details someone needs in order to comply, such as the email address or phone number required documents must be sent to. Check staff contact details against KNOWN CONTEXT.
- Compliance claims: if the client claims compliance (e.g. "my last test was clean", "I'm doing my classes") and staff or records in the meeting contradict it, the output must not present the claim as fact or without the contradiction.
When a speaker corrects an earlier statement, the correction is the fact.

When the output and the transcript disagree on one of these facts, the transcript (and KNOWN CONTEXT) is the record. Do not excuse the disagreement by assuming the transcript is garbled and the output corrected it, and do not substitute a typical or standard value from outside knowledge (for example a common legal blood alcohol limit). Such a mismatch is a factual error, not a minor detail, a transcription artifact, or an acceptable paraphrase, even when the rest of the output is accurate.
Grade it by its consequence using the scale above: if a caseworker or client acting on the output could miss or breach a condition, misjudge compliance (for example treat a positive test as clean, or a requirement as being met), or miss a court date, it is BAD. Court dates and hearings are legal obligations, not logistics; appointment dates and times with staff or providers remain logistics.
Only count a mismatch you can support by quoting both the output and the transcript passage it contradicts. If the output is a reasonable reading of the transcript, it is not a mismatch. If the transcript is ambiguous about a high-stakes fact, do not treat the output's version as confirmed: mark it UNCLEAR in the fact check below.

Grade each error by its consequence, not by how accurate the rest of the output is: a single error in one of the BAD categories above makes the grade BAD, even if everything else is excellent.

If leaving something out makes what the output does say wrong (for example, stating a curfew without the later time staff approved), treat it as an inaccuracy, not an omission.

Any factual error about the client's conditions of supervision, required classes or programs, drug or alcohol test results, court or other legal dates, release or discharge dates, or the contact details they need is BAD, however small it seems and however accurate the rest of the output is.

When you are unsure whether an error makes the output PARTIAL or BAD, grade it BAD.

These mistakes are easy to miss, so look for them specifically:
- two similar things merged or swapped, such as two court dates (a pre-trial and a trial date), two phone lines or check-in systems, two kinds of required class, or test results from different dates;
- an admission written as a denial, or a denial as an admission;
- a hypothetical, an example or a question written as a fact about the client;
- a place, date or time for a required test, hearing or check-in that differs from the transcript, including where the transcript is garbled or cuts out;
- a numeric limit or condition (such as an alcohol limit or a no-contact rule) written as stricter or looser than the transcript states;
- the most recent test result described as clean when the transcript says otherwise, or an earlier result given as the latest;
- an email address or phone number that differs from the transcript.
Each of these is a factual error in a BAD category.

Before grading, fact-check the output in your rationale. List every concrete factual claim in it, including the high-stakes facts above and each statement about what someone said, did, admitted or agreed to. For each, quote the transcript or KNOWN CONTEXT passage that bears on it and mark it SUPPORTED, CONTRADICTED, NOT FOUND or UNCLEAR. Then grade: a CONTRADICTED claim is an error, graded by its consequence using the scale above; an UNCLEAR or NOT FOUND claim about a high-stakes fact makes the output at least PARTIAL.

For drug and alcohol tests, list each test the transcript mentions with its date and result, and compare the output's account test by test, including which one is the most recent. Where the transcript is garbled, cut off or self-correcting at a high-stakes fact (such as where or when a test must be taken), mark the output's version UNCLEAR unless the transcript clearly supports it.`;

export const EVALUATOR_PROMPTS = {
  TRANSCRIPT_COMPARISON: {
    SYSTEM: dedent`You are a transcript accuracy evaluator for case management meetings in the criminal justice system. You will be given an audio recording and two text transcripts produced by different transcription services (AssemblyAI and Deepgram). Each transcript line starts with the m:ss time in the audio where that utterance begins.

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

  TRANSCRIPT_QUALITY: {
    SYSTEM: dedent`You are a transcript accuracy evaluator for case management meetings in the criminal justice system. You will be given an audio recording and a single text transcript of it. Each transcript line starts with the m:ss time in the audio where that utterance begins.

      Your task: listen to the audio and grade how faithfully the transcript captures what was said.

      ${GRADING_SCALE_TRANSCRIPT}

      WHAT TO CHECK:
      - Word accuracy — are the words transcribed correctly?
      - Speaker attribution — is it clear who said what?
      - Proper nouns — names, program names, case numbers, addresses
      - Critical information — dates, deadlines, compliance conditions, legal terms
      - Coverage — does the transcript span the whole recording?

      Base your evaluation on the audio provided. If a KNOWN CONTEXT block is included in the user message, you may use those facts as corroborating evidence. Do not use any other outside knowledge.

      ADDITIONAL OUTPUTS:
      Before assigning a grade, also extract:
      - missingSections: stretches of audible speech with no transcript output. Give each one's approximate m:ss time range and briefly describe what was said. Silence or inaudible audio does not count.
      - inaccuracies: words that are present but wrong (misheard terms, garbled names, wrong numbers or dates, wrong speaker), quoting the transcript and what was actually said. Skip minor mishearings that do not change meaning.`,
    USER: ({
      transcript,
      meetingContext,
    }: {
      transcript: string;
      meetingContext?: MeetingContext;
    }) =>
      dedent`${formatMeetingContext(meetingContext)}
      TRANSCRIPT:
      ${transcript}

      Listen to the audio. Note any speech the transcript misses and any words it gets wrong, then assign a quality grade.`,
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

      ${HIGH_STAKES_INSTRUCTIONS}

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
      - Deadlines — A deadline is acceptable if it was explicitly stated or clearly implied by the conversation (a named day, a concrete event, a stated schedule window). Relative references ("Thursday", "tomorrow") may be resolved against the meeting date and time given in KNOWN CONTEXT. Flag deadlines with no basis in the transcript, and note missing deadlines where the conversation clearly implied one.

      ${HIGH_STAKES_INSTRUCTIONS}

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

      ${HIGH_STAKES_INSTRUCTIONS}

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
