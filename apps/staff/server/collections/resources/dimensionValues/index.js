const { stateCodes } = require("../../../constants/stateCodes");
const { US_MO_DIMENSION_VALUES } = require("./us_mo");
const { US_PA_DIMENSION_VALUES } = require("./us_pa");

module.exports = {
  [stateCodes.US_MO]: US_MO_DIMENSION_VALUES,
  [stateCodes.US_PA]: US_PA_DIMENSION_VALUES,
};
