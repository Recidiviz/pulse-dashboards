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

/**
 * Hand-authored demo data for the Meetings module (US_DEMO).
 *
 * Each person below carries a real transcript and the downstream notetaking
 * output (case note, action items, critical updates, meeting minutes, staff
 * feedback) authored to match the current production prompts in
 * `~@meetings/tasks/llm/prompts`. The output is committed as a static fixture
 * so the demo seed stays deterministic and needs no LLM keys at deploy time.
 *
 * Shapes mirror what the live pipeline persists in `routes.ts`:
 * - actionItems            -> string[] of each item's task
 * - structuredActionItems  -> { task, assignee, deadline, context, evidenceQuotes }
 * - criticalUpdates        -> "Category - UpdateType: details"
 * - meetingSummary         -> MinuteSection[]
 * - staffFeedback          -> { whatYouDidWell, growthOpportunities }
 */

export type DemoActionItem = {
  task: string;
  assignee: "Staff Member" | "Client" | "Third Party";
  deadline?: string | null;
  context?: string | null;
  evidenceQuotes?: string[];
};

export type DemoCriticalUpdate = {
  category:
    | "Housing"
    | "Employment"
    | "Legal"
    | "Substance"
    | "Family"
    | "Health"
    | "Education"
    | "Other";
  updateType: "New" | "Change" | "Stable/Status Quo";
  details: string;
};

export type DemoMinuteItem = {
  timestamp?: string;
  content: string;
  status?: "Discussed" | "Completed" | "Assigned";
  subItems?: DemoMinuteItem[];
};

export type DemoMinuteSection = {
  title: string;
  items: DemoMinuteItem[];
};

export type DemoStaffFeedback = {
  whatYouDidWell: string[];
  growthOpportunities: string[];
};

export type DemoPerson = {
  /** Clients are on supervision (PO); residents are incarcerated (CM). */
  type: "client" | "resident";
  givenNames: string;
  surname: string;
  /** Meeting type, drawn from us_demo.yaml meetingTypes. */
  meetingType: string;
  /** Meeting length in minutes (from the source transcript). */
  durationMinutes: number;
  /** Raw speaker-labeled dialogue. Parsed into utterances at seed time. */
  transcript: string;
  caseNote: string;
  actionItems: DemoActionItem[];
  criticalUpdates: DemoCriticalUpdate[];
  meetingSummary: DemoMinuteSection[];
  staffFeedback: DemoStaffFeedback;
};

export type DemoUtterance = { speaker: string; text: string };

/**
 * Split raw "Speaker: text" dialogue into utterances. Speakers are the staff
 * role label (PO/CM) and the person's first name. Whitespace and line breaks
 * are normalized so single-line and multi-line transcripts both parse cleanly.
 */
export function parseTranscript(person: DemoPerson): DemoUtterance[] {
  const staffLabel = person.type === "client" ? "PO" : "CM";
  const firstName = person.givenNames;
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const speakerPattern = new RegExp(
    `(?:^|\\s)(${escape(staffLabel)}|${escape(firstName)}):\\s*`,
    "g",
  );

  const utterances: DemoUtterance[] = [];
  const matches = [...person.transcript.matchAll(speakerPattern)];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const speaker = match[1] === staffLabel ? staffLabel : firstName;
    const start = match.index + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : undefined;
    const text = person.transcript
      .slice(start, end)
      .replace(/\s+/g, " ")
      .trim();
    if (text) utterances.push({ speaker, text });
  }
  return utterances;
}

/** Friendly speaker label for display utterances (used by the seed). */
export function displaySpeaker(person: DemoPerson, rawSpeaker: string): string {
  if (rawSpeaker === "PO") return "Probation Officer";
  if (rawSpeaker === "CM") return "Case Manager";
  return `${person.givenNames} ${person.surname}`;
}

// ===========================================================================
// CLIENTS (on supervision — Probation Officer)
// ===========================================================================

const CLIENTS: DemoPerson[] = [
  // 1. Alta Kuvalis
  {
    type: "client",
    givenNames: "Alta",
    surname: "Kuvalis",
    meetingType: "Contact",
    durationMinutes: 15,
    transcript: `PO: Good morning, Alta. Come on in. How are things at the shelter this week?
Alta: It's okay, I guess. It's real loud. I didn't sleep much because the lady in the next bed was coughing all night. I'm just real tired today.
PO: I'm sorry to hear that. It's hard to get your life together when you aren't sleeping. Did you get a chance to go to the housing office like we talked about on Tuesday?
Alta: I went. I took the bus like you said. But the man there told me the waitlist is real long. He said maybe a year or more. I can't stay at the shelter for a year, Mr. Miller. People steal my socks. They even took my favorite hairbrush yesterday. It's not a good place for me.
PO: I know it's frustrating. Public housing is always a long wait. We need to look at "sober living" houses or transitional spots. They usually have openings faster. Would you be open to sharing a house with other women?
Alta: Does that mean I gotta share a room? I just want my own door.
PO: Most of the time you share a room at first. But it's much safer than the shelter. You'd have a real bed, a closet, and a kitchen to use.
Alta: A kitchen? Can I cook my own eggs? The shelter food is just mushy stuff in a tray. If I can cook my own eggs and maybe some toast, I'll go. I miss making my own food.
PO: Yes, you can cook your own meals there. I'll print out the list of three places. You need to call them today.
Alta: Can I use the phone here? I don't got no minutes left on my Safelink phone.
PO: You can use the phone in the lobby. Just tell the lady at the desk I said it was okay. You need to ask them for an "intake interview." Can you say that?
Alta: In-take in-ter-view. Okay. I'll do it right now. I just want to be somewhere where I can lock my stuff up and cook a meal.`,
    caseNote: `SUMMARY: Routine supervision contact focused on housing instability. Client remains at an emergency shelter and reports the environment is unsafe and disruptive to sleep. Discussed transitional/sober-living options as a faster alternative to the public housing waitlist. Client agreed to begin outreach the same day.

HOUSING: Client reports she went to the housing office on Tuesday as planned but was told the public housing waitlist is approximately one year. She states the shelter is loud, she is not sleeping, and personal items (socks, hairbrush) have been stolen. Officer presented women's sober-living/transitional housing as a faster option. Client's main hesitations were sharing a room and losing privacy; she was reassured by the availability of a lockable space and a kitchen to cook her own meals, and agreed to pursue it.

BARRIERS: Client has no remaining minutes on her Safelink phone; officer authorized her to use the lobby phone to make intake calls today.`,
    actionItems: [
      {
        task: "Call the three transitional/sober-living houses and request an intake interview",
        assignee: "Client",
        deadline: "Today",
        context:
          "Public housing waitlist is ~1 year; shelter is unsafe. Use the lobby phone since her Safelink phone is out of minutes.",
        evidenceQuotes: [
          "I'll print out the list of three places. You need to call them today.",
          "Okay. I'll do it right now.",
        ],
      },
      {
        task: "Print the list of three sober-living / transitional housing options for the client",
        assignee: "Staff Member",
        deadline: null,
        context: "Faster alternative to the public housing waitlist.",
        evidenceQuotes: ["I'll print out the list of three places."],
      },
    ],
    criticalUpdates: [
      {
        category: "Housing",
        updateType: "New",
        details:
          "Staying at an emergency shelter she describes as unsafe (theft of personal items) and disruptive to sleep. Public housing waitlist quoted at ~1 year; pivoting to women's sober-living/transitional housing.",
      },
      {
        category: "Other",
        updateType: "Stable/Status Quo",
        details:
          "No remaining minutes on her Safelink phone, limiting her ability to make calls.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content: "Client reports poor sleep and theft at the shelter.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[03:00]",
            content: "Housing options",
            status: "Discussed",
            subItems: [
              {
                content:
                  "Confirmed she went to the housing office Tuesday; public housing waitlist ~1 year.",
              },
              {
                content:
                  "Officer recommended sober-living/transitional housing as a faster path.",
              },
            ],
          },
          {
            timestamp: "[08:00]",
            content:
              "Client priorities: a lockable space of her own and a kitchen to cook her own meals.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content:
              "Staff: Authorized use of the lobby phone for intake calls.",
            status: "Completed",
          },
          {
            content: "Staff: Print list of three housing options.",
            status: "Assigned",
          },
          {
            content:
              "Client: Call all three houses today to request an intake interview.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "When Alta resisted sharing a room, the officer connected the move to what she actually cared about, a real bed and a kitchen to cook her own meals, and she agreed.",
        'He had her repeat the phrase "intake interview" so she would know exactly what to ask for on the call.',
      ],
      growthOpportunities: [
        'When Alta described things being stolen and not feeling safe, a brief reflection like "It sounds like that place doesn\'t feel safe to you" might have helped her feel heard before moving to logistics.',
      ],
    },
  },

  // 2. Christiana Mertz
  {
    type: "client",
    givenNames: "Christiana",
    surname: "Mertz",
    meetingType: "Contact",
    durationMinutes: 25,
    transcript: `PO: Hey Christiana, thanks for coming in. How's the sobriety going?
Christiana: It's good. I'm 14 days today. I got my chip from the meeting on Sunday.
PO: That's a big deal. Two weeks is huge. How are the meetings feeling?
Christiana: They're okay. Some of the people talk a lot, you know? But I like the lady who leads it. She's nice. She told me I should get a sponsor but I'm shy. I don't like asking people for help.
PO: A sponsor is just someone to call when you feel like you might mess up. It's important. Let's talk about your kids. Have you seen them?
Christiana: My mom let me see them for two hours on Saturday. We went to the park. It was hard. My littlest one didn't want to hold my hand at first. He's only four, he don't understand why I was gone. It made me want to cry right there in the grass.
PO: That's a natural feeling. It takes time to build that trust back. What about work? Are you still at the diner?
Christiana: Yeah, but the boss is mean. He gave me the early shift, 5 AM. It's hard to get the bus that early. I have to walk six blocks in the dark. I'm scared someone is gonna mess with me. And the pay isn't great. I worked 30 hours and my check was real small after they took out the child support.
PO: I know it feels like you're working for nothing sometimes, but staying employed is part of your plan. If you stay there for three months, I can help you look for that warehouse job that pays more.
Christiana: Three months feels like forever. I just want my kids back in my house. My mom says I need a bigger place first.
PO: One step at a time. Sobriety first, then the job, then the house. You can't skip the steps.
Christiana: I know. I'm trying. I just get lonely at night. That's when I want to use. When the house is quiet and I'm thinking about all the stuff I messed up.
PO: That's exactly why you need that sponsor. Someone to call at 9 PM when it's quiet. Will you promise me you'll ask that lady at the meeting about a sponsor this week?
Christiana: I'll try. I'll put it in my phone so I don't forget.`,
    caseNote: `SUMMARY: Routine contact. Client is engaged in recovery, employed, and beginning supervised contact with her children. She identified loneliness at night as her primary relapse trigger. Plan centers on obtaining a sponsor and maintaining employment.

SUBSTANCE USE: Client reports 14 days sober and received a chip at her Sunday meeting. She attends meetings but has not yet secured a sponsor, citing shyness about asking for help. She named night-time loneliness as the moment she is most tempted to use.

FAMILY: Client had a two-hour supervised visit with her children at the park on Saturday, arranged through her mother. She described it as emotionally difficult, noting her four-year-old was initially hesitant. Reunification is her stated long-term goal; her mother has indicated she will need larger housing first.

EMPLOYMENT: Client is working ~30 hours/week at a diner. She raised concerns about a 5 AM shift requiring a six-block walk in the dark and reduced take-home pay after child-support withholding. Officer encouraged retention, with a path to a higher-paying warehouse job after three months.`,
    actionItems: [
      {
        task: "Ask the meeting facilitator about getting a sponsor",
        assignee: "Client",
        deadline: "This week",
        context:
          "Identified night-time loneliness as her main relapse trigger; a sponsor gives her someone to call.",
        evidenceQuotes: [
          "Will you promise me you'll ask that lady at the meeting about a sponsor this week?",
          "I'll try. I'll put it in my phone so I don't forget.",
        ],
      },
      {
        task: "Help the client look into a higher-paying warehouse job once she reaches three months of employment",
        assignee: "Staff Member",
        deadline: null,
        context: "Current diner pay is low after child-support withholding.",
        evidenceQuotes: [
          "If you stay there for three months, I can help you look for that warehouse job that pays more.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Substance",
        updateType: "Change",
        details:
          "14 days sober, received a chip at Sunday's meeting. Attends meetings but has no sponsor yet. Reports night-time loneliness as her primary relapse trigger.",
      },
      {
        category: "Family",
        updateType: "New",
        details:
          "Had a two-hour supervised visit with her children (incl. a 4-year-old) at the park on Saturday via her mother. Reunification is her goal; mother says she needs larger housing first.",
      },
      {
        category: "Employment",
        updateType: "Stable/Status Quo",
        details:
          "Working ~30 hrs/week at a diner. Concerns about a 5 AM shift (six-block walk in the dark, safety) and low take-home pay after child-support withholding.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content: "Client reports 14 days sober; received her chip Sunday.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[02:00]",
            content: "Recovery meetings",
            status: "Discussed",
            subItems: [
              {
                content:
                  "Likes the facilitator; has not asked for a sponsor due to shyness.",
              },
            ],
          },
          {
            timestamp: "[06:00]",
            content:
              "Family — supervised visit with children was emotionally difficult.",
            status: "Discussed",
          },
          {
            timestamp: "[12:00]",
            content:
              "Employment — diner job, early-shift safety and low pay concerns.",
            status: "Discussed",
          },
          {
            timestamp: "[18:00]",
            content:
              "Relapse triggers — loneliness at night identified as highest-risk time.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Client: Ask the facilitator about a sponsor this week.",
            status: "Assigned",
          },
          {
            content:
              "Plan reaffirmed: sobriety, then employment stability, then housing.",
            status: "Discussed",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "When Christiana said she gets lonely at night and wants to use, the officer linked that exact moment to why a sponsor matters, someone to call at 9 PM, instead of giving a generic warning.",
        "He reframed the slow timeline into concrete steps (sobriety, job, then housing), which gave her a path rather than a lecture.",
      ],
      growthOpportunities: [
        'When she said the supervised visit made her want to cry, a reflection like "That sounds like it was really painful, even though it went okay" might have let her sit with the progress before moving on to work.',
      ],
    },
  },

  // 3. D'angelo Vandervort
  {
    type: "client",
    givenNames: "D'angelo",
    surname: "Vandervort",
    meetingType: "Contact",
    durationMinutes: 10,
    transcript: `PO: D'angelo, good to see you. You look like you just got off work.
D'angelo: I did. I'm working that graveyard shift at the City Car Wash. Man, my hands are all dried out from the soap, but I'm getting those hours in.
PO: That's what I like to hear. Did you bring your pay stub?
D'angelo: Right here. (Hands over paper). I got 40 hours last week. I even got five hours of overtime because someone called in sick.
PO: This looks great. You're making progress. Now, about that $50 restitution payment, can you make that this week?
D'angelo: I can do it Friday. I gotta pay my mom back for the phone she got me first. She's been real stressed about her bills, so I told her I'd give her a hundred bucks. But I got enough for the court too.
PO: Make sure you get a receipt from the clerk's office. I need to see it next time.
D'angelo: I will. I don't want no trouble. I'm just trying to stay busy. When I'm working, I don't have time to hang out on the corner.
PO: That's the best way to do it. Keep those hands busy. I'll see you in two weeks.
D'angelo: See ya, boss.`,
    caseNote: `SUMMARY: Brief routine contact. Client is employed full-time with overtime and is on track with restitution. Positive, compliant engagement.

EMPLOYMENT: Client is working the graveyard shift at City Car Wash. He provided a pay stub showing 40 hours plus 5 hours of overtime last week. He frames steady work as a way to stay out of trouble ("when I'm working, I don't have time to hang out on the corner").

LEGAL/FINANCIAL: Client committed to making his $50 restitution payment on Friday. He noted competing obligations (repaying his mother ~$100 for a phone) but confirmed he has enough for both. Officer instructed him to obtain a receipt from the clerk's office.`,
    actionItems: [
      {
        task: "Make the $50 restitution payment at the clerk's office and obtain a receipt",
        assignee: "Client",
        deadline: "Friday",
        context: "Officer needs to see the receipt at the next visit.",
        evidenceQuotes: [
          "about that $50 restitution payment, can you make that this week?",
          "I can do it Friday.",
          "Make sure you get a receipt from the clerk's office.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Employment",
        updateType: "Stable/Status Quo",
        details:
          "Working the graveyard shift at City Car Wash; pay stub shows 40 hours plus 5 hours overtime last week.",
      },
      {
        category: "Legal",
        updateType: "Stable/Status Quo",
        details:
          "On track with restitution; $50 payment planned for Friday. Balancing repayment of a ~$100 personal debt to his mother.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content: "Client arrived directly from his graveyard shift.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[01:30]",
            content:
              "Employment verification — submitted pay stub (40 hrs + 5 hrs OT).",
            status: "Completed",
          },
          {
            timestamp: "[04:00]",
            content: "Restitution — confirmed plan to pay $50 on Friday.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content:
              "Client: Pay $50 restitution Friday and bring receipt to next visit.",
            status: "Assigned",
          },
          { content: "Next contact in two weeks.", status: "Discussed" },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "The officer affirmed the client's own strategy, that staying busy with work keeps him off the corner, which reinforced a plan the client already believes in.",
      ],
      growthOpportunities: [],
    },
  },

  // 4. Grady Mante
  {
    type: "client",
    givenNames: "Grady",
    surname: "Mante",
    meetingType: "Contact",
    durationMinutes: 30,
    transcript: `PO: Grady, how are you holding up? You looked a little stressed when you walked in.
Grady: I am stressed. It's my mom. She's real sick, like her heart isn't working right. She needs me to take her to the doctor three times a week.
PO: I'm sorry to hear that. That's a lot on your plate. How are you getting her there?
Grady: That's the problem. I don't got no license. I tried to get it, but the DMV said I got a "hold" from Ohio. I ain't been to Ohio in ten years! I don't know what they want from me.
PO: It's probably an old ticket or a fine. I can look into the system and see what the hold is for. But until then, you cannot drive. I mean it, Grady.
Grady: But the bus takes two hours! My mom can't sit on a bus for two hours. She gets dizzy. Sometimes I just want to take her car and drive her. It's only ten minutes away.
PO: Grady, listen to me. If you get pulled over, you are going back to jail. There is no "emergency" that a judge will care about if you're driving on a suspended license. Do you want to go back?
Grady: No. I hate it in there.
PO: Then don't do it. Have you looked at the medical transport through her insurance?
Grady: I don't know how to do that. I'm not good with all the phone calls and the waiting. They ask me for numbers I don't have.
PO: Give me the name of her insurance. I'll help you find the number. You call them and tell them she needs a "medical van." They will come to the house and pick her up.
Grady: For real? That would be a huge help. I wouldn't have to worry about the bus or the driving.
PO: We'll look it up before you leave. How are you doing with your own requirements? Any issues with the neighbors?
Grady: No, I stay in the house. I just watch TV and help my mom. I don't go out at night. I don't want no trouble with the police. I just want my mom to get better.
PO: Stay focused on that. Let's look up that insurance info now.`,
    caseNote: `SUMMARY: Routine contact dominated by a transportation crisis tied to caregiving. Client is the primary caregiver for his seriously ill mother but cannot legally drive due to an out-of-state license hold. Officer reinforced the driving prohibition and offered a concrete alternative.

LEGAL: Client reports the DMV will not issue a license due to a "hold" originating in Ohio (states he has not been there in ten years; likely an old ticket/fine). Officer agreed to look up the basis of the hold and firmly reiterated that driving on a suspended license would result in custody. Client verbalized understanding and denied any other police contact.

FAMILY/HEALTH: Client's mother has a serious cardiac condition requiring medical appointments three times per week. The two-hour bus trip is not viable for her. Client expressed temptation to drive her himself but was redirected toward insurance-funded medical transport.

STABILITY: Client reports staying home, helping his mother, and avoiding night-time activity and negative contacts.`,
    actionItems: [
      {
        task: 'Call the mother\'s insurance to arrange non-emergency medical transport (a "medical van") for her appointments',
        assignee: "Client",
        deadline: null,
        context:
          "Client cannot legally drive; the two-hour bus trip is not viable for his mother. Officer to help locate the phone number before he leaves.",
        evidenceQuotes: [
          'You call them and tell them she needs a "medical van." They will come to the house and pick her up.',
          "For real? That would be a huge help.",
        ],
      },
      {
        task: "Look up the basis of the client's Ohio DMV license hold",
        assignee: "Staff Member",
        deadline: null,
        context:
          "Client says he hasn't been to Ohio in ten years; likely an old ticket or fine.",
        evidenceQuotes: [
          "I can look into the system and see what the hold is for.",
        ],
      },
      {
        task: "Help the client locate his mother's insurance medical-transport phone number before he leaves today",
        assignee: "Staff Member",
        deadline: "Today",
        context: "Client struggles with phone systems and required numbers.",
        evidenceQuotes: [
          "Give me the name of her insurance. I'll help you find the number.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Legal",
        updateType: "New",
        details:
          "DMV license hold originating from Ohio is preventing licensure. Client cannot legally drive; counseled on consequences of driving on a suspended license.",
      },
      {
        category: "Family",
        updateType: "New",
        details:
          "Primary caregiver for his mother, who has a serious cardiac condition and needs transport to appointments three times per week.",
      },
      {
        category: "Health",
        updateType: "New",
        details:
          "Mother's heart condition and dizziness make the two-hour bus trip unworkable; pursuing insurance medical transport.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content:
              "Client presented visibly stressed; disclosed caregiving strain.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[02:00]",
            content: "Transportation barrier",
            status: "Discussed",
            subItems: [
              {
                content:
                  "Ohio DMV hold prevents licensure; client cannot drive.",
              },
              {
                content:
                  "Officer firmly reiterated the driving prohibition and its consequences.",
              },
            ],
          },
          {
            timestamp: "[14:00]",
            content:
              "Medical transport alternative identified through mother's insurance.",
            status: "Discussed",
          },
          {
            timestamp: "[24:00]",
            content:
              "Compliance check — client reports staying home, no negative contacts.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Staff: Look up the basis of the Ohio license hold.",
            status: "Assigned",
          },
          {
            content:
              "Staff: Help client find the insurance medical-transport number before he leaves.",
            status: "Assigned",
          },
          {
            content:
              "Client: Call insurance to schedule a medical van for his mother.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "When Grady said he was tempted to just drive his mom, the officer was direct about the consequence of going back to jail, which is appropriate for a clear compliance risk.",
        'He turned a hard "no" into a workable plan by offering insurance medical transport, so the client left with a real solution instead of just a prohibition.',
      ],
      growthOpportunities: [
        'Right after the firm warning, a short reflection like "I can hear how worried you are about getting her to the doctor" might have acknowledged his fear before moving into logistics.',
      ],
    },
  },

  // 5. Hudson Purdy
  {
    type: "client",
    givenNames: "Hudson",
    surname: "Purdy",
    meetingType: "Contact",
    durationMinutes: 5,
    transcript: `PO: Hudson, you know why you're here. You missed your drug test on Monday.
Hudson: Man, I'm so sorry. My phone died and I didn't have no charger. I forgot what day it was. I woke up and thought it was Sunday.
PO: That's not a good excuse, Hudson. You have a schedule. You need to write it down on a piece of paper and put it on your fridge.
Hudson: I got a charger now. My cousin gave me one. My alarm is set for all the days now. I'm clean, I swear. I can go do the test right now if you want.
PO: You're going right now. I already called the lab. If you miss another one, I have to write you up. Do you understand?
Hudson: I got it. I'm going straight there. No stops.
PO: Good. I'll be checking the results tomorrow. Get moving.`,
    caseNote: `SUMMARY: Brief contact addressing a missed drug test. Client attributed the missed Monday test to a dead phone and losing track of the day. Officer directed an immediate test and issued a clear warning regarding future misses.

SUBSTANCE USE / COMPLIANCE: Client missed his scheduled UA on Monday. He denied use, attributed the miss to a dead phone, and reported he now has a charger and alarms set. Officer arranged for an immediate test at the lab and advised that another miss will result in a write-up. Results to be reviewed the following day.`,
    actionItems: [
      {
        task: "Report to the lab immediately for the drug test the officer already scheduled",
        assignee: "Client",
        deadline: "Today",
        context: "Makeup for the missed Monday UA.",
        evidenceQuotes: [
          "You're going right now. I already called the lab.",
          "I'm going straight there. No stops.",
        ],
      },
      {
        task: "Write down the testing schedule and post it on the fridge",
        assignee: "Client",
        deadline: null,
        context:
          "Soft mandate from the officer to prevent future missed tests.",
        evidenceQuotes: [
          "You need to write it down on a piece of paper and put it on your fridge.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Substance",
        updateType: "New",
        details:
          "Missed scheduled UA on Monday (attributed to a dead phone). Denies use; sent for an immediate makeup test. Warned that another miss results in a write-up.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:10]",
            content: "Officer opened with the missed Monday drug test.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[00:40]",
            content:
              "Client's explanation — dead phone, lost track of the day; reports new charger and alarms set.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Client: Report to the lab immediately for a makeup UA.",
            status: "Assigned",
          },
          {
            content: "Client: Post testing schedule on the fridge.",
            status: "Assigned",
          },
          {
            content: "Staff: Review results tomorrow; next miss = write-up.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "The officer set a clear, firm expectation for the missed test and an immediate makeup, which is the appropriate response to a compliance violation.",
      ],
      growthOpportunities: [
        "Before closing, a single open question like \"What's your plan to make sure Monday doesn't happen again?\" might have had Hudson commit to his own fix rather than only being told what to do.",
      ],
    },
  },

  // 6. Jewel Hilpert
  {
    type: "client",
    givenNames: "Jewel",
    surname: "Hilpert",
    meetingType: "Contact",
    durationMinutes: 15,
    transcript: `PO: Jewel, it's good to see you. You look a lot calmer today.
Jewel: I feel better. Those new pills the doctor gave me... they make me real sleepy in the morning, but my head isn't so loud.
PO: "Loud" how?
Jewel: Just like, everyone is talking at once in there. And I get mad real easy. But now, if someone bumps me at the store, I just say "excuse me" and keep going. Before, I would've yelled at them.
PO: That's a huge improvement. Are you taking them every day?
Jewel: Every morning with my coffee. I even started a little garden in my window. I got some tomatoes and some flowers. It gives me something to do so I don't just sit and think.
PO: I love that. Taking care of something else helps you take care of yourself. Are you still going to your clinic appointments?
Jewel: Every two weeks. The doctor is nice. He asks me about my garden too.
PO: Keep it up, Jewel. You're doing exactly what you need to do. Do you need any help with food or anything this month?
Jewel: I'm okay for now. I got my food stamps yesterday. I'm gonna buy some more dirt for my plants.
PO: Sounds like a plan. See you next month.`,
    caseNote: `SUMMARY: Routine contact. Client is stable and showing strong progress with mental-health treatment and medication adherence. No unmet needs this period.

HEALTH: Client reports a new medication is effectively managing her symptoms (describes reduced internal "noise" and improved emotional regulation), with morning drowsiness as a side effect. She is taking it daily and attending clinic appointments every two weeks. She has adopted a window garden as a healthy coping activity.

BASIC NEEDS: Client confirmed she received her food stamps and reported no need for additional food or resource assistance this month.`,
    actionItems: [
      {
        task: "Continue daily medication and biweekly clinic appointments",
        assignee: "Client",
        deadline: null,
        context: "Client is stable and adherent; reinforcing the current plan.",
        evidenceQuotes: [
          "Every morning with my coffee.",
          "Every two weeks. The doctor is nice.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Health",
        updateType: "Change",
        details:
          "New medication is improving symptom control and emotional regulation (side effect: morning drowsiness). Adherent daily; attending clinic every two weeks. Using a window garden as a coping strategy.",
      },
      {
        category: "Other",
        updateType: "Stable/Status Quo",
        details:
          "Received food stamps; no additional resource needs this month.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content: "Client presented noticeably calmer than prior visits.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[01:00]",
            content: "Mental health",
            status: "Discussed",
            subItems: [
              {
                content:
                  "New medication reduced symptoms; taken daily with morning drowsiness.",
              },
              {
                content:
                  "Attending clinic every two weeks; started a window garden as coping.",
              },
            ],
          },
          {
            timestamp: "[11:00]",
            content: "Basic needs — food stamps received; no additional needs.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content:
              "Client: Continue daily medication and biweekly appointments.",
            status: "Assigned",
          },
          { content: "Next contact next month.", status: "Discussed" },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        'When Jewel mentioned her garden, the officer tied it back to her own care ("taking care of something else helps you take care of yourself"), affirming a healthy habit in her own terms.',
        "He proactively checked whether she needed food or other help this month rather than assuming stability.",
      ],
      growthOpportunities: [],
    },
  },

  // 7. Joan Tillman
  {
    type: "client",
    givenNames: "Joan",
    surname: "Tillman",
    meetingType: "Contact",
    durationMinutes: 20,
    transcript: `PO: Joan, how are things at your apartment? I heard there was some noise at your building.
Joan: Oh man, it was scary. The guy in 3B, he's always drinking and yelling. On Saturday night, he started hitting the walls and throwing stuff. The police came.
PO: Did the police talk to you?
Joan: They knocked on my door and asked if I heard anything. I told them yeah, he's been yelling for an hour. They didn't take my name or nothing, they just went to his door.
PO: Did they arrest him?
Joan: They took him out in handcuffs. He was yelling at me while they walked him past. He said I was a "snitch" even though I wasn't the one who called. I'm scared he's gonna come back and mess with me.
PO: He's probably going to be gone for a few days. Does the landlord know?
Joan: I called the landlord, but he just said "I'll look into it." He don't care as long as he gets his money.
PO: If you feel unsafe, you need to tell me. We can look at moving you if it gets worse. But for now, just keep your door locked. Don't talk to him if he comes back.
Joan: I stay in my room. I don't even go out for mail if I hear someone in the hall. I'm doing my best to stay out of trouble. I don't want the police at my door ever again.
PO: You did the right thing by telling me. I'll make a note that you were just a witness. How's your job going?
Joan: It's okay. I'm cleaning the offices downtown. It's quiet and no one bothers me. I like working at night.
PO: That's good. Keep staying low-key. We'll talk again in two weeks.`,
    caseNote: `SUMMARY: Routine contact. Client reported a frightening incident with a neighbor that resulted in police presence at her building; she was a witness only. Officer documented her witness status and discussed safety planning. Employment is stable.

LEGAL: A neighbor (Apt 3B) was arrested at the building Saturday night after a disturbance. Police questioned the client as a witness; she was not the reporting party and was not named. The neighbor called her a "snitch" as he was removed. Officer will note that the client's involvement was as a witness only.

HOUSING / SAFETY: Client fears retaliation when the neighbor returns. The landlord was notified but unresponsive. Officer advised her to keep her door locked, avoid contact, and report immediately if she feels unsafe; relocation was offered as a contingency if the situation escalates.

EMPLOYMENT: Client is employed cleaning downtown offices on a night schedule, which she finds low-stress.`,
    actionItems: [
      {
        task: "Contact the officer immediately if she feels unsafe or the neighbor returns and bothers her",
        assignee: "Client",
        deadline: null,
        context:
          "Client fears retaliation; relocation is a contingency option if it escalates.",
        evidenceQuotes: [
          "If you feel unsafe, you need to tell me.",
          "just keep your door locked. Don't talk to him if he comes back.",
        ],
      },
      {
        task: "Document that the client's involvement in the Saturday incident was as a witness only",
        assignee: "Staff Member",
        deadline: null,
        context:
          "Client was questioned by police but was not the reporting party.",
        evidenceQuotes: ["I'll make a note that you were just a witness."],
      },
    ],
    criticalUpdates: [
      {
        category: "Legal",
        updateType: "New",
        details:
          "Witness to a neighbor's arrest at her building Saturday. Police questioned her; not the reporting party and not named. No client legal exposure.",
      },
      {
        category: "Housing",
        updateType: "New",
        details:
          'Fears retaliation from an arrested neighbor (Apt 3B) who called her a "snitch." Landlord notified but unresponsive. Relocation discussed as a contingency.',
      },
      {
        category: "Employment",
        updateType: "Stable/Status Quo",
        details:
          "Employed cleaning downtown offices on a night schedule; finds it low-stress.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content:
              "Officer opened on the reported disturbance at the client's building.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[01:00]",
            content: "Neighbor incident",
            status: "Discussed",
            subItems: [
              {
                content:
                  "Neighbor in 3B arrested Saturday; client questioned as a witness only.",
              },
              {
                content:
                  'Neighbor called her a "snitch"; she fears retaliation.',
              },
            ],
          },
          {
            timestamp: "[10:00]",
            content:
              "Safety planning — keep door locked, avoid contact, report if unsafe; relocation as contingency.",
            status: "Discussed",
          },
          {
            timestamp: "[16:00]",
            content: "Employment — stable night cleaning job.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Staff: Note client's witness-only status.",
            status: "Assigned",
          },
          {
            content: "Client: Report immediately if she feels unsafe.",
            status: "Assigned",
          },
          { content: "Next contact in two weeks.", status: "Discussed" },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        'The officer affirmed Joan for reporting the incident ("You did the right thing by telling me"), which reinforces that being honest with him is safe.',
        "He offered a concrete safety net, documenting her witness status and offering relocation, so her fear of retaliation was met with action.",
      ],
      growthOpportunities: [
        "When Joan said she was scared he'd come back, a reflection like \"It sounds like you don't feel safe in your own apartment right now\" might have validated her fear before moving to the safety steps.",
      ],
    },
  },

  // 8. Lenny Mosciski
  {
    type: "client",
    givenNames: "Lenny",
    surname: "Mosciski",
    meetingType: "Contact",
    durationMinutes: 7,
    transcript: `PO: Lenny, quick check-in. Did you get that phone situation fixed?
Lenny: Yeah, I got a new number. It's 555-0199. Write that down. My old one got cut off because I couldn't pay the bill.
PO: Got it. 555-0199. Are you still at your uncle's place?
Lenny: Yeah. He's being okay. He makes me do all the dishes and take out the trash, but it's better than the street. He said I can stay as long as I don't bring no friends over.
PO: That's a fair rule. Are you following it?
Lenny: Yeah. I don't want my friends there anyway. They just want to smoke and drink. I'm trying to stay clean.
PO: Good. How's the job hunt?
Lenny: I put in three papers yesterday. The grocery store and the car parts place. I'm waiting for a call.
PO: Keep at it. Use that new phone number to follow up tomorrow.
Lenny: I will. See ya.`,
    caseNote: `SUMMARY: Brief routine check-in. Client updated his contact information, confirmed stable housing with his uncle, and reported active job-seeking. Engagement is positive and compliant.

CONTACT INFO: Client has a new phone number, 555-0199 (previous line disconnected for non-payment).

HOUSING: Client is living with his uncle under a house rule of no visitors. He reports following the rule and distancing himself from friends who use substances.

EMPLOYMENT: Client submitted three job applications yesterday (grocery store, auto-parts store) and is awaiting responses.`,
    actionItems: [
      {
        task: "Follow up on the three submitted job applications using the new phone number",
        assignee: "Client",
        deadline: "Tomorrow",
        context:
          "Applications submitted to a grocery store and an auto-parts store.",
        evidenceQuotes: [
          "Use that new phone number to follow up tomorrow.",
          "I will.",
        ],
      },
      {
        task: "Update the client's contact phone number to 555-0199",
        assignee: "Staff Member",
        deadline: null,
        context: "Old number was disconnected for non-payment.",
        evidenceQuotes: ["I got a new number. It's 555-0199. Write that down."],
      },
    ],
    criticalUpdates: [
      {
        category: "Housing",
        updateType: "Stable/Status Quo",
        details:
          "Living with his uncle under a no-visitors rule; reports complying and avoiding friends who use substances.",
      },
      {
        category: "Employment",
        updateType: "New",
        details:
          "Submitted three job applications (grocery store, auto-parts store); awaiting responses.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:20]",
            content: "Confirmed phone situation resolved; new number provided.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[01:30]",
            content: "Housing — stable at uncle's; following no-visitors rule.",
            status: "Discussed",
          },
          {
            timestamp: "[04:00]",
            content: "Employment — three applications submitted yesterday.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Staff: Update contact number to 555-0199.",
            status: "Assigned",
          },
          {
            content: "Client: Follow up on applications tomorrow.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "When Lenny described his uncle's no-visitors rule, the officer affirmed it as fair and checked whether he was keeping to it, reinforcing the boundary without nagging.",
      ],
      growthOpportunities: [
        'When Lenny said his friends "just want to smoke and drink" and he\'s trying to stay clean, a brief affirmation like "That\'s a hard call to make, and you\'re making it" could have reinforced his own change talk.',
      ],
    },
  },

  // 9. Levi Watsica
  {
    type: "client",
    givenNames: "Levi",
    surname: "Watsica",
    meetingType: "Contact",
    durationMinutes: 18,
    transcript: `PO: Levi, how are the GED classes going? I saw you missed one last Thursday.
Levi: Man, math is so hard. I don't get the fractions. I sit there and look at the numbers and they just look like squiggles. It makes me feel real dumb.
PO: You aren't dumb, Levi. Math is hard for a lot of people. Did you talk to the teacher?
Levi: She's nice. She gave me some extra papers to take home. But I got frustrated and I didn't go on Thursday because I didn't have my homework done. I didn't want her to be mad at me.
PO: She won't be mad. She wants to help you. If you miss class, you'll never learn it. You have to go even when it's hard.
Levi: I know. I just want to get it done. I want that job at the hospital. They told me if I get my GED, I can work in the basement doing the laundry and the cleaning. It pays $18 an hour!
PO: That's great motivation. $18 an hour would change everything for you.
Levi: It would. I could get my own car. A little one, nothing fancy. Just so I don't have to walk in the rain.
PO: Then you have to go to math. Even if you just sit there and try one problem. Can you do that for me?
Levi: Yeah. I'll go tomorrow. I'll ask her to show me the fractions one more time.
PO: Good man. I'll call the teacher on Friday to see if you showed up.
Levi: Okay. I'll be there.`,
    caseNote: `SUMMARY: Routine contact focused on education. Client missed a GED class due to frustration with math and embarrassment about incomplete homework. Officer addressed the avoidance pattern and connected attendance to the client's employment goal.

EDUCATION: Client is enrolled in GED classes and struggling with math (fractions), which is affecting his confidence and attendance. He missed Thursday's class because his homework was not done and he feared the teacher's reaction. The teacher has provided extra practice materials. Client committed to attending the next class and asking for additional help.

EMPLOYMENT (GOAL): Client is motivated by a conditional hospital job (laundry/cleaning, $18/hr) contingent on earning his GED, which he sees as a path to financial independence and a car.`,
    actionItems: [
      {
        task: "Attend the next GED math class and ask the teacher to re-explain fractions",
        assignee: "Client",
        deadline: "Tomorrow",
        context:
          "Missed Thursday due to incomplete homework; attendance is tied to his GED/hospital-job goal.",
        evidenceQuotes: [
          "Yeah. I'll go tomorrow. I'll ask her to show me the fractions one more time.",
        ],
      },
      {
        task: "Call the GED teacher on Friday to confirm the client attended class",
        assignee: "Staff Member",
        deadline: "Friday",
        context:
          "Follow-up to verify the client followed through on attendance.",
        evidenceQuotes: [
          "I'll call the teacher on Friday to see if you showed up.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Education",
        updateType: "Change",
        details:
          "Enrolled in GED classes; struggling with math (fractions) and missed one class out of frustration/avoidance. Teacher providing extra materials. Re-committed to attendance.",
      },
      {
        category: "Employment",
        updateType: "Stable/Status Quo",
        details:
          "Conditional hospital job (laundry/cleaning, $18/hr) available upon earning his GED; strong motivator.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content: "Officer raised the missed GED class on Thursday.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[01:00]",
            content: "Education barrier",
            status: "Discussed",
            subItems: [
              { content: "Struggling with fractions; feels discouraged." },
              { content: "Avoided class because homework wasn't done." },
            ],
          },
          {
            timestamp: "[08:00]",
            content:
              "Motivation — $18/hr hospital job contingent on GED; client wants a car.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Client: Attend next class; ask for help with fractions.",
            status: "Assigned",
          },
          {
            content: "Staff: Call the teacher Friday to confirm attendance.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        'When Levi said math made him feel dumb, the officer pushed back gently ("You aren\'t dumb, math is hard for a lot of people") instead of letting the self-criticism stand.',
        "He anchored the ask in Levi's own goal, the $18/hr hospital job and a car, so attending class connected to something Levi already wanted.",
      ],
      growthOpportunities: [
        'When Levi said he skipped class so the teacher wouldn\'t be mad, exploring that fear with a question like "What do you think would actually happen if you showed up without the homework?" might have addressed the avoidance directly.',
      ],
    },
  },

  // 10. Pattie Schiller-Graham
  {
    type: "client",
    givenNames: "Pattie",
    surname: "Schiller-Graham",
    meetingType: "Assessment",
    durationMinutes: 45,
    transcript: `PO: This is a big one, Pattie. You've been out for six months and you finally got the keys to your own place. This is a huge milestone.
Pattie: I know, I know. I'm so happy I cried when the landlord handed me the keys. It's just a little studio, but it's got a big window that lets the sun in. I don't have much to put in it yet, but it's mine.
PO: I'm proud of you. But we need to really walk through the budget today. I don't want you to lose this apartment because you forgot about a bill.
Pattie: I am scared about that. I never had to pay a light bill and a water bill at the same time. In the halfway house, they just took my money and I didn't have to think about it. Now I gotta remember the dates.
PO: Let's look at your check. You're making $14 an hour at the laundry, right?
Pattie: Yeah. But they take out taxes. My check is only like $420 a week. The rent is $900. That's like two whole checks just for the rent. That only leaves me a little bit for food and the bus and the lights.
PO: It's going to be very tight. Are you still getting any food stamps?
Pattie: They cut them down because I'm working now. They only give me $40 a month. That's like one trip to the store for some milk and eggs and bread. I gotta learn how to buy the cheap stuff. My mom said she would bring me some cans of soup and some toilet paper to help out.
PO: That's good. Family support is important. What about your furniture?
Pattie: I got a air mattress for now. My cousin gave it to me. And a folding chair I found by the trash that was still clean. I don't need much. I just like that I can lock the door and no one can come in. You don't know what it's like in the halfway house, people always touching your stuff and looking in your bags.
PO: I hear you. Privacy is a big deal. Now, let's talk about the neighborhood. I looked at the map. There's a lot of people you used to hang out with near that street. People who aren't doing the right things. How are you going to handle it if they see you?
Pattie: I already saw 'T-Bone' yesterday. He saw me walking from the bus stop near the corner store. He tried to get me to come over to his porch and talk. He had a beer in his hand. I just waved and kept walking real fast. I told him I was late for my shift. I didn't tell him where I live. I'm not trying to go back to jail, Mr. Miller. Not for him, not for nobody.
PO: That's the right answer. If they keep bothering you, you might have to take a different bus stop, even if it's a longer walk. It's worth it to stay away from the "hot spots."
Pattie: It's hard though, because I'm lonely. I sit in that room and it's real quiet. Sometimes I want to just go out and talk to anyone. But I know where that leads. It starts with a talk, then a drink, then I'm in the back of a police car.
PO: That's why we need to find you a group or a hobby. You mentioned church before. Have you looked for one nearby?
Pattie: There's one on 4th Street. I heard them singing when I walked by. I like the singing. Maybe I'll go on Sunday. They got a sign that says "Everyone Welcome."
PO: That's a great idea. Go for the singing. It'll get you out of the house and around people who aren't trying to get you in trouble. Let's write down a "Safe List." If you feel lonely at 8:00 PM on a Tuesday, who are three people you can call?
Pattie: My sister, my mom, and my sponsor from the meetings. I got all their numbers in my phone.
PO: Good. Call them before you even think about walking toward T-Bone's porch. Now, about the move-in. I'm coming by on Thursday at 2:00 PM to do the home visit.
Pattie: Is it okay if I don't have a real bed? I don't want you to think I'm not doing good just because I'm on the floor.
PO: Pattie, as long as the place is clean and you're the only one living there, I don't care if you're sleeping on a yoga mat. I just want to see that you're safe and following the rules.
Pattie: It's clean, I promise. I scrubbed the floors with bleach yesterday. It smells real good in there.
PO: I'll see you Thursday then. Bring a copy of your lease for me to scan.
Pattie: I got it right here in my bag. I'm keeping it in a plastic folder so it don't get wrinkled.
PO: Perfect. You're doing a great job, Pattie. Keep it up.`,
    caseNote: `SUMMARY: Major milestone visit. Six months post-release, client has secured her own studio apartment. Session focused on budgeting, neighborhood safety, isolation, and scheduling a home visit. Client is highly motivated and demonstrating strong protective behaviors.

HOUSING: Client obtained her first independent housing (a studio) and has the lease in hand. Furnishings are minimal (air mattress, folding chair). She values the privacy and security after halfway-house living. A home visit is scheduled for Thursday at 2:00 PM.

FINANCIAL: Client earns $14/hr at a laundry (~$420/week take-home) against $900/month rent, leaving a very tight margin for food, transit, and utilities. She is anxious about managing multiple bill due dates for the first time. SNAP benefits were reduced to $40/month upon employment. Family is providing supplemental food support.

LEGAL / RISK: Client lives near former associates ("hot spots"). She reported a recent contact with "T-Bone," who was drinking and invited her over; she declined, did not disclose her address, and left quickly. Officer reinforced avoidance strategies, including using a different bus stop.

MENTAL HEALTH / SUPPORT: Client disclosed loneliness as a relapse risk. Protective planning included pursuing a nearby church (4th Street) for community and creating a "Safe List" of three contacts (sister, mother, sponsor) to call when isolated.`,
    actionItems: [
      {
        task: "Attend the church service on 4th Street to build community and reduce isolation",
        assignee: "Client",
        deadline: "Sunday",
        context:
          "Client identified loneliness as a relapse trigger and expressed interest in the church's singing.",
        evidenceQuotes: [
          "Maybe I'll go on Sunday.",
          "It'll get you out of the house and around people who aren't trying to get you in trouble.",
        ],
      },
      {
        task: "Call someone on the Safe List (sister, mother, or sponsor) before engaging with former associates when feeling lonely",
        assignee: "Client",
        deadline: null,
        context: "Coping plan for high-risk lonely moments.",
        evidenceQuotes: [
          "Call them before you even think about walking toward T-Bone's porch.",
        ],
      },
      {
        task: "Have the lease available to be scanned at the Thursday 2:00 PM home visit",
        assignee: "Client",
        deadline: "Thursday 2:00 PM",
        context:
          "Officer is conducting a home visit and needs a copy of the lease.",
        evidenceQuotes: [
          "I'm coming by on Thursday at 2:00 PM to do the home visit.",
          "Bring a copy of your lease for me to scan.",
        ],
      },
      {
        task: "Conduct the scheduled home visit",
        assignee: "Staff Member",
        deadline: "Thursday 2:00 PM",
        context: "Verify safety and compliance at the new residence.",
        evidenceQuotes: [
          "I'm coming by on Thursday at 2:00 PM to do the home visit.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Housing",
        updateType: "New",
        details:
          "Secured first independent studio apartment six months post-release; lease in hand. Minimal furnishings (air mattress, folding chair). Home visit scheduled Thursday 2:00 PM.",
      },
      {
        category: "Employment",
        updateType: "Stable/Status Quo",
        details:
          "Employed at a laundry, $14/hr (~$420/week take-home). Rent is $900/month, leaving a very tight budget.",
      },
      {
        category: "Legal",
        updateType: "New",
        details:
          'Contact with a former associate ("T-Bone") who was drinking and invited her over; she declined, withheld her address, and left. Lives near former-associate "hot spots."',
      },
      {
        category: "Family",
        updateType: "Stable/Status Quo",
        details:
          'Mother providing supplemental food (canned goods, toiletries). Sister, mother, and sponsor identified as a support "Safe List."',
      },
      {
        category: "Health",
        updateType: "New",
        details:
          "Reports loneliness/isolation in the new apartment as a relapse risk; protective planning (church, Safe List) in place.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content:
              "Celebrated a major milestone: client's first independent apartment.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[03:00]",
            content: "Budget walkthrough",
            status: "Discussed",
            subItems: [
              {
                content:
                  "$14/hr (~$420/wk) vs. $900/mo rent; very tight margin.",
              },
              {
                content:
                  "SNAP reduced to $40/mo; family providing food support.",
              },
              {
                content:
                  "Client anxious about managing bill due dates for the first time.",
              },
            ],
          },
          {
            timestamp: "[18:00]",
            content: "Neighborhood risk",
            status: "Discussed",
            subItems: [
              {
                content:
                  'Recent contact with "T-Bone"; client declined and withheld her address.',
              },
              {
                content:
                  "Officer recommended an alternate bus stop to avoid hot spots.",
              },
            ],
          },
          {
            timestamp: "[30:00]",
            content: "Isolation & support",
            status: "Discussed",
            subItems: [
              { content: "Loneliness flagged as a relapse trigger." },
              { content: 'Created a "Safe List": sister, mother, sponsor.' },
            ],
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Staff: Home visit Thursday 2:00 PM.",
            status: "Assigned",
          },
          {
            content: "Client: Have lease ready to scan at the visit.",
            status: "Assigned",
          },
          {
            content: "Client: Attend 4th Street church on Sunday.",
            status: "Assigned",
          },
          {
            content:
              "Client: Use the Safe List before contacting former associates.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "When Pattie described declining T-Bone's invitation and protecting her address, the officer named it as exactly the right call, reinforcing a decision she made under real pressure.",
        "He turned her disclosed loneliness into a concrete plan with her, the church and a Safe List of three people, instead of just warning her about relapse.",
      ],
      growthOpportunities: [
        "When Pattie worried he'd judge her for sleeping on an air mattress, a warmer reassurance up front about what the home visit is really checking might have eased her shame before she had to ask.",
      ],
    },
  },
];

// ===========================================================================
// RESIDENTS (incarcerated — Case Manager)
// ===========================================================================

const RESIDENTS: DemoPerson[] = [
  // 11. Aisha Sauer
  {
    type: "resident",
    givenNames: "Aisha",
    surname: "Sauer",
    meetingType: "Assessment",
    durationMinutes: 25,
    transcript: `CM: Aisha, thanks for coming down. We're about 60 days out from your release. It's time to finalize where you're going.
Aisha: I'm real scared, Miss Jones. I talked to my sister on the phone last night. She said I can't stay with her no more.
CM: What happened? Last month she said it was fine.
Aisha: She said her landlord found out I was coming and said no felons. And she's got her kids there, and she don't want no drama if the police come looking for me. I don't got nowhere else to go. I don't got no money for a hotel.
CM: That's a setback, but it's better we know now. Have you thought about a halfway house?
Aisha: Is that like jail? I don't want to be in another jail.
CM: No, it's a house in the community. You can go to work, you can go to the store, but you have a curfew and you have to stay sober. They help you find a job too.
Aisha: Can I go to the Oxford House? I heard some girls talking about that one.
CM: We can put in an application. But you have to be serious about the meetings. If you use once, you're out.
Aisha: I'll do anything. I just don't want to be on the street. It's cold out there and I don't have a coat that fits. I'm scared if I'm homeless, I'll just start using again because I'll be sad.
CM: That's a very honest thing to say, Aisha. Recognizing that is the first step. I'll start the paperwork for the Oxford House today. You also need to finish that "Money Management" class before you leave.
Aisha: I'm going every Friday. I learned how to save five dollars a week. It ain't much, but it's something.
CM: Every little bit helps. When you get out, you'll have a little "gate money" too. We can put that toward your first week at the house.
Aisha: Okay. I feel a little better now. I was up all night crying about my sister.
CM: Don't worry. We have 60 days. We'll find you a bed. Just keep going to your classes.`,
    caseNote: `SUMMARY: Pre-release planning meeting (~60 days to release). The resident's planned housing with her sister fell through, creating an urgent placement need. Case manager initiated a halfway-house application and reinforced programming requirements.

HOUSING / REENTRY: The resident's sister can no longer provide housing (landlord prohibits felons; concerns about police contact around her children). The resident has no alternative placement and no funds for temporary lodging. Case manager will submit an Oxford House application and apply gate money toward the first week. Sobriety compliance and meeting attendance are conditions of placement.

SUBSTANCE / RISK: The resident candidly identified homelessness as a relapse trigger ("if I'm homeless, I'll just start using again"), underscoring the urgency of stable placement.

PROGRAMMING: The resident is attending the Money Management class weekly and reports saving $5/week. Completion is required before release.`,
    actionItems: [
      {
        task: "Submit the Oxford House application for the resident",
        assignee: "Staff Member",
        deadline: "Today",
        context:
          "Sister's housing fell through; resident has ~60 days to release and no alternative placement.",
        evidenceQuotes: [
          "I'll start the paperwork for the Oxford House today.",
        ],
      },
      {
        task: "Finish the Money Management class before release",
        assignee: "Client",
        deadline: "Before release",
        context:
          "Required programming; resident currently attends every Friday.",
        evidenceQuotes: [
          'You also need to finish that "Money Management" class before you leave.',
          "I'm going every Friday.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Housing",
        updateType: "Change",
        details:
          "Planned post-release housing with her sister fell through (landlord prohibits felons). No alternative placement; ~60 days to release. Pursuing Oxford House.",
      },
      {
        category: "Substance",
        updateType: "New",
        details:
          "Identified homelessness as a relapse trigger; states she would likely use again if she became homeless. Reinforces urgency of stable placement.",
      },
      {
        category: "Family",
        updateType: "Change",
        details:
          "Sister withdrew her housing offer, citing her landlord and the safety of her children.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content:
              "Resident disclosed her sister's housing offer fell through.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[02:00]",
            content: "Reentry housing",
            status: "Discussed",
            subItems: [
              {
                content:
                  "No alternative placement; explored halfway house / Oxford House.",
              },
              {
                content:
                  "Sobriety and meeting attendance are placement conditions.",
              },
            ],
          },
          {
            timestamp: "[14:00]",
            content: "Relapse risk — resident named homelessness as a trigger.",
            status: "Discussed",
          },
          {
            timestamp: "[18:00]",
            content:
              "Programming — attending Money Management weekly; saving $5/week.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Staff: Submit Oxford House application today.",
            status: "Assigned",
          },
          {
            content: "Staff: Apply gate money toward first week of placement.",
            status: "Discussed",
          },
          {
            content: "Client: Continue and complete Money Management class.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        'When Aisha admitted she\'d likely use again if homeless, the case manager affirmed her honesty ("Recognizing that is the first step") instead of reacting to the risk, which kept her open.',
        'She paired reassurance with concrete action, the Oxford House application and gate money, so "we\'ll find you a bed" was backed by a real plan.',
      ],
      growthOpportunities: [
        'When Aisha said she was up all night crying about her sister, a brief reflection like "Losing that plan really shook you" might have acknowledged the loss before moving into logistics.',
      ],
    },
  },

  // 12. Alverta Auer
  {
    type: "resident",
    givenNames: "Alverta",
    surname: "Auer",
    meetingType: "Contact",
    durationMinutes: 15,
    transcript: `CM: Alverta, I have some good news. I got the certificate from the auto shop.
Alverta: For real? I passed?
CM: You passed. The instructor said you were one of the best at fixing the brakes.
Alverta: I like doing the brakes. It makes sense to me. You pull the old ones off, you put the new ones on. It's simple.
CM: Well, since you finished the class, I can put in for your "earned time." It should take about five days off your sentence.
Alverta: Only five days? I worked on them engines for three months!
CM: I know it doesn't seem like much, but five days can be the difference between missing your daughter's birthday and being there.
Alverta: You're right. Her birthday is June 12th. If I get out five days early, I can make it for the cake. She's gonna be ten. I haven't seen her blow out candles since she was six.
CM: That's a great goal. I'll send the paperwork to the records office today. Is there any other class you want to take?
Alverta: Is there a class for painting cars? I want to learn how to make them look pretty, not just fix the inside.
CM: I'll check the list. If not, maybe the carpentry class. It's good to have more than one skill.
Alverta: Check the painting one first. I like the colors.`,
    caseNote: `SUMMARY: Positive programming update. The resident completed her auto-shop certification with strong instructor feedback. Case manager will file for earned-time credit and explore a follow-on vocational class.

EDUCATION / VOCATION: The resident earned her auto-shop certificate (noted as one of the top performers on brake work). She expressed interest in a follow-on auto-painting class, with carpentry as an alternative.

LEGAL / SENTENCE: Completion qualifies the resident for approximately five days of earned time. She connected the potential early release to attending her daughter's 10th birthday on June 12. Case manager will file the earned-time paperwork with records.`,
    actionItems: [
      {
        task: "File the earned-time credit paperwork with the records office for the completed auto-shop certificate",
        assignee: "Staff Member",
        deadline: "Today",
        context:
          "~5 days of credit; could allow the resident to attend her daughter's June 12 birthday.",
        evidenceQuotes: [
          "I'll send the paperwork to the records office today.",
        ],
      },
      {
        task: "Check whether an auto-painting class is available (carpentry as a backup) and follow up with the resident",
        assignee: "Staff Member",
        deadline: null,
        context:
          "Resident requested painting first; wants a second vocational skill.",
        evidenceQuotes: [
          "I'll check the list. If not, maybe the carpentry class.",
          "Check the painting one first.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Education",
        updateType: "Change",
        details:
          "Completed auto-shop certificate (top performer on brakes). Interested in a follow-on auto-painting or carpentry class.",
      },
      {
        category: "Legal",
        updateType: "New",
        details:
          "Eligible for ~5 days of earned-time credit from the completed certificate; paperwork being filed with records.",
      },
      {
        category: "Family",
        updateType: "Stable/Status Quo",
        details:
          "Motivated to be released in time for her daughter's 10th birthday on June 12.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:20]",
            content:
              "Case manager delivered news that the resident passed her auto-shop certification.",
            status: "Completed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[02:00]",
            content:
              "Earned time — completion qualifies for ~5 days off sentence.",
            status: "Discussed",
          },
          {
            timestamp: "[06:00]",
            content:
              "Resident tied early release to her daughter's June 12 birthday.",
            status: "Discussed",
          },
          {
            timestamp: "[10:00]",
            content:
              "Next vocational step — requested auto-painting class (carpentry backup).",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Staff: File earned-time paperwork with records today.",
            status: "Assigned",
          },
          {
            content: "Staff: Check availability of an auto-painting class.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "When Alverta was let down that the credit was only five days, the case manager reframed it around what those days meant to her, making her daughter's birthday, which turned disappointment into motivation.",
        "She invited the next goal by asking what other class the resident wanted, building on the win instead of closing the conversation.",
      ],
      growthOpportunities: [],
    },
  },

  // 13. Darren Morar
  {
    type: "resident",
    givenNames: "Darren",
    surname: "Morar",
    meetingType: "Contact",
    durationMinutes: 40,
    transcript: `CM: Darren, I see you put in another grievance. This one is about medical again?
Darren: Miss, my back is killing me. I'm not lying. It feels like someone is stabbing me with a hot fork every time I roll over. This bed... it ain't a bed. It's a piece of metal with a thin piece of plastic on it.
CM: I know the bunks aren't comfortable, Darren. But everyone has the same mattress.
Darren: But I'm 50 years old! I ain't a young kid no more. My bones hurt. I asked the guard for a second blanket so I could fold it up and put it under my hips. He just laughed at me and told me to "tough it out." That ain't right. I'm a human being.
CM: I understand you're hurting. Did you go to the sick call this morning?
Darren: I went. I waited three hours. The lady didn't even look at my back. She just gave me this cream that smells like mint and told me to drink more water. Water ain't gonna fix my spine! I need a real doctor. I need an X-ray.
CM: An X-ray is hard to get unless they think something is broken.
Darren: Something IS broken! I can't even walk to the chow hall some days. I have to hold onto the wall. The other guys make fun of me, calling me "Old Man." I don't care about the names, I just want the pain to stop.
CM: Let's look at your record. It says you had a back injury before you came here?
Darren: Yeah, I fell off a ladder doing roofing ten years ago. It's always been bad, but here it's way worse. I think the cold in the cell makes it stiff.
CM: I can't give you a new mattress, but I can send a note to the Medical Director and ask for a "lower bunk" permit if you don't have one already. That way you don't have to climb.
Darren: I got a lower bunk, but it don't help the pain. What about a back brace? My brother has one he wears at work. Can I have one of those?
CM: I can ask. Usually, you have to buy that through the commissary if they allow it, or medical has to give it to you. I'll put it in my report. But you have to stop yelling at the guards about it. That's why they're being mean back to you.
Darren: I only yell because they don't listen! If I whisper, they just walk past.
CM: I'm listening now, and I'm not yelling. Let's try to do this the right way. I'll write to medical. You try to stay calm. If you get a ticket for "disrespect," I can't help you with anything.
Darren: (Sighs) Okay. I'll try. But please, Miss. Tell them it really hurts. I'm not just trying to get out of work. I want to work! I just can't stand up straight.
CM: I believe you. I'll also ask about physical therapy exercises you can do in your cell. Sometimes stretching helps more than the cream.
Darren: I'll try anything. I just want to sleep for four hours without waking up crying.
CM: I'll do my best, Darren. Check back with me next Tuesday.`,
    caseNote: `SUMMARY: Grievance follow-up regarding untreated chronic back pain. Case manager validated the resident's pain, agreed to escalate to medical, and coached him on conduct to avoid disciplinary consequences.

HEALTH: The resident reports severe, worsening chronic back pain (prior roofing fall ~10 years ago), aggravated by the cell mattress and cold. He states he sometimes cannot walk to the chow hall without support and is losing sleep. Sick call provided only a topical cream. He already has a lower-bunk permit. He requested an X-ray and a back brace. Case manager will write to the Medical Director and ask about a back brace and in-cell physical-therapy exercises.

CONDUCT: The resident acknowledged conflict with staff (yelling about his pain). Case manager advised that a "disrespect" ticket would limit her ability to help and asked him to stay calm; the resident agreed to try.`,
    actionItems: [
      {
        task: "Write to the Medical Director requesting evaluation, a back brace, and in-cell physical-therapy exercises for the resident's chronic back pain",
        assignee: "Staff Member",
        deadline: null,
        context:
          "Sick call only provided topical cream; resident already has a lower-bunk permit.",
        evidenceQuotes: [
          "I'll write to medical.",
          "I'll also ask about physical therapy exercises you can do in your cell.",
        ],
      },
      {
        task: "Refrain from yelling at staff about the medical issue to avoid a disciplinary ticket",
        assignee: "Client",
        deadline: null,
        context:
          'A "disrespect" ticket would limit the case manager\'s ability to help.',
        evidenceQuotes: [
          "you have to stop yelling at the guards about it.",
          "Okay. I'll try.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Health",
        updateType: "New",
        details:
          "Severe, worsening chronic back pain (prior roofing fall ~10 yrs ago), aggravated by mattress/cold. Reports difficulty walking and sleep loss. Sick call provided only topical cream; requesting X-ray and back brace. Has lower-bunk permit.",
      },
      {
        category: "Legal",
        updateType: "New",
        details:
          'Ongoing friction with staff (yelling about pain); at risk of a "disrespect" disciplinary ticket. Coached to stay calm.',
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content: "Reviewed the resident's repeat medical grievance.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[02:00]",
            content: "Pain & treatment",
            status: "Discussed",
            subItems: [
              {
                content: "Severe back pain; sick call gave only topical cream.",
              },
              {
                content:
                  "Prior roofing injury; aggravated by mattress and cold cell.",
              },
              { content: "Resident requested X-ray and back brace." },
            ],
          },
          {
            timestamp: "[22:00]",
            content:
              "Conduct — case manager coached resident to stop yelling at staff.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content:
              "Staff: Write to Medical Director re: brace and PT exercises.",
            status: "Assigned",
          },
          {
            content: "Client: Stay calm; avoid a disrespect ticket.",
            status: "Assigned",
          },
          { content: "Check back next Tuesday.", status: "Discussed" },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "When Darren said he only yells because no one listens, the case manager modeled the alternative in the moment (\"I'm listening now, and I'm not yelling\"), showing rather than telling.",
        'She told him plainly "I believe you," which met his repeated worry that staff thought he was faking.',
      ],
      growthOpportunities: [
        'Early on, when he described the pain in vivid detail, leading with a reflection like "This has been wearing you down for a long time" before the logistics might have lowered his defensiveness sooner.',
      ],
    },
  },

  // 14. Helen Buckridge
  {
    type: "resident",
    givenNames: "Helen",
    surname: "Buckridge",
    meetingType: "Contact",
    durationMinutes: 10,
    transcript: `CM: Helen, how is the anger management group going?
Helen: It's fine. I just sit in the back. I don't like talking about my childhood and all that stuff with people I don't know. They're all gossips anyway.
CM: You don't have to share everything, but you do have to listen. Have you learned any new tricks for when you get mad?
Helen: I just count. I count the bricks on the wall. Usually, by the time I get to twenty, I don't want to hit nobody no more.
CM: That's a good one. Counting bricks is very grounding. I noticed you haven't had any tickets in three months. That's a big deal for you.
Helen: I'm trying to stay invisible. I just read my books and do my laundry job. I don't want no drama. I want to go home to my cats.
CM: Your cats? Who's taking care of them?
Helen: My neighbor. She's nice. She sends me pictures sometimes. I miss them more than people, honestly.
CM: Well, keep counting those bricks. You're doing great.`,
    caseNote: `SUMMARY: Brief programming check-in. The resident is engaged (passively) in anger management, has developed an effective self-regulation strategy, and has maintained a clean disciplinary record for three months.

PROGRAMMING / BEHAVIOR: The resident attends the anger management group but prefers to listen rather than share. She reports using a counting technique to manage anger successfully. Case manager noted three months without a disciplinary ticket, a meaningful improvement for her.

STABILITY / FAMILY: The resident keeps a low profile (reading, laundry job) and is motivated by reuniting with her cats, currently cared for by a neighbor who sends photos.`,
    actionItems: [
      {
        task: "Continue attending the anger management group and listening, even without sharing",
        assignee: "Client",
        deadline: null,
        context:
          "Case manager confirmed attendance/listening is required; resident is making progress.",
        evidenceQuotes: ["you do have to listen."],
      },
    ],
    criticalUpdates: [
      {
        category: "Legal",
        updateType: "Change",
        details:
          "No disciplinary tickets in three months, a notable improvement. Keeping a low profile (reading, laundry job).",
      },
      {
        category: "Health",
        updateType: "Stable/Status Quo",
        details:
          "Using a grounding/counting technique to manage anger; engaged in the anger management group as a listener.",
      },
      {
        category: "Family",
        updateType: "Stable/Status Quo",
        details:
          "Motivated by reuniting with her cats, cared for by a neighbor who sends photos.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:20]",
            content: "Checked in on the resident's anger management group.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[01:30]",
            content:
              "Coping strategy — resident uses a counting technique to de-escalate.",
            status: "Discussed",
          },
          {
            timestamp: "[04:00]",
            content:
              "Behavior milestone — three months with no disciplinary tickets.",
            status: "Discussed",
          },
          {
            timestamp: "[07:00]",
            content: "Motivation — reuniting with her cats.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content:
              "Client: Keep attending and listening in anger management group.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "The case manager specifically named the three-months-no-tickets milestone, recognizing progress that matters to Helen rather than offering generic praise.",
        "When Helen described counting bricks, the case manager validated it as a real grounding skill, reinforcing a tool that's working for her.",
      ],
      growthOpportunities: [
        "When Helen said she misses her cats more than people, a gentle open question about what going home will look like might have opened a meaningful conversation about her release goals.",
      ],
    },
  },

  // 15. Jason Murphy
  {
    type: "resident",
    givenNames: "Jason",
    surname: "Murphy",
    meetingType: "Contact",
    durationMinutes: 20,
    transcript: `CM: Jason, you put in a request for the plumbing program. Tell me why.
Jason: Well, my uncle was a plumber. When I was a kid, I used to go with him on jobs. I liked the tools. And he always had money in his pocket. He told me, "Jason, people are always gonna have leaky pipes. You'll never be out of work."
CM: Your uncle was a smart man. Plumbing is a great trade. The class is very hard, though. There's a lot of math and you have to learn the codes.
Jason: I'm ready. I've been studying that math book I got from the library. I can do the pipe measurements now. See? (Shows a notebook with sketches).
CM: Those are good sketches, Jason. You have a clean record for a whole year, which means you're at the top of the list for the next group. It starts in three weeks.
Jason: Three weeks! That's great. Will I get a certificate I can show to a boss when I get out?
CM: Yes, a state certificate. It proves you did the hours. It makes a big difference when you're looking for a job as an apprentice.
Jason: I want to do it right this time. I'm tired of being broke and doing dumb stuff. I want to have a real job and a real truck with my name on the side.
CM: I love that vision. Keep that in your head when the math gets hard. I'll put your name on the final roster today.`,
    caseNote: `SUMMARY: Vocational planning meeting. The resident requested and qualified for the plumbing program, demonstrated self-directed preparation, and articulated a clear post-release career goal.

EDUCATION / VOCATION: The resident applied for the plumbing program, motivated by a family connection to the trade. He has been self-studying math and pipe measurements (demonstrated via a notebook). His clean disciplinary record for one year places him at the top of the waitlist; the next cohort starts in three weeks and yields a state certificate. Case manager added him to the final roster.

BEHAVIOR: Clean disciplinary record for a full year. The resident expressed strong, future-oriented motivation ("I want to do it right this time").`,
    actionItems: [
      {
        task: "Add the resident to the final roster for the next plumbing program cohort (starts in three weeks)",
        assignee: "Staff Member",
        deadline: "Today",
        context:
          "Resident is at the top of the waitlist due to a clean one-year record.",
        evidenceQuotes: ["I'll put your name on the final roster today."],
      },
    ],
    criticalUpdates: [
      {
        category: "Education",
        updateType: "New",
        details:
          "Accepted into the plumbing vocational program (top of waitlist); cohort starts in ~3 weeks and yields a state certificate. Self-studying math/measurements.",
      },
      {
        category: "Legal",
        updateType: "Stable/Status Quo",
        details: "Clean disciplinary record for a full year.",
      },
      {
        category: "Employment",
        updateType: "Stable/Status Quo",
        details:
          "Post-release goal of working as a plumbing apprentice; strong, future-oriented motivation.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:20]",
            content:
              "Discussed the resident's plumbing program request and motivation.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[03:00]",
            content:
              "Preparation — resident showed self-study notebook with pipe measurements.",
            status: "Discussed",
          },
          {
            timestamp: "[08:00]",
            content:
              "Eligibility — clean one-year record puts him top of the waitlist; cohort in 3 weeks.",
            status: "Discussed",
          },
          {
            timestamp: "[14:00]",
            content: "Goal — state certificate and a future apprenticeship.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Staff: Add resident to final plumbing roster today.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        'When Jason showed his self-study notebook, the case manager noticed and named it ("Those are good sketches"), affirming effort he initiated on his own.',
        "She told him to hold his vision of a truck with his name on it for when the math gets hard, tying the program to his own motivation.",
      ],
      growthOpportunities: [],
    },
  },

  // 16. Kenny Bashirian
  {
    type: "resident",
    givenNames: "Kenny",
    surname: "Bashirian",
    meetingType: "Contact",
    durationMinutes: 12,
    transcript: `CM: Kenny, I saw you didn't have any visitors on Sunday. Is everything okay at home?
Kenny: My wife's car broke down. The transmission went out. She said it's gonna cost two thousand dollars to fix it. We don't got that kind of money.
CM: I'm sorry. I know you look forward to those visits.
Kenny: I was real down about it. My kids were all dressed up to come see me. They're getting so big. My son is playing soccer now. I just wanted to hear about his game.
CM: Have you tried the video visiting? It's only five dollars.
Kenny: Can she do that on her phone?
CM: Yes, as long as she has the app. It's not the same as being in the same room, but you can see their faces and talk for twenty minutes.
Kenny: That would be better than nothing. Can you show me how to set it up?
CM: I'll give you the paper with the instructions. You mail it to her, and she can set it up on her end. Then you just have to log on at the right time.
Kenny: Thanks. That makes me feel a lot better. I just need to see them laugh.`,
    caseNote: `SUMMARY: Brief supportive check-in. The resident missed a family visit due to a vehicle breakdown. Case manager offered video visitation as an alternative to maintain family contact.

FAMILY: The resident's wife's car broke down (transmission, ~$2,000 repair), preventing the family's Sunday visit. The resident was discouraged at missing time with his children. Case manager introduced video visiting ($5, 20 minutes) and will provide setup instructions to mail to his wife.`,
    actionItems: [
      {
        task: "Provide the resident the video-visiting setup instructions to mail to his wife",
        assignee: "Staff Member",
        deadline: null,
        context:
          "In-person visits disrupted by the family's vehicle breakdown.",
        evidenceQuotes: ["I'll give you the paper with the instructions."],
      },
      {
        task: "Set up the video-visiting app on her phone so the family can connect",
        assignee: "Third Party",
        deadline: null,
        context:
          "Wife to complete setup on her end after receiving the mailed instructions.",
        evidenceQuotes: ["she can set it up on her end."],
      },
    ],
    criticalUpdates: [
      {
        category: "Family",
        updateType: "Change",
        details:
          "In-person family visits disrupted by the wife's car breakdown (~$2,000 transmission repair). Pursuing video visiting to maintain contact with his children.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:20]",
            content:
              "Case manager noted the missed Sunday visit and checked in.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[01:00]",
            content:
              "Missed visit — wife's car broke down (~$2,000 repair); resident discouraged.",
            status: "Discussed",
          },
          {
            timestamp: "[05:00]",
            content:
              "Alternative — introduced $5 video visiting to maintain family contact.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Staff: Provide video-visiting instructions to mail home.",
            status: "Assigned",
          },
          {
            content: "Third Party: Wife to set up the app on her phone.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "When Kenny described his kids dressed up for a visit that didn't happen, the case manager responded to the loss and then offered a workable fix in video visiting.",
        "She kept the solution concrete and low-cost ($5, mail the instructions home), so a discouraging update ended with a clear next step.",
      ],
      growthOpportunities: [
        "When Kenny said he just wanted to hear about his son's soccer game, a brief reflection like \"You don't want to miss these moments while they're growing up\" might have honored that before problem-solving.",
      ],
    },
  },

  // 17. Krystina Jast-Schuster
  {
    type: "resident",
    givenNames: "Krystina",
    surname: "Jast-Schuster",
    meetingType: "Contact",
    durationMinutes: 15,
    transcript: `CM: Krystina, you had a question about your release date.
Krystina: Yeah, the computer says August 12. But I did four months in the county jail before I got sent here. I don't think they counted that. If they count those 120 days, I should be going home in April!
CM: Let me look at your "Judgment of Conviction." Sometimes the county doesn't send the "time served" paper right away.
Krystina: Please check. I've been counting the days on my calendar. I have April 15th circled. If I have to stay until August, I'm gonna lose my mind.
CM: I see the note here... it looks like they only gave you 30 days of credit.
Krystina: 30 days? That's wrong! I was in that cage from November to March. I have the receipts from the commissary there to prove it.
CM: Okay, don't get upset. I will call the county clerk. If they made a mistake, we can fix it. But it takes time.
Krystina: Please, Miss. My daughter is graduating in May. I have to be there.
CM: I'll do my best. I'll check the records and let you know by Friday.`,
    caseNote: `SUMMARY: The resident raised a discrepancy in her jail-time-served credit affecting her release date. Case manager will verify with the county and follow up.

LEGAL / SENTENCE: The resident's record reflects 30 days of time-served credit, but she reports serving approximately 120 days in county jail (November–March) and says she has commissary receipts as evidence. The discrepancy moves her release date from a calculated April to the recorded August 12. Case manager will contact the county clerk to verify the Judgment of Conviction and follow up by Friday.

FAMILY: The resident is motivated by attending her daughter's graduation in May.`,
    actionItems: [
      {
        task: "Call the county clerk to verify the resident's time-served credit (claims ~120 days; only 30 recorded) and report back",
        assignee: "Staff Member",
        deadline: "Friday",
        context:
          "Discrepancy affects her release date (recorded August 12 vs. her calculated April). Resident reports commissary receipts as evidence.",
        evidenceQuotes: [
          "I will call the county clerk.",
          "I'll check the records and let you know by Friday.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Legal",
        updateType: "New",
        details:
          "Disputes time-served credit: only 30 of a claimed ~120 county days (Nov–Mar) recorded, affecting her release date (recorded August 12 vs. calculated April). Verification with county clerk pending.",
      },
      {
        category: "Family",
        updateType: "Stable/Status Quo",
        details:
          "Motivated to be released in time for her daughter's graduation in May.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:20]",
            content: "Resident questioned her recorded release date.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[01:00]",
            content: "Time-served discrepancy",
            status: "Discussed",
            subItems: [
              {
                content:
                  "Record shows 30 days credit; resident claims ~120 days (Nov–Mar).",
              },
              {
                content:
                  "Resident reports commissary receipts as supporting evidence.",
              },
            ],
          },
          {
            timestamp: "[10:00]",
            content: "Motivation — daughter's May graduation.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content:
              "Staff: Call county clerk to verify credit; respond by Friday.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "When Krystina's panic rose, the case manager steadied the conversation (\"don't get upset\") and immediately committed to a concrete next step rather than dismissing her.",
        "She gave a specific follow-up date (Friday), which gives an anxious resident something definite to hold onto.",
      ],
      growthOpportunities: [
        'When Krystina said she\'d "lose her mind" if she stayed until August, a brief reflection acknowledging how long the wait feels might have helped her feel heard before the records talk.',
      ],
    },
  },

  // 18. Lilly Beatty
  {
    type: "resident",
    givenNames: "Lilly",
    surname: "Beatty",
    meetingType: "Assessment",
    durationMinutes: 22,
    transcript: `CM: Lilly, let's talk about your "reentry plan." You're out in 90 days. Where are you going to work?
Lilly: My uncle has a landscaping shop. He said I can mow lawns and pull weeds for him. He said he'll pay me $15 an hour in cash for the first month.
CM: We have to make sure your parole officer is okay with that. They usually want you to have a job where you get a paycheck and pay taxes.
Lilly: My uncle is a good man. He just wants to help me get on my feet. I can work hard. I don't mind the sun.
CM: The bigger problem is your ID. Do you have your birth certificate?
Lilly: No. When my house burned down three years ago, I lost everything. I don't even have a picture of my mom.
CM: We need to order a new one. Without that, you can't get a State ID, and without an ID, you can't get a "real" job.
Lilly: How much does it cost? I only got twenty bucks in my account.
CM: The facility has a fund for that. I'll give you the form. You fill it out, and we'll send it to the capital. It takes about a month to come back.
Lilly: Okay. I'll do it right now. I want to be ready. I don't want to be sitting around with no papers when they open that gate.`,
    caseNote: `SUMMARY: Reentry planning meeting (~90 days to release). Identified a missing vital document as the primary barrier to employment and addressed a tentative job plan requiring parole approval.

IDENTIFICATION: The resident has no birth certificate (lost in a house fire ~3 years ago), which blocks obtaining a State ID and lawful employment. The facility fund will cover a replacement; case manager provided the request form (processing ~1 month). The resident agreed to complete it immediately.

EMPLOYMENT / REENTRY: The resident has a tentative post-release job with her uncle's landscaping business ($15/hr cash for the first month). Case manager flagged that the parole officer typically requires documented, taxed employment and will need to approve the arrangement.

FINANCIAL: The resident reports ~$20 in her account; the facility fund will cover document costs.`,
    actionItems: [
      {
        task: "Complete the birth-certificate request form",
        assignee: "Client",
        deadline: null,
        context:
          "Required to obtain a State ID and lawful employment; facility fund covers the cost.",
        evidenceQuotes: [
          "I'll give you the form. You fill it out...",
          "Okay. I'll do it right now.",
        ],
      },
      {
        task: "Submit the birth-certificate request (via the facility fund) to the state",
        assignee: "Staff Member",
        deadline: null,
        context: "Processing takes about a month; needed well before release.",
        evidenceQuotes: [
          "we'll send it to the capital. It takes about a month to come back.",
        ],
      },
      {
        task: "Confirm with the parole officer whether the uncle's cash landscaping job is acceptable",
        assignee: "Staff Member",
        deadline: null,
        context: "Parole typically requires documented, taxed employment.",
        evidenceQuotes: [
          "We have to make sure your parole officer is okay with that.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Legal",
        updateType: "New",
        details:
          "No birth certificate (lost in a house fire ~3 yrs ago); blocks State ID and lawful employment. Replacement being ordered via facility fund (~1 month).",
      },
      {
        category: "Employment",
        updateType: "New",
        details:
          "Tentative post-release job at uncle's landscaping business ($15/hr cash, first month) pending parole-officer approval of the arrangement.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content: "Opened reentry planning (~90 days to release).",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[01:00]",
            content:
              "Employment plan — uncle's landscaping ($15/hr cash); needs parole approval.",
            status: "Discussed",
          },
          {
            timestamp: "[08:00]",
            content: "ID barrier",
            status: "Discussed",
            subItems: [
              { content: "No birth certificate (lost in house fire)." },
              {
                content:
                  "Blocks State ID and lawful employment; facility fund will cover replacement.",
              },
            ],
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Client: Complete birth-certificate request form.",
            status: "Assigned",
          },
          {
            content:
              "Staff: Submit the request to the state via facility fund.",
            status: "Assigned",
          },
          {
            content: "Staff: Verify uncle's cash job with the parole officer.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "The case manager spotted the real bottleneck, the missing birth certificate, and turned it into an immediate, fundable action instead of letting it stall the reentry plan.",
        "She explained the document chain plainly (no certificate, no ID, no real job), so Lilly understood why the form mattered and chose to do it right away.",
      ],
      growthOpportunities: [
        "When Lilly mentioned losing everything in the fire, including the only picture of her mom, a brief acknowledgment of that loss might have shown care before pivoting to paperwork.",
      ],
    },
  },

  // 19. Norris Crooks
  {
    type: "resident",
    givenNames: "Norris",
    surname: "Crooks",
    meetingType: "Assessment",
    durationMinutes: 50,
    transcript: `CM: Norris, sit down. We've got a long talk ahead of us. I saw the report from the yard yesterday.
Norris: Man, I'm telling you, that guard is out to get me! I didn't do nothing but stand there.
CM: The report says you were "aggressive and loud" and that you "squared up" to another resident.
Norris: 'Cause that guy was talking smack about my mom! You know I can't let nobody talk about my mom like that. She's a saint. She worked three jobs to feed us. And this guy, he's a nobody, he starts saying all this nasty stuff. What was I supposed to do? Just stand there and smile?
CM: No, you weren't supposed to smile, but you were supposed to walk away. You're six months away from your parole board, Norris. One "disorderly" ticket can push your date back a whole year. Is talking about your mom worth another year in here?
Norris: (Stomps his foot) It feels like it at the time! My blood just gets hot. It's like a fire in my ears. I don't even think. I just want to shut him up.
CM: That "fire in your ears" is what we talked about in Anger Management. You have to recognize it before you start yelling.
Norris: I tried! I took a breath, but then he said something else... he said she was a... well, I won't say it in front of you. But it was bad. And the guard, he didn't even tell the other guy to stop. He just came at me. He grabbed my arm and twisted it. Look at this bruise. It's purple.
CM: I see it. Did you go to medical to get it looked at?
Norris: No, I'm not going to medical. Those people don't care. They'll just say I'm faking it. I'm just mad, Miss. I'm trying to be good. I work in the kitchen, I scrub those big pots until my back hurts. I haven't had a ticket in a year. And now this?
CM: This is why it's so important to stay calm. The board doesn't care who started it. They only care who finished it. If you're the one yelling, you're the one getting the ticket.
Norris: So what happens now? Am I gonna get denied?
CM: I'm going to talk to the Sergeant. I'll see if he'll downgrade it to a "warning" since your record has been clean for a year. But you have to promise me something.
Norris: Anything. I'll scrub the floors with a toothbrush.
CM: You have to stay out of the yard for two weeks. Go to the gym instead, or stay in the library. Stay away from that guy. He's "bait," Norris. He's trying to get you to stay here. Don't let him win.
Norris: He's bait... yeah. I never thought of it like that. He's trying to steal my freedom.
CM: Exactly. Every time you get mad, say to yourself, "He's trying to steal my freedom."
Norris: Okay. I can do that. I want to go home. I got a daughter, you know. She's starting school this year. She's gonna have a little backpack and everything. My sister sent me a picture. She looks just like me, but prettier.
CM: Think about that backpack every time someone talks smack. Is that guy's mouth more important than your daughter's first day of school?
Norris: No. It ain't. I'm gonna stay in my cell and read. I got a book about tigers. I'll just read that.
CM: That's a good plan. Now, let's talk about your job plan again. You said your cousin does roofing?
Norris: Yeah, he's got his own crew. He said he'll pay me twenty bucks an hour because I'm family and I'm a hard worker. He knows I can carry the heavy bundles of shingles.
CM: Roofing is very hard work, Norris. It's hot and it's dangerous. Are you sure you're ready for that?
Norris: I'm ready for anything that isn't here. I'd rather be on a hot roof in July than in this cell. At least on the roof, I can see the trees and I can go get a Gatorade when I want.
CM: That's a good attitude. We'll start working on your parole letter next week. I want you to write about your daughter and the roofing job. It shows them you have a reason to stay out.
Norris: I'll start writing it tonight. I got some paper left.
CM: Good. And Norris—stay away from the yard. I mean it.
Norris: I'm like a ghost, Miss. You won't even see me.`,
    caseNote: `SUMMARY: Extended meeting addressing a yard disciplinary incident six months before the resident's parole board. Case manager linked behavior to parole risk, secured a commitment to a de-escalation plan, and advanced reentry/parole preparation.

CONDUCT / LEGAL: A report describes the resident as "aggressive and loud," having "squared up" to another resident who insulted his mother. With the parole board in six months, a disorderly ticket risks a one-year setback. Case manager will ask the Sergeant to downgrade the ticket to a warning given the resident's clean one-year record. The resident agreed to stay out of the yard for two weeks (using the gym/library) and to avoid the other resident.

HEALTH: The resident reports a guard twisted his arm, leaving a bruise; he declined medical evaluation.

FAMILY / EMPLOYMENT (REENTRY): The resident is motivated by his daughter starting school. He has a post-release roofing job with his cousin (~$20/hr). Case manager will begin a parole letter next week focused on his daughter and the job plan.`,
    actionItems: [
      {
        task: "Stay out of the yard for two weeks (use the gym or library) and avoid the other resident",
        assignee: "Client",
        deadline: "Two weeks",
        context:
          "De-escalation plan to protect the upcoming parole board date.",
        evidenceQuotes: [
          "You have to stay out of the yard for two weeks. Go to the gym instead, or stay in the library.",
          "Okay. I can do that.",
        ],
      },
      {
        task: "Begin writing the parole letter about his daughter and the roofing job plan",
        assignee: "Client",
        deadline: null,
        context:
          "Demonstrates a concrete reason to stay out; case manager will work on it together next week.",
        evidenceQuotes: [
          "I want you to write about your daughter and the roofing job.",
          "I'll start writing it tonight.",
        ],
      },
      {
        task: "Ask the Sergeant to downgrade the disciplinary ticket to a warning given the resident's clean one-year record",
        assignee: "Staff Member",
        deadline: null,
        context: "A disorderly ticket could push the parole date back a year.",
        evidenceQuotes: [
          "I'm going to talk to the Sergeant. I'll see if he'll downgrade it to a \"warning\" since your record has been clean for a year.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Legal",
        updateType: "New",
        details:
          'Yard disciplinary report ("aggressive," "squared up" to another resident) six months before parole board; risks a one-year setback. Case manager seeking downgrade to a warning.',
      },
      {
        category: "Health",
        updateType: "New",
        details:
          "Reports a guard twisted his arm, leaving a visible bruise; declined medical evaluation.",
      },
      {
        category: "Family",
        updateType: "Stable/Status Quo",
        details:
          "Daughter starting school this year; primary motivation for release and good behavior.",
      },
      {
        category: "Employment",
        updateType: "Stable/Status Quo",
        details:
          "Post-release roofing job lined up with his cousin (~$20/hr); to be featured in his parole letter.",
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:30]",
            content: "Opened with the yard incident report from the prior day.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[02:00]",
            content: "The incident",
            status: "Discussed",
            subItems: [
              {
                content:
                  'Resident reacted to insults about his mother; "squared up."',
              },
              {
                content:
                  "Reports a guard twisted his arm (bruise); declined medical.",
              },
            ],
          },
          {
            timestamp: "[18:00]",
            content: "Parole risk & de-escalation",
            status: "Discussed",
            subItems: [
              {
                content:
                  'Reframed antagonist as "bait" trying to cost him his freedom.',
              },
              { content: "Anchored coping to his daughter starting school." },
            ],
          },
          {
            timestamp: "[36:00]",
            content:
              "Reentry — roofing job with cousin (~$20/hr); parole letter next week.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Staff: Ask Sergeant to downgrade ticket to a warning.",
            status: "Assigned",
          },
          {
            content:
              "Client: Stay out of the yard two weeks; avoid the resident.",
            status: "Assigned",
          },
          {
            content: "Client: Start drafting parole letter tonight.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        'The case manager reframed the other resident as "bait" trying to steal his freedom, which gave Norris a way to see the provocation as a threat to his own goal.',
        'She anchored the plan to his daughter\'s first day of school, turning an abstract "stay calm" into something he was clearly motivated to protect.',
      ],
      growthOpportunities: [
        'When Norris showed the bruise and said medical wouldn\'t believe him, a reflection like "It sounds like you felt dismissed" might have kept him engaged before steering back to the parole stakes.',
      ],
    },
  },

  // 20. Zachary Hills
  {
    type: "resident",
    givenNames: "Zachary",
    surname: "Hills",
    meetingType: "Contact",
    durationMinutes: 10,
    transcript: `CM: Zachary, I have the paper for your Social Security card.
Zachary: Oh, for real? Did it come in the mail?
CM: No, this is just the form you need to sign so we can order it. I need you to sign right here on the "X."
Zachary: (Signs slowly, concentrating hard) There. Is that okay? I tried to make it neat.
CM: It's perfect. I also need to know if you ever had a job where you paid taxes before you came in.
Zachary: I worked at a car wash once for a summer. I think they took taxes out. And I worked at a pizza place for two weeks, but they just gave me cash.
CM: Okay, the car wash helps. It means you're already in the system. Once this card comes in, we can apply for your State ID. You're getting close to your release date, so we need these papers ready.
Zachary: Thanks, man. I appreciate you helping me. My head gets all mixed up with these forms. All the boxes and the tiny writing... it makes me dizzy.
CM: Don't worry about the forms. That's what I'm here for. You just focus on staying out of trouble.
Zachary: I'm trying. I just stay in my bunk and listen to my radio. I don't want no problems.
CM: That's the way to do it. I'll mail this today.
Zachary: Cool. See ya later.`,
    caseNote: `SUMMARY: Brief documentation meeting ahead of release. The resident signed a Social Security card request; case manager confirmed prior taxed employment and outlined the path to a State ID.

IDENTIFICATION: The resident signed the form to order a replacement Social Security card. He reported prior taxed employment (a summer at a car wash), confirming he is in the system. Once the card arrives, the case manager will apply for his State ID. Documents are being prepared ahead of his upcoming release.

SUPPORT NEED: The resident reports difficulty with paperwork ("the forms make me dizzy") and relies on case-manager assistance. He reports staying out of trouble (low profile, radio in his bunk).`,
    actionItems: [
      {
        task: "Mail the resident's signed Social Security card request form",
        assignee: "Staff Member",
        deadline: "Today",
        context:
          "Prerequisite document ahead of the resident's upcoming release.",
        evidenceQuotes: ["I'll mail this today."],
      },
      {
        task: "Apply for the resident's State ID once the Social Security card arrives",
        assignee: "Staff Member",
        deadline: null,
        context: "Card is a prerequisite; release date approaching.",
        evidenceQuotes: [
          "Once this card comes in, we can apply for your State ID.",
        ],
      },
    ],
    criticalUpdates: [
      {
        category: "Legal",
        updateType: "New",
        details:
          "Ordering a replacement Social Security card (prerequisite for a State ID) ahead of release. Prior taxed employment (car wash) confirms he is in the system.",
      },
      {
        category: "Other",
        updateType: "Stable/Status Quo",
        details:
          'Reports difficulty with paperwork ("the forms make me dizzy") and relies on case-manager help. Keeping a low profile.',
      },
    ],
    meetingSummary: [
      {
        title: "Check-In",
        items: [
          {
            timestamp: "[00:20]",
            content:
              "Case manager presented the Social Security card request form.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Discussion Log",
        items: [
          {
            timestamp: "[01:00]",
            content: "Resident signed the SS card request form.",
            status: "Completed",
          },
          {
            timestamp: "[03:00]",
            content:
              "Employment history — prior taxed car-wash job confirms he's in the system.",
            status: "Discussed",
          },
          {
            timestamp: "[06:00]",
            content:
              "Path to State ID outlined; documents prepped ahead of release.",
            status: "Discussed",
          },
        ],
      },
      {
        title: "Logistics & Plan",
        items: [
          {
            content: "Staff: Mail the SS card request form today.",
            status: "Assigned",
          },
          {
            content: "Staff: Apply for State ID once the card arrives.",
            status: "Assigned",
          },
        ],
      },
    ],
    staffFeedback: {
      whatYouDidWell: [
        "When Zachary said forms make his head spin, the case manager reassured him plainly (\"that's what I'm here for\") and took the paperwork burden off him.",
        "She affirmed his own strategy of keeping a low profile, reinforcing the behavior that protects his release.",
      ],
      growthOpportunities: [
        "After he carefully signed and asked if it was okay, a specific affirmation of the effort he put in might have built his confidence with a task he finds hard.",
      ],
    },
  },
];

export const DEMO_PEOPLE: DemoPerson[] = [...CLIENTS, ...RESIDENTS];
