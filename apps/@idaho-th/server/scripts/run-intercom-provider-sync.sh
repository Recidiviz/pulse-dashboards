#!/bin/sh
# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# Cloud Run Job command for the one-off Intercom provider contact sync.
set -e

# dumb-init is already installed in this image and used by the server's own
# Dockerfile CMD; exec makes it PID 1 here too, so it forwards SIGTERM to node
# instead of the signal landing on an sh that doesn't.
exec dumb-init node --import=extensionless/register --import ./sentry/index.js jobs/intercom-provider-sync.js
