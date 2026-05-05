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

import FileSvg from "~@meetings/app/shared/assets/icons/file.svg";
import FileAacSvg from "~@meetings/app/shared/assets/icons/file-aac.svg";
import FileM4aSvg from "~@meetings/app/shared/assets/icons/file-m4a.svg";
import FileMp3Svg from "~@meetings/app/shared/assets/icons/file-mp3.svg";
import FileWavSvg from "~@meetings/app/shared/assets/icons/file-wav.svg";
import FileWebmSvg from "~@meetings/app/shared/assets/icons/file-webm.svg";

const iconsMap = {
  aac: FileAacSvg,
  m4a: FileM4aSvg,
  mp3: FileMp3Svg,
  wav: FileWavSvg,
  webm: FileWebmSvg,
};

type Props = {
  extension: keyof typeof iconsMap | string;
};

export function FileIcon({ extension }: Props) {
  const Icon = iconsMap[extension as keyof typeof iconsMap] ?? FileSvg;
  return <Icon />;
}
