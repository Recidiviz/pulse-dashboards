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
    "./src/features/**/*.{js,jsx,ts,tsx}",
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/shared/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: "#006C67",
        "on-brand": "#FFFFFF",
        primary: "#0D2B3A",
        secondary: "#526C78",
        tertiary: "#9AA9B1",
        attention: "#B42D2D",
        "attention-light": "#FFEAE5",
        "on-attention": "#FFFFFF",
        warning: "#A18100",
        success: "#006C67",
        "on-success": "#FFFFFF",
        "on-strong": "#FFFFFF",
        "on-strong-secondary": "#888D8D",
        disabled: "#9AA9B1",
        "on-disabled": "#FFFFFF",
        "scrim-default": "#00000066",
        hover: "#0000000A",
        active: "#00000014",
      },
      backgroundColor: {
        screen: "#F2F2F2",
        primary: "#FFFFFF",
        secondary: "#F7F8F8",
        brand: "#006C67",
        "brand-light": "#EEF8F4",
        "brand-light-secondary": "#EEF8F4",
        attention: "#B42D2D",
        "attention-light": "#FBF4F4",
        "attention-light-secondary": "#F4DCDC",
        "warning-light": "#FFF9D7",
        disabled: "#CACBCC",
        strong: "#1D2424",
      },
      borderColor: {
        brand: "#006C67",
        subtle: "#E1E5E7",
        attention: "#B42D2D",
      },
      boxShadow: {
        "focus-brand": "0px 0px 0px 2px #00665F33",
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
