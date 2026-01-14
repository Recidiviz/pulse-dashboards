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

import has from "lodash/has";
import type { Level } from "pino";
import pino from "pino";

/**
 * Structured logging for Google Cloud
 * Outputs JSON logs that are automatically parsed by Cloud Logging
 */

export const ENV_TO_LOGGER = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
};

export interface LogEntry {
  severity: Level;
  message: string;
  component?: string;
  [key: string]: unknown;
}

type LogMetadata = Record<string, unknown>;

class Logger {
  private defaultComponent?: string;
  private defaultMetadata: LogMetadata;
  private logger;

  constructor(component?: string, defaultMetadata?: LogMetadata) {
    this.defaultComponent = component;
    this.defaultMetadata = defaultMetadata || {};
    const env = process.env["NODE_ENV"] || "development";
    let logger;
    if (has(ENV_TO_LOGGER, env)) {
      logger = ENV_TO_LOGGER[env as keyof typeof ENV_TO_LOGGER];
    } else {
      logger = {};
    }

    this.logger = pino(logger);
  }

  private log(entry: LogEntry): void {
    // Google Cloud Logging automatically parses JSON logs
    // See: https://cloud.google.com/logging/docs/structured-logging
    const logObject = {
      component: entry.component || this.defaultComponent,
      timestamp: new Date().toISOString(),
      ...this.defaultMetadata,
      ...entry,
      severity: entry.severity.toUpperCase(),
    };

    // Remove duplicate keys
    delete logObject.component;
    this.logger[entry.severity](logObject);
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log({
      severity: "debug",
      message,
      component: this.defaultComponent,
      ...metadata,
    });
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log({
      severity: "info",
      message,
      component: this.defaultComponent,
      ...metadata,
    });
  }

  warning(message: string, metadata?: LogMetadata): void {
    this.log({
      severity: "warn",
      message,
      component: this.defaultComponent,
      ...metadata,
    });
  }

  error(message: string, metadata?: LogMetadata): void {
    this.log({
      severity: "error",
      message,
      component: this.defaultComponent,
      ...metadata,
    });
  }

  fatal(message: string, metadata?: LogMetadata): void {
    this.log({
      severity: "fatal",
      message,
      component: this.defaultComponent,
      ...metadata,
    });
  }
}

export function createLogger(
  component: string,
  defaultMetadata?: LogMetadata,
): Logger {
  return new Logger(component, defaultMetadata);
}

export const logger = new Logger();
