// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

/**
 * NativeWind cssInterop configuration for third-party SVG components.
 *
 * SVG components don't natively support NativeWind's className → style
 * bridging. cssInterop patches the component class directly (rather than
 * returning a new wrapper), so registering a component here applies globally —
 * all usages throughout the app inherit the bridging automatically.
 *
 * This file must be imported before any SVG components are rendered.
 */

import { cssInterop } from "nativewind";
import { ComponentType } from "react";
import { Platform } from "react-native";
import { Svg } from "react-native-svg";

if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svgInteropConfig: any = {
    className: {
      target: "style",
      nativeStyleToProp: {
        width: true,
        height: true,
        size: true,
        stroke: true,
        fill: true,
        color: true,
        strokeWidth: true,
      },
    },
  };

  // For SVG files.
  cssInterop(Svg, svgInteropConfig);

  // Heroicon components are their own component class that wraps Svg internally,
  // so they need cssInterop registered separately.
  Promise.all([
    import("react-native-heroicons/outline"),
    import("react-native-heroicons/solid"),
  ]).then(([HeroiconsOutline, HeroiconsSolid]) => {
    [
      ...Object.values(HeroiconsOutline),
      ...Object.values(HeroiconsSolid),
    ].forEach((icon) => {
      cssInterop(icon as ComponentType, svgInteropConfig);
    });
  });
}
