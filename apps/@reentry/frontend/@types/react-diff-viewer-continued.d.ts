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

declare module "react-diff-viewer-continued" {
  import { ComponentType, ReactNode } from "react";

  export enum DiffMethod {
    CHARS = "diffChars",
    WORDS = "diffWords",
    WORDS_WITH_SPACE = "diffWordsWithSpace",
    LINES = "diffLines",
    TRIMMED_LINES = "diffTrimmedLines",
    SENTENCES = "diffSentences",
    CSS = "diffCss",
  }

  export interface ReactDiffViewerProps {
    oldValue: string;
    newValue: string;
    splitView?: boolean;
    disableWordDiff?: boolean;
    compareMethod?: DiffMethod;
    extraLinesSurroundingDiff?: number;
    hideLineNumbers?: boolean;
    showDiffOnly?: boolean;
    renderContent?: (source: string) => ReactNode;
    codeFoldMessageRenderer?: (
      totalFoldedLines: number,
      leftStartLineNumber: number,
      rightStartLineNumber: number
    ) => ReactNode;
    onLineNumberClick?: (
      lineId: string,
      event: React.MouseEvent<HTMLTableCellElement>
    ) => void;
    highlightLines?: string[];
    styles?: Record<string, unknown>;
    useDarkTheme?: boolean;
    leftTitle?: string | ReactNode;
    rightTitle?: string | ReactNode;
    linesOffset?: number;
  }

  const ReactDiffViewer: ComponentType<ReactDiffViewerProps>;
  export default ReactDiffViewer;
}
