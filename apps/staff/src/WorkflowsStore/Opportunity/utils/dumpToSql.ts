// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { isObject, snakeCase, unzip } from "lodash";

import {
  OPPORTUNITY_CONFIGS_BY_STATE,
  OpportunityConfig,
} from "../OpportunityConfigs";

type Fields = Record<string, string>;

const updated_by = "Initial Import";

const deepMapKeys = (raw: object | undefined, f: (k: string) => string): any =>
  raw &&
  Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [
      f(k),
      isObject(v) ? deepMapKeys(v, f) : v,
    ]),
  );

function sqlstring(raw: string): string {
  return `'${raw.replaceAll("'", "''")}'`;
}

function sqlify(raw?: any, nativeArrays = false): string {
  if (raw === null || raw === undefined) {
    return "NULL";
  } else if (typeof raw === "boolean") {
    return raw ? "TRUE" : "FALSE";
  } else if (typeof raw === "string") {
    return sqlstring(raw);
  } else if (Array.isArray(raw) && nativeArrays) {
    return `ARRAY [${raw.map((r) => sqlify(r)).join(", ")}]`;
  }
  return sqlstring(JSON.stringify(raw));
}

function formatInsertStatement(table: string, fields: Fields): string {
  const [fnames, fvalues] = unzip(Object.entries(fields));
  return `INSERT INTO ${table} (${fnames.join(", ")}) VALUES (${fvalues.join(", ")});`;
}

function buildOpportunityFields(
  opportunity_type: string,
  config: OpportunityConfig<any>,
): Fields {
  return {
    state_code: sqlify(config.stateCode),
    opportunity_type: sqlify(opportunity_type),
    updated_by: sqlify(updated_by),
    gating_feature_variant: sqlify(config.featureVariant),
    homepage_position: sqlify(config.homepagePosition),
    updated_at: "CURRENT_TIMESTAMP",
  };
}

function buildOpportunityConfigFields(
  opportunity_type: string,
  config: OpportunityConfig<any>,
): Fields {
  return {
    state_code: sqlify(config.stateCode),
    opportunity_type: sqlify(opportunity_type),
    created_by: sqlify(updated_by),
    created_at: "CURRENT_TIMESTAMP",
    description: sqlify("Imported from pulse-dashboards"),
    status: sqlify("ACTIVE"),
    display_name: sqlify(config.newPolicyCopyLabel ?? config.label),
    methodology_url: sqlify(config.methodologyUrl),
    is_alert: sqlify(!!config.isAlert),
    initial_header: sqlify(config.initialHeader),
    denial_reasons: sqlify(config.denialReasons),
    eligible_criteria_copy: sqlify(config.eligibleCriteriaCopy ?? {}),
    ineligible_criteria_copy: sqlify(config.ineligibleCriteriaCopy ?? {}),
    dynamic_eligibility_text: sqlify(config.dynamicEligibilityText),
    eligibility_date_text: sqlify(config.eligibilityDateText),
    hide_denial_revert: sqlify(!!config.hideDenialRevert),
    tooltip_eligibility_text: sqlify(config.tooltipEligibilityText),
    call_to_action: sqlify(config.callToAction),
    subheading: sqlify(config.subheading),
    denial_text: sqlify(config.denialButtonText),
    snooze: sqlify(deepMapKeys(config.snooze, snakeCase)),
    sidebar_components: sqlify(config.sidebarComponents, true),
    tab_groups: sqlify(config.tabOrder),
    compare_by: sqlify(
      config.compareBy
        ? config.compareBy.map((sp) => deepMapKeys(sp, snakeCase))
        : undefined,
    ),
    notifications: sqlify(config.notifications ?? []),
  };
}

export function dumpToSql(): string {
  const statements: string[] = [];

  Object.entries(OPPORTUNITY_CONFIGS_BY_STATE).forEach(
    ([state_code, configs]) => {
      statements.push(`\\c ${state_code.toLowerCase()}`);
      Object.entries(configs).forEach(([opportunity_type, config]) => {
        statements.push(
          `DELETE FROM opportunity_configuration WHERE state_code=${sqlify(state_code)} AND opportunity_type=${sqlify(opportunity_type)} AND created_by=${sqlify(updated_by)};`,
        );
        statements.push(
          `DELETE FROM opportunity WHERE state_code=${sqlify(state_code)} AND opportunity_type=${sqlify(opportunity_type)} AND updated_by=${sqlify(updated_by)};`,
        );
        statements.push(
          formatInsertStatement(
            "opportunity",
            buildOpportunityFields(opportunity_type, config),
          ),
        );
        statements.push(
          formatInsertStatement(
            "opportunity_configuration",
            buildOpportunityConfigFields(opportunity_type, config),
          ),
        );
      });
    },
  );

  return statements.join("\n");
}
