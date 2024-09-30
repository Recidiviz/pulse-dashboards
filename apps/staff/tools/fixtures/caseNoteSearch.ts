// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { CaseNoteSearchRecordRaw } from "~datatypes";

export const caseNoteSearchData: CaseNoteSearchRecordRaw = {
  error: null,
  results: [
    {
      noteBody:
        "In today's session, Bill mentioned that his job is going well, but he is still struggling to find stable housing. He has been punctual for all his meetings and is working hard to comply with his parole conditions. Bill's sentencing evaluation looks promising, and we discussed strategies to improve his housing situation.",
      contactMode: "PSI Assigned Full",
      eventDate: "2024-03-12 12:39:00",
      documentId: "10007",
      extractiveAnswer:
        "In today&#39;s session, Bill mentioned that his job is going well, but he is still struggling to find stable housing.",
      noteTitle: "PSI Update",
      noteType: "PSI",
      preview:
        "In today&#39;s session, Bill mentioned that his job is going well, but he is still struggling to find stable <b>housing</b>. He has been punctual for all his meetings&nbsp;...",
      snippet:
        "In today&#39;s session, Bill mentioned that his job is going well, but he is still struggling to find stable <b>housing</b>. He has been punctual for all his meetings&nbsp;...",
    },
    {
      noteBody:
        "Bill was on time for today's meeting and reported that his job is stable, though he is still staying with a friend. We discussed potential housing options, and he is exploring a transitional housing program. His sentencing evaluation is on track, and Bill remains focused on meeting all his parole requirements.",
      contactMode: "19-2524 SUD Assessment",
      eventDate: "2023-08-12 12:39:00",
      documentId: "10008",
      extractiveAnswer:
        "Bill was on time for today&#39;s meeting and reported that his job is stable, though he is still staying with a friend. We discussed potential housing options, and he is exploring a transitional housing program. His sentencing evaluation is on track, and Bill remains focused on meeting all his parole requirements.",
      noteTitle: null,
      noteType: "SUD",
      preview:
        "Bill was on time for today&#39;s meeting and reported that his job is stable, though he is still staying with a friend. We discussed potential <b>housing</b> options, and&nbsp;...",
      snippet:
        "Bill was on time for today&#39;s meeting and reported that his job is stable, though he is still staying with a friend. We discussed potential <b>housing</b> options, and&nbsp;...",
    },
    {
      noteBody:
        "Bill attended today's session on time and shared that his job continues to go well. However, he is still searching for stable housing. We discussed various resources available to him, and he is considering a housing assistance program. Bill's sentencing evaluation is moving forward positively, and he remains committed to his rehabilitation.",
      contactMode: "PSI Assigned Full",
      eventDate: "2022-01-11 12:39:00",
      documentId: "10009",
      extractiveAnswer:
        "Bill attended today&#39;s session on time and shared that his job continues to go well. However, he is still searching for stable housing.",
      noteTitle: "Job Update",
      noteType: "PSI",
      preview:
        "Bill attended today&#39;s session on time and shared that his job continues to go well. However, he is still searching for stable <b>housing</b>. We&nbsp;...",
      snippet:
        "Bill attended today&#39;s session on time and shared that his job continues to go well. However, he is still searching for stable <b>housing</b>. We&nbsp;...",
    },
    {
      noteBody:
        "Alice arrived early for today's meeting and shared exciting news: she has been offered a full-time position at her job. Her housing situation remains stable, and she is saving money to move into her own place. We reviewed her sentencing evaluation, which is progressing positively. Alice is determined to stay on track.",
      contactMode: "PSI Submitted to Court/Uploaded",
      eventDate: "2024-01-01 12:39:00",
      documentId: "10003",
      extractiveAnswer:
        "Alice arrived early for today&#39;s meeting and shared exciting news: she has been offered a full-time position at her job. Her housing situation remains stable, and she is saving money to move into her own place. We reviewed her sentencing evaluation, which is progressing positively. Alice is determined to stay on track.",
      noteTitle: null,
      noteType: "PSI",
      preview:
        "Alice arrived early for today&#39;s meeting and shared exciting news: she has been offered a full-time position at her job. Her <b>housing</b> situation&nbsp;...",
      snippet:
        "Alice arrived early for today&#39;s meeting and shared exciting news: she has been offered a full-time position at her job. Her <b>housing</b> situation&nbsp;...",
    },
    {
      noteBody:
        "During our meeting today, Alice was punctual and provided an update on her housing search. She has found a potential apartment and is hopeful about securing it soon. Her job is going well, and her manager has praised her dedication. Alice's sentencing evaluation is proceeding smoothly, and she feels confident about her future.",
      contactMode: "Address",
      eventDate: "2024-03-12 12:39:00",
      documentId: "10004",
      extractiveAnswer:
        "Alice&#39;s sentencing evaluation is proceeding smoothly, and she feels confident about her future.",
      noteTitle: "Address Change",
      noteType: "Supervision Notes",
      preview:
        "During our meeting today, Alice was punctual and provided an <b>update</b> on her <b>housing</b> search. She has found a potential apartment and is hopeful about securing&nbsp;...",
      snippet:
        "During our meeting today, Alice was punctual and provided an <b>update</b> on her <b>housing</b> search. She has found a potential apartment and is hopeful about securing&nbsp;...",
    },
    {
      noteBody:
        "In today's meeting, Bill reported on time and mentioned that he is still employed and doing well at work. He is actively seeking stable housing and has applied for several housing programs. Bill's sentencing evaluation is progressing well, and he is determined to comply with all parole conditions to improve his situation.",
      contactMode: "PSI",
      eventDate: "2024-03-12 12:39:00",
      documentId: "10010",
      extractiveAnswer:
        "Bill&#39;s sentencing evaluation is progressing well, and he is determined to comply with all parole conditions to improve his situation.",
      noteTitle: null,
      noteType: "Supervision Notes",
      preview:
        "In today&#39;s meeting, Bill reported on time and mentioned that he is still employed and doing well at work. He is actively seeking stable <b>housing</b>&nbsp;...",
      snippet:
        "In today&#39;s meeting, Bill reported on time and mentioned that he is still employed and doing well at work. He is actively seeking stable <b>housing</b>&nbsp;...",
    },
    {
      noteBody:
        "During our meeting today, Alice informed me that she has secured permanent housing through a local shelter program. She is excited about her new job at a nearby grocery store, where she has been working for two weeks. Alice has been punctual to all her meetings and shows significant progress in her rehabilitation. We discussed her upcoming court appearance, and she feels confident about her sentencing evaluation.",
      contactMode: "Investigation",
      eventDate: "2024-03-12 12:39:00",
      documentId: "10001",
      extractiveAnswer:
        "We discussed her upcoming court appearance, and she feels confident about her sentencing evaluation.",
      noteTitle: null,
      noteType: "SUD",
      preview:
        "During our meeting today, Alice informed me that she has secured permanent <b>housing</b> through a local shelter program. She is excited about her new job at a&nbsp;...",
      snippet:
        "During our meeting today, Alice informed me that she has secured permanent <b>housing</b> through a local shelter program. She is excited about her new job at a&nbsp;...",
    },
    {
      noteBody:
        "Alice was early for today's meeting and shared good news about her job: she received a raise. She is still living at the shelter but has a promising lead on an apartment. We reviewed her sentencing evaluation, and everything is on track. Alice is motivated to continue her progress.",
      contactMode: "PSI",
      eventDate: "2024-03-12 12:39:00",
      documentId: "10005",
      extractiveAnswer:
        "Alice was early for today&#39;s meeting and shared good news about her job: she received a raise. She is still living at the shelter but has a promising lead on an apartment. We reviewed her sentencing evaluation, and everything is on track. Alice is motivated to continue her progress.",
      noteTitle: null,
      noteType: "Supervision Notes",
      preview:
        "Alice was early for today&#39;s meeting and shared good news about her job: she received a raise. She is still living at the shelter but has a promising lead on an apartment. We reviewed her sentencing evaluation, and everything is on track. Alice is motivated to continue her progress.",
      snippet: null,
    },
    {
      noteBody:
        "Bill reported a positive update in our session today: he found part-time work at a construction site, which has given him a sense of purpose. However, Bill expressed concerns about his current living situation, as he is staying with a friend temporarily. He has been on time for all our scheduled meetings and remains committed to his rehabilitation plan. We reviewed his sentencing evaluation, and he is optimistic about the outcome.",
      contactMode: "Email to PSI",
      eventDate: "2024-03-12 12:39:00",
      documentId: "10006",
      extractiveAnswer:
        "He has been on time for all our scheduled meetings and remains committed to his rehabilitation plan. We reviewed his sentencing evaluation, and he is optimistic about the outcome.",
      noteTitle: "Email",
      noteType: "SUD",
      preview:
        "Bill reported a positive <b>update</b> in our session today: he found part-time work at a construction site, which has given him a sense of purpose. However, Bill&nbsp;...",
      snippet:
        "Bill reported a positive <b>update</b> in our session today: he found part-time work at a construction site, which has given him a sense of purpose. However, Bill&nbsp;...",
    },
  ],
};
