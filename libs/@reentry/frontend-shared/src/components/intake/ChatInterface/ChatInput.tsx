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

import CloseIcon from "@mui/icons-material/Cancel";
import CheckIcon from "@mui/icons-material/Check";
import MicrophoneIcon from "@mui/icons-material/KeyboardVoice";
import SendIcon from "@mui/icons-material/Send";
import { Box, IconButton, TextareaAutosize } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";

import { getBaseUrl } from "../../../api";
import { useApplicationContext } from "../../../contexts/ApplicationContext";
import { useSocket } from "../../../websockets/IntakeSocketContext";

type UIRecordingStatus =
  | "created"
  | "recording"
  | "paused"
  | "completed"
  | "error"
  | "processing";

const ChatInput = ({ clientPseudoId }: { clientPseudoId?: string | null }) => {
  const { analytics } = useApplicationContext();
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<
    UIRecordingStatus | "inactive"
  >("inactive");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showNoSpeechError, setShowNoSpeechError] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const recordPluginRef = useRef<RecordPlugin | null>(null);
  const bip = new Audio("/audios/recording-start.mp3");
  const {
    intakeContext: {
      connectionStatus,
      waitingForAIInput,
      intakeStatus,
      currentSection,
    },
    intakeDispatchContext: { sendMessage },
  } = useSocket();

  const onSend = async () => {
    if (!inputValue.trim() || isSending) return;
    setIsSending(true);
    await sendMessage(inputValue.trim());
    setInputValue("");
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !isInputDisabled) {
      // Check if device is mobile/tablet
      const isMobileOrTablet =
        /mobile|Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;

      if (isMobileOrTablet) {
        // On mobile/tablet: Enter makes a new line, regardless of shift key
        // Let the default behavior handle the newline
      } else {
        // On desktop: Enter sends message, Shift+Enter makes a new line
        if (e.shiftKey) {
          // Shift+Enter: add new line - let default behavior handle it
        } else {
          // Enter: send message
          e.preventDefault();
          onSend();
        }
      }
    }
  };

  const isInputDisabled =
    intakeStatus !== "in_progress" ||
    waitingForAIInput ||
    connectionStatus !== "connected" ||
    currentSection === "Completion";

  useEffect(() => {
    if (!waitingForAIInput && !isInputDisabled) {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }, [waitingForAIInput, isInputDisabled]);

  useEffect(() => {
    if (connectionStatus === "connecting") {
      setIsSending(false);
    }
  }, [connectionStatus]);

  const getPlaceholderText = () => {
    if (connectionStatus === "connecting") return "Connecting...";
    if (recordingStatus === "processing") return "";
    return "Write a message";
  };

  const isRecordingSupported =
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function";

  // Initialize WaveSurfer and RecordPlugin
  useEffect(() => {
    if (!waveformRef.current || !isRecordingSupported) return;

    const waveSurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#d1d5db",
      progressColor: "#9ca3af",
      cursorColor: "transparent",
      barWidth: 3,
      barGap: 2,
      barRadius: 2,
      height: 40,
      normalize: true,
      backend: "WebAudio",
    });

    const record = waveSurfer.registerPlugin(
      RecordPlugin.create({
        scrollingWaveform: true,
        renderRecordedAudio: false,
      }),
    );

    record.on("record-end", (blob: Blob) => {
      setAudioBlob(blob);
      setRecordingStatus("processing");
      setIsRecording(false);
    });

    record.on("record-start", () => {
      // Recording started
    });

    waveSurferRef.current = waveSurfer;
    recordPluginRef.current = record;

    return () => {
      if (waveSurfer) {
        waveSurfer.destroy();
      }
    };
  }, [isRecordingSupported]);

  const toggleRecording = async () => {
    if (!recordPluginRef.current) return;

    if (isRecording) {
      // Stop recording
      await recordPluginRef.current.stopRecording();
    } else {
      // Start recording
      try {
        bip.play();
        await recordPluginRef.current.startRecording();
        setRecordingStatus("recording");
        setIsRecording(true);
        setShowNoSpeechError(false);

        // Track STT start event
        if (clientPseudoId) {
          analytics.trackIntakeChatSttEvent("start", {
            justiceInvolvedPersonPseudoId: clientPseudoId,
          });
        }
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    }
  };

  const sendAudioBlob = useCallback(async () => {
    if (!audioBlob) return;

    try {
      const formData = new FormData();
      formData.append("file", audioBlob);
      const response = await fetch(`${getBaseUrl()}/transcribe`, {
        method: "POST",
        body: formData,
        headers: {},
      });
      if (!response.ok) {
        throw new Error("Failed to submit audio");
      }
      const data = await response.json();
      const message = data.transcription;
      if (message) {
        setInputValue(inputValue + " " + message);
        setShowNoSpeechError(false);

        // Track STT end event
        if (clientPseudoId) {
          analytics.trackIntakeChatSttEvent("end", {
            justiceInvolvedPersonPseudoId: clientPseudoId,
          });
        }
      } else {
        setShowNoSpeechError(true);
      }
    } catch (error) {
      console.error("Failed to submit audio:", error);
    }
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingStatus("inactive");
  }, [audioBlob, inputValue, clientPseudoId, analytics]);

  // Handle audio blob submission
  useEffect(() => {
    if (recordingStatus === "processing" && audioBlob) {
      sendAudioBlob();
    }
  }, [recordingStatus, audioBlob, sendAudioBlob]);

  return (
    <Box className="p-4 flex flex-col">
      {(intakeStatus === "completed" || currentSection === "Completion") && (
        <Box className="flex flex-col justify-center items-center p-2 rounded-md text-center w-4/5 min-h-[100px] break-words">
          <span className="text-sm text-gray-500">
            Your intake assessment has been completed, you can no longer send
            any new messages.
          </span>
          <span className="text-sm mt-1 text-gray-600">
            Feel free to close the window now.
          </span>
        </Box>
      )}

      {showNoSpeechError && (
        <Box
          onClick={() => setShowNoSpeechError(false)}
          className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 cursor-pointer"
        >
          <CloseIcon className="text-red-600 !text-[14px]" />
          <span className="text-red-600 text-sm font-medium">
            No speech detected. Please try speaking again.
          </span>
        </Box>
      )}

      <Box className="flex items-end">
        <Box
          className={`
                flex items-center justify-center flex-1 relative rounded-xl bg-white
                border p-1 transition-all duration-300
                hover:shadow-lg
                focus-within:border-[#1A3744] focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#1A3744]/20
                ${isInputDisabled ? "border-[#2B546933]" : "border-[#224557] shadow-lg"}
                ${isRecording ? "min-h-[60px]" : ""}
                `}
        >
          <div className="flex-1 relative w-full">
            <TextareaAutosize
              ref={textareaRef}
              minRows={1}
              maxRows={6}
              value={inputValue}
              disabled={
                isInputDisabled ||
                recordingStatus === "recording" ||
                recordingStatus === "processing"
              }
              placeholder={getPlaceholderText()}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`focus:placeholder-opacity-30
							w-full max-w-[800px]
							border-none outline-none resize-none
							overflow-auto font-public text-md
							tracking-[-1%] px-[16px] py-[8px]
							${isRecording ? "opacity-0 absolute pointer-events-none" : "opacity-100"}
							${isInputDisabled ? "text-[#525454] text-opacity-20 placeholder-[#2B5469] placeholder-opacity-20" : "text-[#2B5469] text-opacity-100 placeholder-[#2B5469] placeholder-opacity-80"}
						`}
            />

            <div
              className={`flex items-center px-[16px] py-[8px] ${
                isRecording
                  ? "opacity-100"
                  : "opacity-0 absolute pointer-events-none"
              }`}
            >
              <span className="text-[#2B5469] text-opacity-80 text-md mr-4">
                Listening...
              </span>
              <div
                ref={waveformRef}
                className="flex-1"
                style={{ minHeight: "40px" }}
              />
            </div>
          </div>
          <div>
            <IconButton
              onClick={onSend}
              disabled={
                isInputDisabled ||
                !inputValue.trim() ||
                isRecording ||
                recordingStatus === "processing"
              }
              className={`absolute right-1 border-none bg-transparent transition-opacity duration-300 ${
                isRecording || recordingStatus === "processing"
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <SendIcon
                className={`text-[#2B5469] ${
                  isInputDisabled || !inputValue.trim() || isRecording
                    ? "text-opacity-20"
                    : "text-opacity-80"
                } text-[17px] rotate-[-50deg] leading-[22px] tracking-[-0.43px] font-normal`}
              />
            </IconButton>

            <IconButton
              onClick={toggleRecording}
              disabled={
                isInputDisabled ||
                !isRecordingSupported ||
                recordingStatus === "processing"
              }
              className={`absolute right-3 border-none transition-all duration-300 ${
                isRecording
                  ? "!bg-green-100 hover:!bg-green-300"
                  : "bg-transparent"
              }`}
            >
              {(() => {
                if (recordingStatus === "processing") {
                  return (
                    <CircularProgress size={20} sx={{ color: "#2B5469" }} />
                  );
                }
                if (isRecording) {
                  return (
                    <CheckIcon
                      className={`text-green-600 transition-opacity duration-300 ${
                        isInputDisabled ? "text-opacity-20" : "text-opacity-100"
                      } text-[17px] leading-[22px] tracking-[-0.43px] font-normal`}
                    />
                  );
                }
                return (
                  <MicrophoneIcon
                    className={`text-[#2B5469] transition-opacity duration-300 ${
                      isInputDisabled || !isRecordingSupported
                        ? "text-opacity-20"
                        : "text-opacity-80"
                    } text-[17px] leading-[22px] tracking-[-0.43px] font-normal`}
                  />
                );
              })()}
            </IconButton>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInput;
