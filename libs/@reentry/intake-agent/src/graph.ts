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

import { SystemMessage } from "@langchain/core/messages";
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

import {
  doesClientNeedHelpStructure,
  getDoesClientNeedHelpPrompt,
  getOpeningRemarksPrompt,
  getQuestionPrompt,
  isSectionCompleteStructure,
} from "~@reentry/intake-agent/prompts";
import {
  createAiMessageWithMetadata,
  createHumanMessageWithMetadata,
  getSectionTitle,
} from "~@reentry/intake-agent/utils";
import { IntakeConfig } from "~@reentry/prisma/types";

const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];

const model = new ChatOpenAI({
  openAIApiKey: OPENAI_API_KEY,
  model: "o4-mini",
});

const STATE_ANNOTATION_OBJECT = {
  ...MessagesAnnotation.spec,
  clientName: Annotation<string>({
    reducer: (_state, update) => update,
    default: () => "Client",
  }),
  config: Annotation<IntakeConfig>(),
  currentSectionIndex: Annotation<number>({
    reducer: (_state, update) => update,
    default: () => 0,
  }),
};

const StateAnnotation = Annotation.Root(STATE_ANNOTATION_OBJECT);

type State = typeof StateAnnotation.State;

type QuestionType = "regular_question" | "section_cap_question";

const HumanNodeAnnotation = Annotation.Root({
  ...STATE_ANNOTATION_OBJECT,
  questionType: Annotation<QuestionType>,
});

type HumanNodeType = typeof HumanNodeAnnotation.State;

async function generateNewWelcomeMessage(state: State) {
  const { currentSectionIndex, clientName, config } = state;

  const welcomeMessage = await model.invoke([
    new SystemMessage(getOpeningRemarksPrompt(clientName, config)),
    ...state.messages,
  ]);

  welcomeMessage.response_metadata = {
    ...welcomeMessage.response_metadata,
    section: getSectionTitle(config, currentSectionIndex),
  };

  return {
    messages: [welcomeMessage],
  };
}

async function generateReturningWelcomeMessage(state: State) {
  const { currentSectionIndex, clientName, config } = state;
  console.log(currentSectionIndex);
  return {
    messages: [
      createAiMessageWithMetadata({
        content: `Welcome back, ${clientName}! Let's continue our conversation.`,
        config,
        currentSectionIndex,
      }),
    ],
  };
}

async function askQuestion(state: State) {
  const { currentSectionIndex, config } = state;

  const prompt = getQuestionPrompt(config, currentSectionIndex);

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

  return {
    messages: [
      createAiMessageWithMetadata({
        content: response.response,
        config,
        currentSectionIndex,
      }),
    ],
    questionType: response.isSectionComplete
      ? "section_cap_question"
      : "regular_question",
  };
}

async function human(state: HumanNodeType) {
  const { currentSectionIndex, config, questionType } = state;

  const userInput = interrupt("Ready for user input.");

  const userResponseMessage = createHumanMessageWithMetadata({
    content: userInput,
    config,
    currentSectionIndex,
  });

  const response = (await model
    .withStructuredOutput(doesClientNeedHelpStructure)
    .invoke([
      new SystemMessage(getDoesClientNeedHelpPrompt(state.config.role)),
      ...[...state.messages, userResponseMessage],
    ])) as z.infer<typeof doesClientNeedHelpStructure>;

  console.log(`Needs Help: ${response.needsHelp}`);
  console.log(`Needs Help AI Reasoning: ${response.needsHelpReasoning}`);
  console.log("\n");

  // If the client needs help, redirect to the closing remarks node.
  if (response.needsHelp) {
    return new Command({
      update: {
        messages: [userResponseMessage],
      },
      goto: "end_chat",
    });
  }

  return new Command({
    update: {
      messages: [userResponseMessage],
    },
    goto:
      questionType === "regular_question"
        ? "ask_question"
        : "transition_to_next_section",
  });
}

async function transitionToNextSection(state: State) {
  const { currentSectionIndex, config } = state;

  if (currentSectionIndex + 1 === config.sections.length) {
    return new Command({
      goto: "closing_remarks",
    });
  }

  return new Command({
    update: {
      currentSectionIndex: state.currentSectionIndex + 1,
      messages: [
        createAiMessageWithMetadata({
          content: `Thank you for sharing all of that information. I really appreciate it. Let's move on to the next section!`,
          config: config,
          currentSectionIndex: currentSectionIndex + 1,
        }),
      ],
    },
    goto: "ask_question",
  });
}

export function endChat(state: State) {
  const { currentSectionIndex, config } = state;
  const newMessage = createAiMessageWithMetadata({
    content: `I see! Ending the conversation now.`,
    config,
    currentSectionIndex,
  });

  return {
    messages: [newMessage],
  };
}

export function closingRemarks(state: State) {
  const { currentSectionIndex, clientName, config } = state;

  return {
    messages: [
      createAiMessageWithMetadata({
        content: `Thank you for your time today, ${clientName}. I appreciate you sharing all of this information with me. We have reached the end of our conversation!`,
        config,
        currentSectionIndex,
      }),
    ],
  };
}

export const builder = new StateGraph(StateAnnotation)
  .addNode("new_welcome_message", generateNewWelcomeMessage)
  .addNode("returning_welcome_message", generateReturningWelcomeMessage)
  .addNode("ask_question", askQuestion)
  .addNode("human", human, {
    input: HumanNodeAnnotation,
    ends: ["end_chat", "ask_question", "transition_to_next_section"],
  })
  .addNode("transition_to_next_section", transitionToNextSection, {
    ends: ["ask_question", "closing_remarks"],
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
  .addEdge("ask_question", "human")
  .addEdge("end_chat", END)
  .addEdge("closing_remarks", END);
