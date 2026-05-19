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

import LanguageIcon from "@mui/icons-material/Language";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceIcon from "@mui/icons-material/Place";

import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { safeHttpUrl } from "~@reentry/frontend/utils/urlUtils";
import type { components } from "~@reentry/openapi-types";

import styles from "./styles/ResourceBankTile.module.css";

type Resource = components["schemas"]["Resource"];

const DISTANCE_WARNING_MILES = 50;

// Maps categories to chip + tile background classes (CSS vars defined in globals.css)
const CATEGORY_CLASSES: Record<string, { chip: string; tileBg: string }> = {
  Housing: { chip: styles["chipHousing"], tileBg: styles["tileHousing"] },
  Employment: {
    chip: styles["chipEmployment"],
    tileBg: styles["tileEmployment"],
  },
  "Employment and Career Support": {
    chip: styles["chipEmployment"],
    tileBg: styles["tileEmployment"],
  },
  "Basic Needs": {
    chip: styles["chipBasicNeeds"],
    tileBg: styles["tileBasicNeeds"],
  },
  "Physical Health": {
    chip: styles["chipHealth"],
    tileBg: styles["tileHealth"],
  },
  "Mental Health": { chip: styles["chipHealth"], tileBg: styles["tileHealth"] },
  "Substance Use": { chip: styles["chipHealth"], tileBg: styles["tileHealth"] },
  "Behavioral Health Services": {
    chip: styles["chipHealth"],
    tileBg: styles["tileHealth"],
  },
  "Medical and Health Services": {
    chip: styles["chipHealth"],
    tileBg: styles["tileHealth"],
  },
  Education: {
    chip: styles["chipEducation"],
    tileBg: styles["tileEducation"],
  },
  "Education & Vocational Training": {
    chip: styles["chipEducation"],
    tileBg: styles["tileEducation"],
  },
  "Legal Aid & Rights Restoration": {
    chip: styles["chipLegal"],
    tileBg: styles["tileLegal"],
  },
  "Family Reconnection & Parenting": {
    chip: styles["chipFamily"],
    tileBg: styles["tileFamily"],
  },
  "Peer Support & Community Integration": {
    chip: styles["chipPeer"],
    tileBg: styles["tilePeer"],
  },
};

const DEFAULT_CLASSES = {
  chip: styles["chipDefault"],
  tileBg: styles["tileDefault"],
};

type ResourceBankTileProps = {
  resource: Resource;
  clientFirstName: string;
  onRemove: (id: string, name: string) => void;
  planGenerationId?: string;
};

const ResourceBankTile = ({
  resource,
  clientFirstName,
  onRemove,
  planGenerationId,
}: ResourceBankTileProps) => {
  const { track } = useAnalytics();
  const { chip: chipClass, tileBg } =
    CATEGORY_CLASSES[resource.category] ?? DEFAULT_CLASSES;
  const chipLabel = resource.subcategory ?? resource.category;
  const isOnline = resource.resource_type === "DIGITAL";
  const travelDistanceMiles = (
    resource as Resource & { travel_distance_miles?: number }
  ).travel_distance_miles;
  const websiteHref = safeHttpUrl(resource.website);
  return (
    <div className={`${styles["tile"]} ${tileBg}`}>
      <div className={styles["header"]}>
        <div className={styles["titleArea"]}>
          <span className={styles["name"]}>{resource.name}</span>
          <span className={`${styles["categoryChip"]} ${chipClass}`}>
            {chipLabel}
          </span>
        </div>
        <div className={styles["headerRight"]}>
          {isOnline && (
            <span className={`${styles["onlineBadge"]} ${chipClass}`}>
              + Digital
            </span>
          )}
          <button
            className={styles["removeButton"]}
            onClick={() => onRemove(resource.id, resource.name)}
            aria-label={`Remove ${resource.name}`}
            type="button"
          >
            ×
          </button>
        </div>
      </div>

      {resource.blurb && <p className={styles["blurb"]}>{resource.blurb}</p>}

      <div className={isOnline ? styles["onlineMetaGrid"] : styles["metaGrid"]}>
        {resource.address && (
          <span className={styles["metaRow"]}>
            <LocationOnIcon className={styles["metaIcon"]} />
            <span className={styles["metaText"]}>{resource.address}</span>
          </span>
        )}
        {websiteHref && (
          <a
            className={styles["metaLink"]}
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("resource_link_clicked", {
                resourceId: resource.id,
                resourceType: resource.resource_type,
                planGenerationId,
              })
            }
          >
            <LanguageIcon className={styles["metaIcon"]} />
            <span className={styles["metaText"]}>{websiteHref}</span>
          </a>
        )}

        {travelDistanceMiles &&
          (travelDistanceMiles > DISTANCE_WARNING_MILES ? (
            <span className={styles["distanceWrapper"]}>
              <span className={styles["distanceWarning"]}>
                <PlaceIcon className={styles["metaIcon"]} />
                {travelDistanceMiles} mi away
              </span>
              <span className={styles["tooltipText"]}>
                This resource exceeds 50 miles from {clientFirstName}&apos;s
                home address.
              </span>
            </span>
          ) : (
            <span className={styles["metaRow"]}>
              <PlaceIcon className={styles["metaIcon"]} />
              <span className={styles["metaText"]}>
                {travelDistanceMiles} mi away
              </span>
            </span>
          ))}
        {resource.phone && (
          <span className={styles["metaRow"]}>
            <PhoneIcon className={styles["metaIcon"]} />
            <span className={styles["metaText"]}>{resource.phone}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default ResourceBankTile;
