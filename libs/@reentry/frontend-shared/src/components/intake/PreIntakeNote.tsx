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

"use client";

import { useRef, useState } from "react";

import type {
  IntakeTenantConfig,
  TextVideoIntakeConfig,
  VideoIntakeConfig,
} from "../../configs/types";

interface PreIntakeNoteOneProps {
  onContinue: () => void;
  tenantConfig: IntakeTenantConfig;
}

const PreIntakeNoteOne: React.FC<PreIntakeNoteOneProps> = ({
  onContinue,
  tenantConfig,
}) => {
  const { title, paragraphs } = tenantConfig.noteOneCopy;

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-[2vh]">
      <div className="w-full max-w-3xl md:max-w-[714px]">
        <div className="bg-white shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] rounded-lg w-full md:max-w-[714px] h-[684px] px-6 md:px-[48px] pt-[56px] pb-[40px] flex flex-col justify-between">
          <div>
            <h1 className="font-['Libre_Baskerville'] font-normal text-[32px] leading-[40px] tracking-[-0.04em] text-black text-center">
              {title}
            </h1>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-6 text-black text-center font-['Public_Sans'] text-[18px] leading-[1.2] tracking-[-0.02em] max-w-[520px] mx-auto">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-5">
            <button
              type="button"
              onClick={handleGoBack}
              className="w-[269px] h-[48px] px-8 py-3 border border-[#35536233] rounded-md
							text-[14px] leading-[24px] tracking-[-0.01em] text-[#355362D9]
							font-medium font-['Public_Sans']
							hover:bg-gray-50 transition-colors duration-200"
            >
              Go Back
            </button>

            <button
              type="button"
              onClick={onContinue}
              className="w-[269px] h-[48px] px-8 py-3 rounded-md
							bg-[#00665F] text-white
							font-medium font-['Public_Sans']
							text-[14px] leading-[24px] tracking-[-0.01em]
							border border-[#35536233] hover:opacity-80 transition-opacity duration-200"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PreIntakeNoteTwoProps {
  onGoBack: () => void;
  onStartIntake: () => void;
  tenantConfig: IntakeTenantConfig;
}

const PreIntakeNoteTwo: React.FC<PreIntakeNoteTwoProps> = ({
  onGoBack,
  onStartIntake,
  tenantConfig,
}) => {
  const { title, faqItems, importantItems } = tenantConfig.noteTwoCopy;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-[3vh]">
      <div className="bg-white shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] rounded-sm w-full md:max-w-[714px] px-6 md:px-[48px] pt-[36px] pb-[28px] flex flex-col justify-between">
        <h1 className="text-center font-serif text-4xl font-normal text-black mb-10 tracking-tight">
          {title}
        </h1>

        <div className="text-black text-base leading-relaxed space-y-8 flex-1">
          {faqItems.map((item) => (
            <div key={item.question}>
              <h3 className="font-['Public_Sans'] font-bold text-[14px] leading-[24px] tracking-[-0.01em] text-black">
                {item.question}
              </h3>
              <p className="font-['Public_Sans'] font-medium text-[14px] leading-[24px] tracking-[-0.01em] text-black">
                {item.answer}
              </p>
            </div>
          ))}

          <div>
            <h3 className="font-['Public_Sans'] font-bold text-[14px] leading-[24px] tracking-[-0.01em] text-black mb-2">
              Important things to know:
            </h3>
            <ul className="space-y-1 font-['Public_Sans'] text-[14px] leading-[24px] tracking-[-0.01em] text-black list-disc">
              {importantItems.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span className="mt-2 w-1 h-1 rounded-full bg-black flex-shrink-0" />
                  <p>
                    <span className="font-bold">{item.label}</span> {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Button Container */}
          <div className="flex justify-center gap-4 mt-10 flex-col md:flex-row">
            <button
              type="button"
              onClick={onGoBack}
              className="w-full md:max-w-[269px] h-[48px] px-8 py-3 border border-[#35536233] rounded-md
							text-[14px] leading-[24px] tracking-[-0.01em] text-[#355362D9]
							font-medium font-['Public_Sans']
							hover:bg-gray-50 transition-colors duration-200"
            >
              Go Back
            </button>

            <button
              type="button"
              onClick={onStartIntake}
              className="w-full md:max-w-[269px] h-[48px] px-8 py-3 rounded-md
							bg-[#00665F] text-white
							font-medium font-['Public_Sans']
							text-[14px] leading-[24px] tracking-[-0.01em]
							border border-[#35536233] hover:opacity-80 transition-opacity duration-200"
            >
              {tenantConfig.preIntakeFlow === "text+video"
                ? "Continue"
                : "Start Intake"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PreIntakeVideoProps {
  onGoBack: () => void;
  onStartIntake: () => void;
  tenantConfig: VideoIntakeConfig | TextVideoIntakeConfig;
}

const PreIntakeVideo: React.FC<PreIntakeVideoProps> = ({
  onGoBack,
  onStartIntake,
  tenantConfig,
}) => {
  const videoRef = useRef(null);

  const [isChecked, setIsChecked] = useState(false);
  const [hasWatchedFullVideo, setHasWatchedFullVideo] = useState(false);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-[2vh]">
      <div className="w-full max-w-3xl md:max-w-[714px]">
        <div className="bg-white shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] rounded-lg w-full md:max-w-[714px] px-6 md:px-[48px] pt-[10px] pb-[10px] flex flex-col justify-between">
          <div>
            <h1 className="font-['Libre_Baskerville'] font-normal text-[32px] leading-[40px] tracking-[-0.04em] text-black text-center mb-8">
              Your Intake
            </h1>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="text-black text-center font-['Public_Sans'] text-[18px] leading-[1.2] tracking-[-0.02em] max-w-[520px] mx-auto">
              <p>{tenantConfig.preIntakeCopy}</p>
            </div>

            {/* Video Placeholder */}
            <div className="w-full max-w-[520px] h-[293px] bg-[#E5E7EB] rounded-lg flex items-center justify-center">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={videoRef}
                className="w-full h-full border-1 border-gray-400 border-l-transparent flex items-center justify-center video-no-seekbar"
                width="320"
                height="240"
                controls
                controlsList="noplaybackrate noremoteplayback nodownload nopictureinpicture noseekbar"
                onEnded={() => setHasWatchedFullVideo(true)}
              >
                <source src={tenantConfig.video.src} type="video/mp4" />
                <track
                  src={tenantConfig.video.subtitlesSrc}
                  kind="subtitles"
                  srcLang="en"
                  label="English"
                />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Checkbox */}
            <div className="flex items-start gap-3 max-w-[520px] mx-auto">
              <div className="flex items-center mt-1">
                <input
                  id="understanding-checkbox"
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="w-4 h-4 text-[#00665F] bg-white border-gray-300 rounded focus:ring-[#00665F] focus:ring-2 accent-[#00665F]"
                />
              </div>
              <label
                htmlFor="understanding-checkbox"
                className="font-['Public_Sans'] text-[14px] leading-[20px] tracking-[-0.01em] cursor-pointer text-[#004D48]"
              >
                I understand that my case manager, my parole officer, and other
                staff working with my case will be able to see the information I
                share.
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-10 flex-col md:flex-row">
            <button
              type="button"
              onClick={onGoBack}
              className="w-full md:max-w-[269px] h-[48px] px-8 py-3 border border-[#35536233] rounded-md
							text-[14px] leading-[24px] tracking-[-0.01em] text-[#355362D9]
							font-medium font-['Public_Sans']
							hover:bg-gray-50 transition-colors duration-200"
            >
              Go Back
            </button>

            <div className="relative group">
              <button
                type="button"
                onClick={onStartIntake}
                disabled={!isChecked || !hasWatchedFullVideo}
                className={`w-full md:max-w-[269px] h-[48px] px-8 py-3 rounded-md
							font-medium font-['Public_Sans']
							text-[14px] leading-[24px] tracking-[-0.01em]
							border border-[#35536233] transition-all duration-200
							${
                isChecked && hasWatchedFullVideo
                  ? "bg-[#00665F] text-white hover:opacity-80"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              >
                Start Intake
              </button>
              {(!isChecked || !hasWatchedFullVideo) && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Please watch the full video and check the box to continue
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PreIntakeNoteOne, PreIntakeNoteTwo, PreIntakeVideo };
