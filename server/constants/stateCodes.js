const stateCodes = {
  US_CO: "US_CO",
  US_ID: "US_ID",
  US_ME: "US_ME",
  US_MI: "US_MI",
  US_MO: "US_MO",
  US_ND: "US_ND",
  US_PA: "US_PA",
  US_TN: "US_TN",
};

const lanternStateCodes = [stateCodes.US_MO, stateCodes.US_PA];

module.exports = {
  ...stateCodes,
  lanternStateCodes,
};
