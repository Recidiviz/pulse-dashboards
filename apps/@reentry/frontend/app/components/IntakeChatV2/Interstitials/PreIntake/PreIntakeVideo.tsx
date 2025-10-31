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

import React, { useRef, useState } from "react";

import styles from "./PreIntakeVideo.module.css";

interface PreIntakeVideoProps {
  onGoBack: () => void;
  onStartIntake: () => void;
}

const COPY_PARAGRAPH = `
This intake is designed to help your case manager and parole officer
learn more about your reentry goals, plans, and needs. This helps
them understand the best ways to support you as you transition back
into the community.
`;

const PreIntakeVideo: React.FC<PreIntakeVideoProps> = ({
  onGoBack,
  onStartIntake,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [hasWatchedFullVideo, setHasWatchedFullVideo] = useState(false);

  const isDisabled = !isChecked || !hasWatchedFullVideo;

  return (
    <div className={styles["container"]}>
      <div className={styles["wrapper"]}>
        <div className={styles["card"]}>
          <div>
            <h1 className={styles["title"]}>Your Intake</h1>
          </div>

          <div className={styles["content"]}>
            <div className={styles["description"]}>
              <p>{COPY_PARAGRAPH}</p>
            </div>

            {/* Video */}
            <div className={styles["videoWrapper"]}>
              <video
                ref={videoRef}
                className={styles["video"]}
                width="320"
                height="240"
                controls
                controlsList="noplaybackrate noremoteplayback nodownload nopictureinpicture noseekbar"
                onEnded={() => setHasWatchedFullVideo(true)}
              >
                <source src="/videos/intake-video.mp4" type="video/mp4" />
                <track
                  src="/videos/intake-subtitles.vtt"
                  kind="subtitles"
                  srcLang="en"
                  label="English"
                  default
                />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Checkbox */}
            <div className={styles["checkboxContainer"]}>
              <div className={styles["checkboxWrapper"]}>
                <input
                  id="understanding-checkbox"
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className={styles["checkbox"]}
                />
              </div>
              <label
                htmlFor="understanding-checkbox"
                className={styles["checkboxLabel"]}
              >
                I understand that my case manager, my parole officer, and other
                staff working with my case will be able to see the information I
                share.
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className={styles["buttonContainer"]}>
            <button
              type="button"
              onClick={onGoBack}
              className={`${styles["buttonCommon"]} ${styles["goBack"]}`}
            >
              Go Back
            </button>

            <div className={styles["startIntakeContainer"]}>
              <button
                type="button"
                onClick={onStartIntake}
                disabled={isDisabled}
                className={`${styles["buttonCommon"]} ${styles["startIntake"]}`}
              >
                Start Intake
              </button>
              {isDisabled && (
                <div className={styles["tooltip"]}>
                  Please watch the full video and check the box to continue
                  <div className={styles["tooltipArrow"]} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreIntakeVideo;
