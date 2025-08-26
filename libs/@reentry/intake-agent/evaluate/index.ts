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

import { AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  type ChatCompletionMessage,
  createLLMAsJudge,
  createLLMSimulatedUser,
  runMultiturnSimulation,
} from "openevals";

import { CLIENT_PERSONAS } from "~@reentry/intake-agent/evaluate/profiles";
import { IntakeAgent } from "~@reentry/intake-agent/index";
import { getIntakeConfigForState } from "~@reentry/intake-agent/intake_configs/utils";

const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];

const model = new ChatOpenAI({
  openAIApiKey: OPENAI_API_KEY,
  model: "gpt-5-mini-2025-08-07",
});

const config = getIntakeConfigForState("US_ID");

async function main() {
  const persona = CLIENT_PERSONAS["Ethan 'Eddie' Sullivan"];

  const intakeAgent = new IntakeAgent({
    checkpointer: new MemorySaver(),
    clientName: persona.name,
    intakeId: persona.name,
    config,
  });

  async function multiTurnAgent(params: {
    inputs: ChatCompletionMessage;
    threadId: string;
  }) {
    let messages;
    if (intakeAgent.getStatus() === "not_initialized") {
      messages = await intakeAgent.init();
    }

    messages = await intakeAgent.processResponse(params.inputs.content);

    return new AIMessage({
      content: messages.map((message) => message.content).join("\n"),
    });
  }

  const simulatedClient = createLLMSimulatedUser({
    system: `You are a person named ${persona.name}, who is ${persona.age} years old and was born on ${persona.dateOfBirth}. You are currently in a prison facility and are being interviewed by your social worker in preparation for your release.

    Here is a summary of your life and current situation:
    ${persona.summary}

    Here is a detailed breakdown of your life across various dimensions:
    ${Object.entries(persona.dimensions)
      .map(
        ([dimension, details]) =>
          `${dimension}:\nRisk Level: ${details.riskLevel}\nHistory: ${details.history}`,
      )
      .join("\n\n")}

    Please respond to the last question that was asked of you. 
    
    - Your answer should be based on the summary and detailed breakdown provided above, do not make anything up. However you can assume you are a US born citizen if that is relevant to answering the question.
    - Your answer should be concise (at most two short sentences) and relevant to your current situation. 
    - If you do not know the answer, say "I don't know." If you are unsure, say "I'm not sure."
    `,
    client: model,
    // Start with a empty message because we want the agent to ask the first question.
    fixedResponses: [{ role: "user", content: " " }],
  });

  const politenessEvaluator = createLLMAsJudge({
    model: "openai:o3-mini",
    prompt: `
      Here is a conversation between a social worker and a client in a prison facility. The social worker is conducting an intake interview to prepare the client for their release.

      {outputs}

      Evaluate on a scale of 1 to 10 how polite the social worker is in their responses to the client, no matter how rude the client is. A score of 1 means the social worker is very rude, and a score of 10 means the social worker is very polite. Provide a brief explanation for your score.
      `,
    feedbackKey: "politeness",
    choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });

  const askedFollowupQuestionsEvaluator = createLLMAsJudge({
    model: "openai:o3-mini",
    prompt: `
      Here is a conversation between a social worker and a client in a prison facility. The social worker is conducting an intake interview to prepare the client for their release.

      {outputs}

      Evaluate on a scale of 1 to 10 whether the social worker asked appropriate follow-up questions when a client did not provide all of the information asked.

      A score of 1 means the social worker did not ask any follow-up questions, and a score of 10 means the social worker asked all necessary follow-up questions thoroughly. Provide a brief explanation for your score, including any specific situations where the social worker should have asked a follow up question.
      `,
    feedbackKey: "follow-ups",
    choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });

  const coverageEvaluator = createLLMAsJudge({
    model: "openai:o3-mini",
    prompt: `
      Here is a conversation between a social worker and a client in a prison facility. The social worker is conducting an intake interview to prepare the client for their release.

      {outputs}

      Evaluate on a scale of 1 to 10 on whether the social worker covered all of the following sections in their conversation with the client, and attempted to gather all of the required information for each section. If the client said they did not want to answer a question or did not know, the social worker should have accepted that as a response and moved on to the next question.

      ${config.sections
        .map(
          (section) => `${section.title}:\n ${section.requiredInformation}\n`,
        )
        .join("\n")}

      A score of 1 means the social worker did not cover any sections, and a score of 10 means the social worker covered all sections thoroughly. Provide a brief explanation for your score, including any sections that were not covered or information that was not collected.
      `,
    feedbackKey: "coverage",
    choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });

  const askedForMoreInformationEvaluator = createLLMAsJudge({
    model: "openai:o3-mini",
    prompt: `
      Here is a conversation between a social worker and a client in a prison facility. The social worker is conducting an intake interview to prepare the client for their release.

      {outputs}

      Evaluate on a scale of 1 to 10 whether the social worker asked the client if they would like to provide any additional information related to the section they were discussing before moving on to the next section. Here is a list of the sections that were covered in the conversation:

      ${config.sections
        .map(
          (section) => `${section.title}:\n ${section.requiredInformation}\n`,
        )
        .join("\n")}

      A score of 1 means the social worker did not ask the client if they would like to provide any additional information related to the section they were discussing for any of the sections, and a score of 10 means they asked that after every section.
      `,
    feedbackKey: "asked-for-more-information",
    choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });

  const askedAtMostTwoQuestionsEvaluator = createLLMAsJudge({
    model: "openai:o3-mini",
    prompt: `
      Here is a conversation between a social worker and a client in a prison facility. The social worker is conducting an intake interview to prepare the client for their release.

      {outputs}

      Evaluate on a scale of 1 to 10 on whether the social worker asked at most two questions in each of their responses to the client.

      A score of 1 means the social worker asked more than two questions in almost all of their responses to the client, and a score of 10 means they asked at most two questions in every response.
      `,
    feedbackKey: "asked-at-most-two-questions",
    choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });

  const didNotGroupUnrelatedQuestionsEvaluator = createLLMAsJudge({
    model: "openai:o3-mini",
    prompt: `
      Here is a conversation between a social worker and a client in a prison facility. The social worker is conducting an intake interview to prepare the client for their release.

      {outputs}

      Evaluate on a scale of 1 to 10 on whether, for each individual response it gave, the social worked only grouped related questions together. 
      
      An example of two related questions is "Do you have any government-issued photo ID (like a state ID or driver's license)?" and "If you don't, would you like help getting one?"
      
      An example of two unrelated questions is "Would you like help getting a government-issued photo ID?" and "Are you a veteran, and if so, what type of discharge did you receive (Honorable, General under honorable conditions, or Other Than Honorable)?"

      A score of 1 means that for every response where they grouped questions together, the social worked grouped unrelated questions together, and a score of 10 means that for every single response where they grouped questions together, they only grouped related questions.
      `,
    feedbackKey: "did-not-group-unrelated-questions",
    choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });

  const didNotThankInFirstQuestionForNewSectionEvaluator = createLLMAsJudge({
    model: "openai:o3-mini",
    prompt: `
      Here is a conversation between a social worker and a client in a prison facility. The social worker is conducting an intake interview to prepare the client for their release.

      {outputs}

      Evaluate on a scale of 1 to 10 on whether the social worker thanked the client for their last response in the first question of the new section. They should not be thanking the client in the first question of a new section, only in the statement saying they are moving on to the new section.

      A score of 1 means the social worker did thank the client every time, and a score of 10 means they did not thank the client in the first question of a new section at all.
      `,
    feedbackKey: "did-not-thank-in-first-question-for-new-section",
    choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });

  const didNotOfferHelpEvaluator = createLLMAsJudge({
    model: "openai:o3-mini",
    prompt: `
      Here is a conversation between a social worker and a client in a prison facility. The social worker is conducting an intake interview to prepare the client for their release.

      {outputs}

      Evaluate on a scale of 1 to 10 on whether the social worker offered help, advice, or solutions in their questions. They should not be offering help, advice, or solutions in their questions, only collecting information.

      A score of 1 means the social worker offered help, advice, or solutions every time, and a score of 10 means they did not offer help, advice, or solutions in their questions at all.
      `,
    feedbackKey: "did-not-offer-help",
    choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });

  const result = await runMultiturnSimulation({
    app: multiTurnAgent,
    user: simulatedClient,
    maxTurns: 100,
    stoppingCondition: async () => {
      return (
        intakeAgent.getStatus() === "completed" ||
        intakeAgent.getStatus() === "error"
      );
    },
    trajectoryEvaluators: [
      politenessEvaluator,
      coverageEvaluator,
      askedFollowupQuestionsEvaluator,
      askedForMoreInformationEvaluator,
      askedAtMostTwoQuestionsEvaluator,
      didNotGroupUnrelatedQuestionsEvaluator,
      didNotThankInFirstQuestionForNewSectionEvaluator,
      didNotOfferHelpEvaluator,
    ],
  });

  console.log("Simulation completed successfully.");
  console.log("Trajectory:", result.trajectory);
  console.log("Evaluator Results:", result.evaluatorResults);
}

main();
