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

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getOptionalIntercomTemplateDir } from "~@idaho-th/trpc/intercom/intercom.config";
import {
  DIGEST_DASHBOARD_URL_PLACEHOLDER,
  DIGEST_EMAIL_SUBJECT,
  DIGEST_TEMPLATE_FILENAME,
  INTERCOM_ENV,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import type { DigestEmailContent } from "~@idaho-th/trpc/intercom/intercom.types";
import { getOptionalEnv } from "~@idaho-th/trpc/routes/common/env";
import { IDAHO_TH_DASHBOARD_HOST } from "~@idaho-th/trpc/routes/common/hosts";

let cachedTemplateHtml: string | undefined;

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function resolveDigestTemplatePath(): string {
  const fromEnv = getOptionalIntercomTemplateDir();
  if (fromEnv) {
    return join(fromEnv, DIGEST_TEMPLATE_FILENAME);
  }

  const cwd = process.cwd();
  const candidates = [
    // Production / container: asset copied next to the server cwd.
    join(cwd, "intercom", "templates", DIGEST_TEMPLATE_FILENAME),
    // Dev when cwd is the monorepo root.
    join(
      cwd,
      "apps",
      "@idaho-th",
      "intercom",
      "templates",
      DIGEST_TEMPLATE_FILENAME,
    ),
    // Dev when cwd is apps/@idaho-th/server.
    join(cwd, "..", "intercom", "templates", DIGEST_TEMPLATE_FILENAME),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Digest email template not found (${DIGEST_TEMPLATE_FILENAME}). ` +
      `Set ${INTERCOM_ENV.TEMPLATE_DIR} or ensure apps/@idaho-th/intercom/templates is present.`,
  );
}

function loadDigestTemplateHtml(): string {
  if (cachedTemplateHtml !== undefined) {
    return cachedTemplateHtml;
  }
  cachedTemplateHtml = readFileSync(resolveDigestTemplatePath(), "utf8");
  return cachedTemplateHtml;
}

const DASHBOARD_HOST_BY_APP_ENV: Readonly<Record<string, string | undefined>> =
  IDAHO_TH_DASHBOARD_HOST;

export function resolveDashboardUrl(): string {
  const appEnv = getOptionalEnv("APP_ENV");
  const url = appEnv ? DASHBOARD_HOST_BY_APP_ENV[appEnv] : undefined;

  if (!url) {
    throw new Error(
      `Cannot resolve the digest dashboard URL: APP_ENV must be one of ` +
        `${Object.keys(IDAHO_TH_DASHBOARD_HOST).join(", ")} (got ${appEnv ? `"${appEnv}"` : "unset"}).`,
    );
  }
  return url;
}

export function buildDigestEmailContent(
  dashboardUrl: string = resolveDashboardUrl(),
): DigestEmailContent {
  const href = escapeHtmlAttribute(dashboardUrl);
  const template = loadDigestTemplateHtml();

  if (!template.includes(DIGEST_DASHBOARD_URL_PLACEHOLDER)) {
    throw new Error(
      `Digest email template is missing placeholder ${DIGEST_DASHBOARD_URL_PLACEHOLDER}`,
    );
  }

  return {
    subject: DIGEST_EMAIL_SUBJECT,
    htmlBody: template.replaceAll(DIGEST_DASHBOARD_URL_PLACEHOLDER, href),
  };
}
