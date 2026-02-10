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

declare module "react-simple-code-editor" {
  import { ComponentType, CSSProperties, TextareaHTMLAttributes } from "react";

  export interface EditorProps
    extends Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      "onChange" | "value"
    > {
    value: string;
    onValueChange: (value: string) => void;
    highlight: (value: string) => string | React.ReactNode;
    tabSize?: number;
    insertSpaces?: boolean;
    ignoreTabKey?: boolean;
    padding?:
      | number
      | { top?: number; right?: number; bottom?: number; left?: number };
    style?: CSSProperties;
    textareaId?: string;
    textareaClassName?: string;
    preClassName?: string;
  }

  const Editor: ComponentType<EditorProps>;
  export default Editor;
}
