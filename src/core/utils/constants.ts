export const METRIC_TYPES = {
  COUNTS: "counts",
  RATES: "rates",
};

export const FILTER_TYPES = {
  TIME_PERIOD: "timePeriod",
  GENDER: "gender",
  LEGAL_STATUS: "legalStatus",
  SUPERVISION_TYPE: "supervisionType",
  AGE_GROUP: "ageGroup",
  FACILITY: "facility",
  DISTRICT: "district",
  MOST_SEVERE_VIOLATION: "mostSevereViolation",
  NUMBER_OF_VIOLATIONS: "numberOfViolations",
} as const;
