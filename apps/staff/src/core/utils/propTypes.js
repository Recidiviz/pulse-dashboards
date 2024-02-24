import PropTypes from "prop-types";

import { METRIC_MODES } from "./constants";

export const metricModePropType = PropTypes.oneOf([
  METRIC_MODES.RATES,
  METRIC_MODES.COUNTS,
]);
