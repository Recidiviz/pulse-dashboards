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

/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-await-in-loop */
import { config } from "dotenv";
import * as fs from "fs";
import { completion } from "litellm";
import puppeteer, { Browser, Page } from "puppeteer";
config();

let BASE_URL = process.env.url || "http://localhost:3000";

interface AssessmentConfig {
  state: string;
  docId: string;
  headless?: boolean;
  timeout?: number;
  noLlm?: boolean;
}

interface LogEntry {
  timestamp: string;
  type: "user_message" | "ai_response";
  content: string;
}

export class AssessmentAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private conversationHistory: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [];
  private lastSentMessage = "";
  private logPath = "";
  private config: AssessmentConfig | null = null;

  constructor() {
    // Initialize conversation with system message
    this.conversationHistory.push({
      role: "system",
      content:
        "You are a person private of your liberty having a casual conversation. Keep your answers very short and simple, like how regular people talk in everyday situations. Use 1-2 sentences maximum, if the question its not.",
    });

    // Setup file paths
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.logPath = `logs/conversation_${timestamp}.ljson`;

    // Ensure directories exist
    if (!fs.existsSync("logs")) {
      fs.mkdirSync("logs", { recursive: true });
    }
  }

  async launch(config: AssessmentConfig): Promise<void> {
    this.config = config;
    this.browser = await puppeteer.launch({
      headless: config.headless ?? false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async navigateToAssessment(): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not launched. Call launch() first.");
    }

    console.log(`Navigating to ${BASE_URL}/assessment`);
    await this.page.goto(`${BASE_URL}/assessment`, {
      waitUntil: "networkidle2",
    });
  }

  async fillFormFields(config: AssessmentConfig): Promise<void> {
    if (!this.page) {
      throw new Error("Page not available");
    }

    console.log("Filling form fields...");

    // Fill state dropdown - look for the button element
    let stateButton = await this.page.$(
      'label[for="state-select"] + div button, #state-select',
    );

    if (!stateButton) {
      // Fallback: try to find any button near "State" text
      const buttons = await this.page.$$("button");
      for (const button of buttons) {
        const text = await this.page.evaluate(
          (el) => el.textContent || "",
          button,
        );
        if (
          text.toLowerCase().includes("select state") ||
          text.toLowerCase().includes("state")
        ) {
          stateButton = button;
          break;
        }
      }
    }

    if (!stateButton) {
      throw new Error("Could not find state selector button");
    }

    // Click the state button to open dropdown
    await stateButton.click();
    console.log(
      "Clicked state dropdown button, waiting for options to appear...",
    );

    // Wait for dropdown options to appear
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Wait for dropdown options to be visible
    try {
      await this.page.waitForSelector(
        '[role="option"], li[class*="option"], div[class*="option"], button[role="option"]',
        {
          visible: true,
          timeout: 3000,
        },
      );
      console.log("Dropdown options are now visible");
    } catch (e) {
      console.log(
        "Dropdown options not found with standard selectors, trying to find first option...",
      );
    }

    // Additional wait to ensure dropdown is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Find and click the option that matches the desired state
    const optionClicked = await this.page.evaluate((stateName) => {
      const selectors = [
        '[role="option"]',
        'li[class*="option"]',
        'div[class*="option"]',
        'div[class*="item"]',
        'button[role="option"]',
      ];

      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        if (elements.length > 0) {
          // Try to find the element that matches the state name
          const matchingElement = elements.find((el) =>
            el.textContent
              ?.trim()
              .toLowerCase()
              .includes(stateName.toLowerCase()),
          );

          if (matchingElement) {
            (matchingElement as HTMLElement).click();
            console.log(
              "Clicked matching option:",
              matchingElement.textContent?.trim(),
            );
            return true;
          } else {
            // Fallback: click the first option if no match found
            const firstElement = elements[0];
            (firstElement as HTMLElement).click();
            console.log(
              "No match found, clicked first option:",
              firstElement.textContent?.trim(),
            );
            return true;
          }
        }
      }
      return false;
    }, config.state);

    if (optionClicked) {
      console.log(`Successfully clicked state option: ${config.state}`);
    } else {
      console.log("Could not find any options to click");
    }

    // Fill DOC ID
    const docIdInput = await this.page.$(
      'input[placeholder*="DOC ID" i], input[placeholder*="Enter DOC ID" i]',
    );
    if (docIdInput) {
      await docIdInput.type(config.docId);
      console.log(`Filled DOC ID: ${config.docId}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("All form fields filled successfully");
  }

  async clickContinue(): Promise<void> {
    if (!this.page) {
      throw new Error("Page not available");
    }

    console.log("Looking for continue button");

    const continueSelectors = [
      'button[type="submit"]',
      'input[type="submit"][value*="Continue"]',
      'input[type="button"][value*="Continue"]',
      '[data-testid*="continue"]',
      ".continue-btn",
      "#continue",
      "button",
    ];

    let continueButton = null;

    for (const selector of continueSelectors) {
      try {
        continueButton = await this.page.$(selector);
        if (continueButton) {
          const text = await this.page.evaluate(
            (el) => el.textContent || el.value || "",
            continueButton,
          );
          if (text.toLowerCase().includes("continue")) {
            break;
          }
          if (selector === "button" || selector === 'button[type="submit"]') {
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (!continueButton) {
      await this.page.screenshot({ path: "debug-screenshot.png" });
      throw new Error(
        "Continue button not found. Screenshot saved as debug-screenshot.png",
      );
    }

    console.log("Clicking continue button");
    await continueButton.click();

    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Continue button clicked successfully");
  }

  async writeToTextarea(content: string): Promise<void> {
    if (!this.page) {
      throw new Error("Page not available");
    }

    try {
      console.log('Looking for textarea with placeholder "Write a message"...');

      // Look for textarea with the specific placeholder
      const textarea = await this.page.$(
        'textarea[placeholder="Write a message"]',
      );

      if (!textarea) {
        console.log('Textarea with placeholder "Write a message" not found');
        return;
      }

      // Clear existing content and type new content
      await textarea.click({ clickCount: 3 }); // Select all existing text
      await textarea.type(content);

      // Press Enter to send the message
      await textarea.press("Enter");
      this.lastSentMessage = "";
      console.log("Successfully wrote content to textarea and pressed Enter");
    } catch (error) {
      console.error("Error writing to textarea:", error);
    }
  }

  async searchLastElementContent(): Promise<string | null> {
    if (!this.page) {
      throw new Error("Page not available");
    }

    console.log("Searching for elements with the specified selector...");

    const selector = ".case-worker-message";

    try {
      const elements = await this.page.$$(selector);

      if (elements.length === 0) {
        console.log("No elements found with the specified selector");
        return null;
      }

      const lastElement = elements[elements.length - 1];
      const content = await this.page.evaluate((el) => {
        // Remove style and script tags
        const clonedEl = el.cloneNode(true);
        const styleTags = clonedEl.querySelectorAll(
          "style, script",
        ) as Array<any>;
        styleTags.forEach((tag) => tag.remove());

        // Get text content and clean it
        let text = clonedEl.textContent || clonedEl.innerText || "";

        // Remove CSS-like content (anything between { })
        text = text.replace(/\{[^}]*\}/g, "");

        // Remove @keyframes and other CSS rules
        text = text.replace(/@[\w-]+[^{]*\{[^}]*\}/g, "");

        // Remove common CSS properties and values
        text = text.replace(/\b\d+%\b/g, "");
        text = text.replace(/\btransform:\s*[^;]+;?/g, "");
        text = text.replace(/\bopacity:\s*[^;]+;?/g, "");
        text = text.replace(/\banimation:\s*[^;]+;?/g, "");

        // Clean up whitespace and newlines
        text = text.replace(/\s+/g, " ").trim();

        return text;
      }, lastElement);

      console.log(`Found ${elements.length} elements with the selector`);
      console.log("Content of the last element:");
      console.log(content);

      const trimmedContent = content
        .trim()
        .replace("Message bubble tail", "")
        .trim();

      // Check if this is the same message as the last one sent
      if (trimmedContent === this.lastSentMessage) {
        console.log("Message is the same as last sent message, skipping...");
        return null;
      }

      return trimmedContent;
    } catch (error) {
      console.error("Error searching for element content:", error);
      return null;
    }
  }

  async sendToLLM(content: string): Promise<void> {
    try {
      console.log("Sending content to LLM...");

      // Add user message to conversation history
      this.conversationHistory.push({
        role: "user",
        content: `${content}`,
      });

      // Log the user message
      await this.logMessage("user_message", content);

      // Update the last sent message
      this.lastSentMessage = content;

      let aiResponse: string | undefined;

      if (this.config?.noLlm) {
        // If --no-llm flag is set, always answer "no"
        aiResponse = "no";
        console.log("Using --no-llm mode, answering: no");
      } else {
        const response = await completion({
          model: "openrouter/openai/gpt-5-mini",
          messages: [
            this.conversationHistory[0], // system message
            this.conversationHistory[this.conversationHistory.length - 1], // last message (current user message)
          ],
          apiKey: process.env.OPENROUTER_API_KEY || "",
          baseUrl: "https://litellm.app.monadical.io/v1/",
        });

        aiResponse = response.choices[0]?.message?.content;
      }

      if (aiResponse) {
        // Add assistant's response to conversation history
        this.conversationHistory.push({
          role: "assistant",
          content: aiResponse,
        });

        console.log("LLM Response:");
        console.log(aiResponse);

        // Log the AI response
        await this.logMessage("ai_response", aiResponse);

        // Write the LLM response to the textarea
        await this.writeToTextarea(aiResponse);

        // Keep conversation history manageable (last 20 messages)
        if (this.conversationHistory.length > 21) {
          // Keep system message and last 20 messages
          this.conversationHistory = [
            this.conversationHistory[0], // Keep system message
            ...this.conversationHistory.slice(-20), // Keep last 20 messages
          ];
        }
      }
    } catch (error) {
      console.error("Error communicating with LLM:", error);
    }
  }

  async continuousMonitoring(): Promise<void> {
    while (true) {
      const content = await this.searchLastElementContent();

      if (content) {
        await this.sendToLLM(content);
      }

      console.log("Waiting 15 seconds before next check...");
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
  }

  private async logMessage(
    type: "user_message" | "ai_response",
    content: string,
  ): Promise<void> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      content,
    };

    const logLine = JSON.stringify(logEntry) + "\n";

    try {
      await fs.promises.appendFile(this.logPath, logLine, "utf8");
      console.log(`Logged ${type} to ${this.logPath}`);
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async run(config: AssessmentConfig): Promise<void> {
    try {
      await this.launch(config);
      await this.navigateToAssessment();
      await this.fillFormFields(config);
      await this.clickContinue();

      console.log("Waiting for 30 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 30000));

      console.log("Starting continuous monitoring...");
      await this.continuousMonitoring();

      console.log("Assessment automation completed successfully");
    } catch (error) {
      console.error("Error during assessment automation:", error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

export async function runMultiplePuppetsFromFile(
  puppetsFilePath: string,
  noLlm = false,
): Promise<void> {
  if (!fs.existsSync(puppetsFilePath)) {
    throw new Error(`Puppets file not found: ${puppetsFilePath}`);
  }

  const fileContent = fs.readFileSync(puppetsFilePath, "utf8");
  const lines = fileContent
    .trim()
    .split("\n")
    .filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("No puppet data found in file");
  }

  const puppets: AssessmentAutomation[] = [];
  const puppetPromises: Promise<void>[] = [];

  console.log(`Starting ${lines.length} puppet instances from file...`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const parts = line.split(/\s+/);

    if (parts.length !== 2) {
      console.error(
        `Invalid format on line ${i + 1}: ${line}. Expected: <state> <docId>`,
      );
      continue;
    }

    const [state, docId] = parts;

    const puppet = new AssessmentAutomation();
    const config: AssessmentConfig = {
      state,
      docId,
      headless: false,
      noLlm,
    };

    puppets.push(puppet);

    const puppetPromise = puppet.run(config).catch((error) => {
      console.error(`Puppet ${state} ${docId} failed:`, error);
    });

    puppetPromises.push(puppetPromise);

    // Small delay between launching puppets to avoid overwhelming the system
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Wait for all puppets to complete or fail
  await Promise.allSettled(puppetPromises);

  console.log("All puppets have finished");
}

export async function runMultiplePuppets(
  baseState = "US_ID",
  baseDocId = "12345",
  noLlm = false,
): Promise<void> {
  const puppets: AssessmentAutomation[] = [];
  const puppetPromises: Promise<void>[] = [];

  console.log("Starting 5 puppet instances...");

  for (let i = 1; i <= 5; i++) {
    const puppet = new AssessmentAutomation();
    const config: AssessmentConfig = {
      state: baseState,
      docId: `${baseDocId}${i}`,
      headless: false,
      noLlm,
    };

    puppets.push(puppet);

    const puppetPromise = puppet.run(config).catch((error) => {
      console.error(`Puppet ${i} failed:`, error);
    });

    puppetPromises.push(puppetPromise);

    // Small delay between launching puppets to avoid overwhelming the system
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Wait for all puppets to complete or fail
  await Promise.allSettled(puppetPromises);

  console.log("All puppets have finished");
}

export async function runAssessment(
  state = "US_ID",
  docId = "12345",
  noLlm = false,
): Promise<void> {
  const automation = new AssessmentAutomation();
  const config: AssessmentConfig = {
    state,
    docId,
    headless: false,
    noLlm,
  };
  await automation.run(config);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const noLlmFlag = args.includes("--no-llm");
  const baseUrlIndex = args.indexOf("--base-url");

  if (baseUrlIndex !== -1 && args[baseUrlIndex + 1]) {
    BASE_URL = args[baseUrlIndex + 1];
    console.log(`Using base URL: ${BASE_URL}`);
  }

  const puppetsFilePath = args.find(
    (arg) => !arg.startsWith("--") && arg !== BASE_URL,
  );

  if (!puppetsFilePath) {
    console.error(
      "Usage: node src/assessment.ts <puppets-file-path> [--no-llm] [--base-url <url>]",
    );
    console.error("");
    console.error("Options:");
    console.error(
      "  --no-llm              Always answer 'no' to questions without using LLM",
    );
    console.error(
      "  --base-url <url>      Set the base URL (default: http://localhost:3000)",
    );
    console.error("");
    console.error("Example file format:");
    console.error("US_ID 123456");
    console.error("US_TN 789012");
    console.error("US_PA 345678");
    console.error("");
    console.error("Each line should contain: <state> <docId>");
    process.exit(1);
  }

  runMultiplePuppetsFromFile(puppetsFilePath, noLlmFlag)
    .then(() => {
      console.log("All assessments completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Multiple puppet assessment failed:", error);
      process.exit(1);
    });
}
