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
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  Annotation,
  Command,
  END,
  interrupt,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

import { LSIR_SECTIONS } from "./constants";
import {
  doesClientNeedHelpPrompt,
  doesClientNeedHelpStructure,
  getOpeningRemarksPrompt,
  isSectionCompleteStructure,
  questionPrompt,
} from "./prompts";
import { getSectionTitle } from "./utils";

const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];

const model = new ChatOpenAI({
  openAIApiKey: OPENAI_API_KEY,
  model: "o4-mini",
});

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  clientName: Annotation<string>,
  currentSectionIndex: Annotation<number>({
    reducer: (_state, update) => update,
    default: () => 0,
  }),
});

type State = typeof StateAnnotation.State;

async function generateNewWelcomeMessage(state: State) {
  const { currentSectionIndex, clientName } = state;

  const welcomeMessage = await model.invoke([
    new SystemMessage(getOpeningRemarksPrompt(clientName)),
    ...state.messages,
  ]);

  welcomeMessage.response_metadata = {
    ...welcomeMessage.response_metadata,
    section: getSectionTitle(currentSectionIndex),
  };

  return {
    messages: [welcomeMessage],
  };
}

async function generateReturningWelcomeMessage(state: State) {
  const { currentSectionIndex, clientName } = state;
  console.log(currentSectionIndex);
  return {
    messages: [
      new AIMessage({
        content: `Hi ${clientName}, thanks for joining again! Let's continue our conversation.`,
        response_metadata: { section: getSectionTitle(currentSectionIndex) },
      }),
    ],
  };
}

async function askQuestion(state: State) {
  const { currentSectionIndex } = state;
  const currentSection = LSIR_SECTIONS[currentSectionIndex];

  const prompt = questionPrompt(currentSection);

  const response = (await model
    .withStructuredOutput(isSectionCompleteStructure)
    .invoke([new SystemMessage(prompt), ...state.messages])) as z.infer<
    typeof isSectionCompleteStructure
  >;

  console.log(`Is Section Complete: ${response.isSectionComplete}`);
  console.log(
    `Is Section Complete Reasoning: ${response.isSectionCompleteReasoning}`,
  );
  console.log("\n");

  if (response.isSectionComplete || !response.response) {
    if (currentSectionIndex === LSIR_SECTIONS.length - 1) {
      return new Command({
        goto: "closing_remarks",
      });
    }

    return new Command({
      goto: "transition_to_next_section",
    });
  }

  return new Command({
    update: {
      messages: [
        new AIMessage({
          content: response.response,
          response_metadata: {
            section: getSectionTitle(currentSectionIndex),
          },
        }),
      ],
    },
    goto: "human",
  });
}

async function transitionToNextSection(state: State) {
  const { currentSectionIndex } = state;

  return {
    currentSectionIndex: state.currentSectionIndex + 1,
    messages: [
      new AIMessage({
        content: `Thank you for sharing all of that information. I really appreciate it. Let's move on to the next section!`,
        response_metadata: { section: getSectionTitle(currentSectionIndex) },
      }),
    ],
  };
}

async function human(state: State) {
  const { currentSectionIndex } = state;
  const userInput = interrupt("Ready for user input.");

  return {
    messages: [
      new HumanMessage({
        content: userInput,
        response_metadata: {
          section: getSectionTitle(currentSectionIndex),
        },
      }),
    ],
  };
}

async function checkIfClientNeedsHelp(state: State) {
  const response = (await model
    .withStructuredOutput(doesClientNeedHelpStructure)
    .invoke([
      new SystemMessage(doesClientNeedHelpPrompt),
      ...state.messages,
    ])) as z.infer<typeof doesClientNeedHelpStructure>;

  console.log(`Needs Help: ${response.needsHelp}`);
  console.log(`Needs Help AI Reasoning: ${response.needsHelpReasoning}`);
  console.log("\n");

  // If the client needs help, redirect to the closing remarks node.
  if (response.needsHelp) {
    return new Command({
      goto: "end_chat",
    });
  }

  return new Command({
    goto: "ask_question",
  });
}

export function endChat(state: State) {
  const { currentSectionIndex } = state;
  const newMessage = new AIMessage({
    content: `I see! Ending the conversation now.`,
    response_metadata: {
      section: getSectionTitle(currentSectionIndex),
    },
  });

  return {
    messages: [newMessage],
  };
}

export function closingRemarks(state: State) {
  const { currentSectionIndex, clientName } = state;

  return {
    messages: [
      new AIMessage({
        content: `Thank you for your time today, ${clientName}. I appreciate you sharing all of this information with me. We have reached the end of our conversation!`,
        response_metadata: {
          section: getSectionTitle(currentSectionIndex),
        },
      }),
    ],
  };
}

export const builder = new StateGraph(StateAnnotation)
  .addNode("new_welcome_message", generateNewWelcomeMessage)
  .addNode("returning_welcome_message", generateReturningWelcomeMessage)
  .addNode("ask_question", askQuestion, {
    ends: ["transition_to_next_section", "human", "closing_remarks"],
  })
  .addNode("transition_to_next_section", transitionToNextSection)
  .addNode("human", human)
  .addNode("check_if_client_needs_help", checkIfClientNeedsHelp, {
    ends: ["end_chat"],
  })
  .addNode("end_chat", endChat)
  .addNode("closing_remarks", closingRemarks)
  .addConditionalEdges(
    START,
    (state: State) => {
      if (state.messages.length === 0) {
        return "new_client_welcome_message";
      }

      return "returning_client_welcome_message";
    },
    {
      new_client_welcome_message: "new_welcome_message",
      returning_client_welcome_message: "returning_welcome_message",
    },
  )
  .addEdge("new_welcome_message", "ask_question")
  .addEdge("returning_welcome_message", "ask_question")
  .addEdge("transition_to_next_section", "ask_question")
  .addEdge("human", "check_if_client_needs_help")
  .addEdge("end_chat", END)
  .addEdge("closing_remarks", END);
