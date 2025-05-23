// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import "./DetailsGroup.scss";

import { Icon, IconSVG } from "@recidiviz/design-system";
import cn from "classnames";
import React, { useRef, useState } from "react";
import useOnClickOutside from "use-onclickoutside";

type Props = {
  expand?: boolean;
  children?: React.ReactNode;
};

const DetailsGroup: React.FC<Props> = ({ expand, children }) => {
  const [open, setOpen] = useState(false);
  const ref: any = useRef();
  useOnClickOutside(ref, () => setOpen(false));

  if (expand) {
    return <div className="DetailsGroup">{children}</div>;
  }

  return (
    <div className="DetailsGroup" ref={ref}>
      <Icon
        kind={IconSVG.TripleDot}
        width={16}
        height={16}
        className="DetailsGroup__menu"
        onClick={() => setOpen(!open)}
      />
      <div
        className={cn("DetailsGroup__content", {
          "DetailsGroup__content--visible": open,
        })}
      >
        {children}
      </div>
    </div>
  );
};

export default DetailsGroup;
