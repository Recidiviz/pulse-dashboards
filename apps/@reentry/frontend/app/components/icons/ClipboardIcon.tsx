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

export function ClipboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <mask
        id="mask0_222_1198"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="16"
        height="16"
      >
        <rect width="16" height="16" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_222_1198)">
        <path
          d="M6 12.0007C5.63333 12.0007 5.31944 11.8701 5.05833 11.609C4.79722 11.3479 4.66667 11.034 4.66667 10.6673V2.66732C4.66667 2.30065 4.79722 1.98676 5.05833 1.72565C5.31944 1.46454 5.63333 1.33398 6 1.33398H12C12.3667 1.33398 12.6806 1.46454 12.9417 1.72565C13.2028 1.98676 13.3333 2.30065 13.3333 2.66732V10.6673C13.3333 11.034 13.2028 11.3479 12.9417 11.609C12.6806 11.8701 12.3667 12.0007 12 12.0007H6ZM6 10.6673H12V2.66732H6V10.6673ZM3.33333 14.6673C2.96667 14.6673 2.65278 14.5368 2.39167 14.2757C2.13056 14.0145 2 13.7007 2 13.334V4.00065H3.33333V13.334H10.6667V14.6673H3.33333Z"
          fill="#2B5469"
          fillOpacity="0.6"
        />
      </g>
    </svg>
  );
}
