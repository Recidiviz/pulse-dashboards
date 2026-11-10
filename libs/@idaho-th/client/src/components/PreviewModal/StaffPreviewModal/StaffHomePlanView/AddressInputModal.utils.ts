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

// Common US street/unit/directional words mapped to the abbreviation Google
// Places tends to return. Folding both sides through this lets "123 Main Street"
// still count as a prefix of "123 Main St, Boise, ID".
const US_ADDRESS_ABBREVIATIONS: Record<string, string> = {
  street: "st",
  avenue: "ave",
  road: "rd",
  boulevard: "blvd",
  drive: "dr",
  lane: "ln",
  court: "ct",
  place: "pl",
  terrace: "ter",
  circle: "cir",
  highway: "hwy",
  parkway: "pkwy",
  suite: "ste",
  apartment: "apt",
  building: "bldg",
  floor: "fl",
  room: "rm",
  north: "n",
  south: "s",
  east: "e",
  west: "w",
  northeast: "ne",
  northwest: "nw",
  southeast: "se",
  southwest: "sw",
};

/**
 * Lowercase, drop punctuation, and normalize a token to its abbreviation.
 * Only periods and commas are stripped — hyphens (e.g. "Wilkes-Barre"),
 * hashes ("#3"), and parentheses are kept intentionally so they participate
 * in the prefix match rather than being silently discarded.
 */
const fold = (token: string): string => {
  const clean = token.replace(/[.,]/g, "").toLowerCase();
  return US_ADDRESS_ABBREVIATIONS[clean] ?? clean;
};

/**
 * Given what the user has typed and the first prediction's full address, returns
 * the greyed-out completion to show after the caret — or "" when the prediction
 * is not a prefix of the typed text (VS Code-style inline completion).
 *
 * Every token before the one being typed must match exactly (abbreviations
 * folded); the token in progress must be a prefix of the prediction's token, or
 * a fully-typed synonym of it (e.g. "street" vs "St").
 */
export const computeGhostSuffix = (
  typed: string,
  prediction: string,
): string => {
  const typedTokens = typed.trim().split(/\s+/).filter(Boolean);
  const predTokens = prediction.trim().split(/\s+/).filter(Boolean);

  if (typedTokens.length === 0 || typedTokens.length > predTokens.length) {
    return "";
  }

  const lastIndex = typedTokens.length - 1;

  for (let i = 0; i < lastIndex; i += 1) {
    if (fold(typedTokens[i]) !== fold(predTokens[i])) return "";
  }

  const typedLast = typedTokens[lastIndex];
  const predLast = predTokens[lastIndex];
  const rest = predTokens.slice(lastIndex + 1).join(" ");

  let completion: string;
  if (predLast.toLowerCase().startsWith(typedLast.toLowerCase())) {
    // Mid-word: complete this token using the prediction's own spelling.
    completion = predLast.slice(typedLast.length);
  } else if (fold(typedLast) === fold(predLast)) {
    // Token finished, spelled differently (e.g. typed "Street", got "St").
    completion = "";
  } else {
    return "";
  }

  return rest ? `${completion} ${rest}` : completion;
};
