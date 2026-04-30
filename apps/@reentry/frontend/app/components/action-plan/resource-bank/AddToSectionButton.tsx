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

"use client";

import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { MdMoreVert } from "react-icons/md";

import { ResourceWithMeta } from "~@reentry/frontend/hooks/resourceBank.types";

import { SectionTitle } from "../types";
import styles from "./styles/AddToSectionButton.module.css";

interface AddToSectionButtonProps {
  resource: ResourceWithMeta;
  sectionTitles: SectionTitle[];
  addResource: (sectionTitle: string, resource: ResourceWithMeta) => void;
}

const AddToSectionButton = ({
  resource,
  sectionTitles,
  addResource,
}: AddToSectionButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSelect = (sectionTitle: string) => {
    addResource(sectionTitle, resource);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        aria-label="Add to section"
        aria-controls={open ? `add-to-section-menu-${resource.id}` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        className={styles["iconButton"]}
      >
        <MdMoreVert size={18} />
      </IconButton>
      <Menu
        id={`add-to-section-menu-${resource.id}`}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {sectionTitles.length === 0 ? (
          <MenuItem disabled> No Sections Available </MenuItem>
        ) : (
          [...sectionTitles]
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((section) => (
              <MenuItem
                key={section.title}
                onClick={() => handleSelect(section.title)}
                className={styles["menuItem"]}
              >
                Add to {section.title}
              </MenuItem>
            ))
        )}
      </Menu>
    </>
  );
};

export default AddToSectionButton;
