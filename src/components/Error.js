import React from "react";
import PropTypes from "prop-types";

import "./Error.scss";

import warningIcon from "../assets/static/images/warning.svg";

const Error = ({ text }) => (
  <div className="error">
    <img src={warningIcon} alt="Error icon" className="error_icon" />
    <p className="error_text">{text}</p>
  </div>
);

/* eslint-disable */
Error.defaultProps = {
  text: (
    <>
      Something went wrong while loading this chart. Check back later or contact
      {' '}<a href="mailto:feedback@recidiviz.org">feedback@recidiviz.org</a> for more information.
    </>
  ),
};
/* eslint-disable */

Error.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};

export default Error;
