// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./src/App.tsx",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#003331",
      },
      fontFamily: {
        "libre-baskerville": ["LibreBaskerville-Bold", "serif"],
        inter: ["Inter", "sans-serif"],
      },
      keyframes: {
        "linear-progress-1": {
          "0%": { transform: "translateX(-50%) scaleX(1)" },
          "100%": { transform: "translateX(175%) scaleX(0.25)" },
        },
        "linear-progress-2": {
          "0%": { transform: "translateX(-200%) scaleX(1)" },
          "100%": { transform: "translateX(214%) scaleX(0.05)" },
        },
      },
      animation: {
        "linear-progress-1":
          "linear-progress-1 2.5s cubic-bezier(0.65,0.815,0.735,0.395) infinite",
        "linear-progress-2":
          "linear-progress-2 2.5s cubic-bezier(0.165,0.84,0.44,1) 2s infinite",
      },
    },
  },
  plugins: [],
};
