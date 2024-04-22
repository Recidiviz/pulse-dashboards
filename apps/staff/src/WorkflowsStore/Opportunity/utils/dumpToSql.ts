import { unzip } from "lodash";

import {
  OPPORTUNITY_CONFIGS_BY_STATE,
  OpportunityConfig,
} from "../OpportunityConfigs";

type Fields = Record<string, string>;

const updated_by = "Initial Import";

function sqlstring(raw: string): string {
  return `'${raw.replaceAll("'", "''")}'`;
}

function sqlify(raw?: any): string {
  if (raw === null || raw === undefined) {
    return "NULL";
  } else if (typeof raw === "boolean") {
    return raw ? "TRUE" : "FALSE";
  } else if (typeof raw === "string") {
    return sqlstring(raw);
  } else if (Array.isArray(raw)) {
    return `ARRAY [${raw.map(sqlify).join(", ")}]`;
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
    initial_header: sqlify(config.initialHeader ?? ""),
    dynamic_eligibility_text: sqlify(config.dynamicEligibilityText),
    call_to_action: sqlify(config.callToAction),
    denial_text: sqlify(config.denialButtonText),
    snooze: sqlify(config.snooze),
    denial_reasons: sqlify(config.denialReasons),
    eligible_criteria_copy: sqlify(config.eligibleCriteriaCopy ?? {}),
    ineligible_criteria_copy: sqlify(config.ineligibleCriteriaCopy ?? {}),
    sidebar_components: sqlify(config.sidebarComponents),
  };
}

export function dumpToSql(): string {
  const statements: string[] = [];

  Object.entries(OPPORTUNITY_CONFIGS_BY_STATE).forEach(
    ([state_code, configs]) => {
      statements.push(`\\c ${state_code.toLowerCase()}`);
      Object.entries(configs).forEach(([opportunity_type, config]) => {
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
          `DELETE FROM opportunity_configuration WHERE state_code=${sqlify(state_code)} AND opportunity_type=${sqlify(opportunity_type)} AND created_by=${sqlify(updated_by)};`,
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
