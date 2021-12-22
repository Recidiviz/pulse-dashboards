const stateCodes = {
  US_MO: "US_MO",
  US_PA: "US_PA",
  US_ND: "US_ND",
  US_ID: "US_ID",
  US_TN: "US_TN",
  US_ME: "US_ME",
};

const lanternStateCodes = [stateCodes.US_MO, stateCodes.US_PA];

module.exports = {
  ...stateCodes,
  lanternStateCodes,
};
