# Reentry Intake Bot

An automated assessment bot that uses Puppeteer to simulate user interactions with the Recidiviz reentry intake assessment form. The bot can either use an LLM to generate human-like responses or automatically answer "no" to all questions.

## Features

- Automated form filling with State selection and DOC ID
- Two modes of operation:
  - **LLM Mode**: Uses AI to generate realistic, conversational responses
  - **No-LLM Mode**: Automatically answers "no" to all questions
- Multi-puppet support: Run multiple assessments simultaneously
- Conversation logging in JSON Lines format
- Continuous monitoring and response to assessment questions

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Environment variables configured (see Configuration section)

## Installation

```bash
npm install
# or
yarn install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
BASE_URL=http://localhost:3000
OPENROUTER_API_KEY=your_api_key_here
```

- `BASE_URL`: The URL where your assessment form is hosted
- `OPENROUTER_API_KEY`: Your OpenRouter API key (only needed for LLM mode)

## Usage

### Basic Usage

Create a text file with puppet data (one per line):

```
US_ID 123456
US_TN 789012
US_PA 345678
```

Each line should contain:
- State code (e.g., US_ID, US_TN, US_PA)
- DOC ID (Department of Corrections ID number)

Run the bot:

```bash
# With LLM (generates conversational responses)
node index.tsx puppets.txt

# Without LLM (always answers "no")
node index.tsx puppets.txt --no-llm
```

### Command Line Options

```
Usage: node index.tsx <puppets-file-path> [--no-llm]

Options:
  --no-llm    Always answer 'no' to questions without using LLM
```

### Programmatic Usage

```typescript
import { runAssessment, runMultiplePuppets, runMultiplePuppetsFromFile } from './index';

// Run a single assessment
await runAssessment('US_ID', '123456', false);

// Run a single assessment with --no-llm mode
await runAssessment('US_ID', '123456', true);

// Run multiple puppets with the same state
await runMultiplePuppets('US_ID', '12345', false);

// Run multiple puppets from a file
await runMultiplePuppetsFromFile('./puppets.txt', false);
```

## How It Works

1. **Form Filling**: The bot navigates to the assessment page and fills in:
   - State (from dropdown)
   - DOC ID (text input)

2. **Continuous Monitoring**: After submitting the initial form, the bot:
   - Monitors for new messages from the case worker
   - Responds automatically based on the mode:
     - **LLM Mode**: Generates contextual responses using GPT-5-mini
     - **No-LLM Mode**: Always responds with "no"

3. **Logging**: Conversation logs are saved to the `logs/` directory in JSON Lines format

## Output Files

### Conversation Logs

Location: `logs/conversation_YYYY-MM-DDTHH-mm-ss.ljson`

Each session creates a log file with all messages in JSON Lines format:

```json
{"timestamp":"2025-12-09T16:30:00.000Z","type":"user_message","content":"What is your name?"}
{"timestamp":"2025-12-09T16:30:05.000Z","type":"ai_response","content":"no"}
```

## Puppet File Format

Create a text file where each line represents one puppet:

```
US_ID 123456
US_TN 789012
US_PA 345678
US_ND 456789
US_ME 987654
```

**Format**: `<STATE_CODE> <DOC_ID>`

- `STATE_CODE`: Two-letter state code with US_ prefix (e.g., US_ID, US_TN)
- `DOC_ID`: Department of Corrections ID number

Invalid lines will be skipped with an error message.

## LLM Mode Details

When running without the `--no-llm` flag, the bot:

- Uses OpenRouter's GPT-5-mini model
- Maintains conversation context (last 20 messages)
- Generates short, casual responses (1-2 sentences)
- Acts as a person with limited liberty having a casual conversation

## No-LLM Mode Details

When running with the `--no-llm` flag, the bot:

- Always responds with "no" to any question
- Doesn't require OpenRouter API key
- Useful for testing form flows and validation
- Faster and no API costs

## Troubleshooting

### Bot can't find the continue button
- Check that `BASE_URL` is correct
- Ensure the assessment page has loaded completely
- A debug screenshot will be saved as `debug-screenshot.png`

### Bot doesn't respond to questions
- Check the message selector (`.case-worker-message`)
- Verify the textarea placeholder (`Write a message`)
- Check console logs for specific errors

### Multiple puppets failing
- Reduce the number of concurrent puppets
- Increase the delay between puppet launches (currently 2 seconds)
- Check system resources (CPU, memory)

## Development

### Running in Headless Mode

Modify the config in code:

```typescript
const config: AssessmentConfig = {
  state: 'US_ID',
  docId: '123456',
  headless: true,  // Set to true for headless mode
  noLlm: false
};
```

### Adjusting Monitoring Interval

The bot checks for new messages every 15 seconds. To adjust:

```typescript
// In continuousMonitoring method
await new Promise((resolve) => setTimeout(resolve, 15000)); // Change 15000 to desired milliseconds
```

## License

Copyright (C) 2025 Recidiviz, Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
