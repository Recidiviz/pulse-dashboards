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

import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  type ChatCompletionMessage,
  createLLMAsJudge,
  createLLMSimulatedUser,
  runMultiturnSimulation,
} from "openevals";

import { LSIR_SECTIONS } from "~@reentry/intake-agent/constants";
import { CLIENT_PERSONAS } from "~@reentry/intake-agent/evaluate/profiles";
import { IntakeAgent } from "~@reentry/intake-agent/index";

const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];

const model = new ChatOpenAI({
  openAIApiKey: OPENAI_API_KEY,
  model: "o4-mini",
});

async function main() {
  const persona = CLIENT_PERSONAS["Ethan 'Eddie' Sullivan"];

  const intakeAgent = new IntakeAgent(new MemorySaver(), persona.name);

  async function multiTurnAgent(params: {
    inputs: ChatCompletionMessage;
    threadId: string;
  }) {
    let messages;
    if (intakeAgent.getStatus() === "not_started") {
      messages = await intakeAgent.start();
    }

    messages = await intakeAgent.processResponse(params.inputs.content);

    return { content: messages.join("\n"), role: "assistant" };
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

    Please respond to the last question that was asked of you. Your answer should be based on the summary and detailed breakdown provided above, do not make anything up. Your answer should be concise and relevant to your current situation. If you do not know the answer, say "I don't know." If you are unsure, say "I'm not sure."
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

  const coverageEvaluator = createLLMAsJudge({
    model: "openai:o3-mini",
    prompt: `
      Here is a conversation between a social worker and a client in a prison facility. The social worker is conducting an intake interview to prepare the client for their release.

      {outputs}

      Evaluate on a scale of 1 to 10 on whether the social worker covered all of the following sections in their conversation with the client, and attempted to gather all of the required information for each section. If the client said they did not want to answer a question or did not know, the social worker should have accepted that as a response and moved on to the next question.

      ${LSIR_SECTIONS.map(
        (section) => `${section.title}:\n ${section.requiredInformation}\n`,
      ).join("\n")}

      A score of 1 means the social worker did not cover any sections, and a score of 10 means the social worker covered all sections thoroughly. Provide a brief explanation for your score, including any sections that were not covered or information that was not collected.
      `,
    feedbackKey: "coverage",
    choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });

  const result = await runMultiturnSimulation({
    app: multiTurnAgent,
    user: simulatedClient,
    maxTurns: 50,
    stoppingCondition: async () => {
      return (
        intakeAgent.getStatus() === "completed" ||
        intakeAgent.getStatus() === "error"
      );
    },
    trajectoryEvaluators: [politenessEvaluator, coverageEvaluator],
  });

  console.log("Simulation completed successfully.");
  console.log("Trajectory:", result.trajectory);
  console.log("Evaluator Results:", result.evaluatorResults);
}

main();
