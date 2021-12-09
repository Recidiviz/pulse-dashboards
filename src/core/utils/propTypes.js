import PropTypes from "prop-types";

import { METRIC_MODES } from "./constants";

export const metricModePropType = PropTypes.oneOf([
  METRIC_MODES.RATES,
  METRIC_MODES.COUNTS,
]);

export const officeDataPropTypes = PropTypes.shape({
  district: PropTypes.number,
  lat: PropTypes.number,
  long: PropTypes.number,
  site_name: PropTypes.string,
  state_code: PropTypes.string,
  title_side: PropTypes.string,
});
