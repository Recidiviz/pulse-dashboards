// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { useEffect, useState } from "react";

import cssVars from "../core/CoreConstants.module.scss";

const breakpoints = {
  desktop: Number(cssVars.breakpointSm.replace(/\D/g, "")),
  laptop: Number(cssVars.breakpointSxs.replace(/\D/g, "")),
  tablet: Number(cssVars.breakpointXs.replace(/\D/g, "")),
  mobile: Number(cssVars.breakpointXxs.replace(/\D/g, "")),
};

const useIsMobile = (moreBreakpoints?: boolean): any => {
  const breakpointLaptop = breakpoints.laptop;
  const breakpointTablet = breakpoints.tablet;
  const breakpointMobile = moreBreakpoints
    ? breakpoints.mobile
    : breakpoints.desktop;

  const [isLaptop, setIsLaptop] = useState(
    window.innerWidth <= breakpointLaptop
  );
  const [isTablet, setIsTablet] = useState(
    window.innerWidth <= breakpointTablet
  );
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= breakpointMobile
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpointMobile);
      setIsTablet(window.innerWidth <= breakpointTablet);
      setIsLaptop(window.innerWidth <= breakpointLaptop);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [breakpointMobile, breakpointTablet, breakpointLaptop]);

  if (moreBreakpoints) return { isMobile, isTablet, isLaptop };

  return isMobile;
};

export default useIsMobile;
