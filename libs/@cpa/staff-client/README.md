# Case Planning Assistant - Staff Frontend

This library contains the client-side components for the Case Planning Assistant (CPA),
used by the `staff` application and communicating with the `@cpa` backend services.

## About the CPA Platform

The CPA supports reentry planning for justice-impacted individuals by gathering information through natural language conversations, synthesizing that information, and generating structured outputs—including intake summaries and step-by-step action plans with community resource recommendations—to help address identified needs and support safe community reintegration.

The platform currently supports two input types:

- **Intake Chatbot**: Uses configurable 'Intake Requirements' as a guide for conducting a chat-based interview that collects specific information and asks relevant follow-up questions.
- **Recording/Transcription/Diarization Tool**: Records live conversations and prepares diarized transcripts (identifying who spoke when and attributing words to speakers in the transcript).

The platform generates two output types:

- **Intake Summary**: Provides an at-a-glance summary of an individual's background/situation across key domains, plus an assessment of priority and long-term needs.
- **Action Plan**: Provides a long-form plan to address identified needs, including resource matching — recommending geographically proximate community resources relevant to those needs. The input side includes a "Home Address" form for entering a tentative post-release address to match resources against.

## Structure

- `App.tsx` — Application entry point and routing configuration
- `@types/` — Global TypeScript type definitions
- `core/` — Core functionality including:
  - `query/` — React Query configuration and utilities
  - `utils/routing.ts` — Route definitions and navigation
  - `store/` — Global state management
  - `trpc/` — tRPC client configuration
- `features/` — Self-contained feature modules (e.g., `ClientList`, `ClientProfile`, `Recorder`)
- `pages/` — Page components that compose features and are rendered at routes

## Running lint and unit tests

Run `nx lint @cpa/staff-client` to execute linting.

Run `nx test @cpa/staff-client` to execute the unit tests via [Vitest](https://vitest.dev/).
