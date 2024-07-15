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
    display_name: sqlify(config.label),
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
    denial_text: sqlify(config.denialButtonText),
    snooze: sqlify(deepMapKeys(config.snooze, snakeCase)),
    sidebar_components: sqlify(config.sidebarComponents, true),
    tab_groups: sqlify(config.tabOrder),
    compare_by: sqlify(
      config.compareBy
        ? config.compareBy.map((sp) => deepMapKeys(sp, snakeCase))
        : undefined,
    ),
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
