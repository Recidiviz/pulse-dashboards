CPA
---
This app is composed of a python backend server and a nextjs frontend. Together they serve a web application that achieve a few main functionalities
- It is accessible to authorized staff of states who restered for CPA use.
- They have access to their list of assigned clients.
- They can setup either bot assessments or record their live assessments.
- The assessment transcripts are llm-summarized and used a base for generating action plans with resources from the resources API.

# Architecture

## Backend
- uv for python package management
- Fastapi server
- posgres database
- alembic migrations
- SqlModel ORM (based on sqlalchemy)
- Redis for caching, communication btwn servers and workers
- TaskIq for long running tasks management

See setup and more information in [apps/@reentry/backend/README.md](apps/@reentry/backend/README.md)

## Frontend
- nextjs app

See setup and more information in [apps/@reentry/frontend/README.md](apps/@reentry/frontend/README.md)

## Authentication
Authentication of staff is done through Auth0.


[apps/@reentry/backend/app/auth](apps/@reentry/backend/app/auth)

[apps/@reentry/frontend/README.md](apps/@reentry/frontend/README.md)

Advanced : Script for managing auth0 properties through CLI at [tools/auth0](tools/auth0)

## Staff and clients provisionning
The tables are fetched live from BigQuery and cached in Redis. 

[apps/@reentry/backend/app/services/client_data](apps/@reentry/backend/app/services/client_data)

## Shared frontend
The part of the app that allows justice impacted persons to answer the bot's questions is served through the nextjs app in /frontend and through the JII app.

[libs/@reentry/frontend-shared](libs/@reentry/frontend-shared)

## Configuration
The llm functionalities that describe both the assessment and how it is transformed into outputs are highly configurable. [apps/@reentry/backend/app/core/data_config/README.md](apps/@reentry/backend/app/core/data_config/README.md)

The functionalities of the app can be enabled and disabled through feature flags.


## intake-bot
[apps/@reentry/intake-bot/README.md](apps/@reentry/intake-bot/README.md)
This is a tool for automated testing through browser instrumentalization, slightly outdated but can be of use.

# Setup
Follow the repository installation instructions in [/README.md](/README.md), then [apps/@reentry/frontend/README.md](apps/@reentry/frontend/README.md) and [apps/@reentry/backend/README.md](apps/@reentry/backend/README.md)


## Sentry Error Tracking Configuration

Both the backend and frontend support Sentry error tracking. To enable it set the environment variables

# Usage
This project can be deployed with `nx deploy`, whith the adequate permissions.

## CI
Both front-end and back-end have automated tests and checks through github.

[Advanced] You can use apps/@reentry/scripts/README.md to manage secrets.
