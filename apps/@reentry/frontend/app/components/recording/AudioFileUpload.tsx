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

import {
  AudioFile,
  CloudUpload,
  Delete,
  DriveFolderUpload,
  Pause,
  PlayArrow,
} from "@mui/icons-material";
import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import LiveAssessmentModal from "~@reentry/frontend/components/recording/modals/LiveAssessmentModal";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {
  getBaseUrl,
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";

interface AudioFileUploadProps {
  onFileSelected?: (file: File) => void;
  onFileClear?: () => void;
  isOnline?: boolean;
  onFinishUpload: () => void;
  sessionId: string;
}

const AudioFileUpload: React.FC<AudioFileUploadProps> = ({
  onFileSelected,
  onFileClear,
  isOnline = true,
  onFinishUpload,
  sessionId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [liveAssessmentOpen, setLiveAssessmentOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasFinishedUpload, setHasFinishedUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getAccessToken } = useAuth();
  // Handle successful upload completion
  useEffect(() => {
    if (hasFinishedUpload) {
      setHasFinishedUpload(false);
    }
  }, [hasFinishedUpload]);

  // Stop audio playback on page refresh/unload
  useEffect(() => {
    const handlePageUnload = () => {
      if (waveSurferRef.current) {
        try {
          waveSurferRef.current.stop();
          console.log("Audio stopped on page unload");
        } catch (error) {
          console.error("Error stopping audio on page unload:", error);
        }
      }
    };

    // Use both beforeunload and pagehide for reliable cleanup
    // pagehide is more reliable on mobile browsers
    window.addEventListener("beforeunload", handlePageUnload);
    window.addEventListener("pagehide", handlePageUnload);

    return () => {
      window.removeEventListener("beforeunload", handlePageUnload);
      window.removeEventListener("pagehide", handlePageUnload);
    };
  }, []);

  const handleClearFile = () => {
    if (waveSurferRef.current) {
      waveSurferRef.current.stop();
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsPlaying(false);
    setSelectedFile(null);
    setHasFinishedUpload(false);
    setIsLoadingWaveform(false);
    onFileClear?.();
  };
  // Initialize WaveSurfer only when we have a file and the container exists
  useEffect(() => {
    if (!waveformRef.current || !selectedFile) return;

    // Clean up any existing instance
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    // Set loading state when starting to load audio
    setIsLoadingWaveform(true);

    const waveSurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#4fc3f7",
      progressColor: "#29b6f6",
      cursorColor: "#1976d2",
      barWidth: 2,
      barGap: 1,
      height: 80,
      normalize: true,
      backend: "WebAudio",
    });

    // Listen to play/pause events
    waveSurfer.on("play", () => setIsPlaying(true));
    waveSurfer.on("pause", () => setIsPlaying(false));
    waveSurfer.on("finish", () => setIsPlaying(false));

    // Listen to ready event to know when waveform is ready
    waveSurfer.on("ready", () => {
      setIsLoadingWaveform(false);
    });

    // Listen to error event for decoding errors
    waveSurfer.on("error", (error) => {
      console.error("WaveSurfer error:", error);
      setIsLoadingWaveform(false);
      showErrorToast(
        "Unable to decode audio file. Please ensure the file is a valid audio format (MP3, WAV, M4A).",
      );
      // Clear the invalid file
      handleClearFile();
    });

    waveSurferRef.current = waveSurfer;

    // Load the file
    const loadFile = async () => {
      try {
        const url = URL.createObjectURL(selectedFile);
        await waveSurfer.load(url);
      } catch (error) {
        console.error("Error loading audio file:", error);
        setIsLoadingWaveform(false);
        showErrorToast(
          "Unable to load audio file. Please ensure the file is a valid audio format (MP3, WAV, M4A).",
        );
        // Clear the invalid file
        handleClearFile();
      }
    };

    loadFile();

    return () => {
      if (waveSurfer) {
        waveSurfer.destroy();
      }
    };
  }, [selectedFile]);

  const processFile = async (file: File) => {
    // Check if file is an audio file
    if (!file.type.startsWith("audio/")) {
      showErrorToast("Please select a valid audio file");
      return;
    }

    onFileSelected?.(file);
    setSelectedFile(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const togglePlayPause = () => {
    if (waveSurferRef.current) {
      waveSurferRef.current.playPause();
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    console.log("Starting upload process for file:", selectedFile.name);

    try {
      // Decode audio to get duration
      console.log("Getting audio duration...");
      setUploadProgress(5);
      const audioContext = new AudioContext();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const decodedData = await audioContext.decodeAudioData(arrayBuffer);
      await audioContext.close();

      const durationMs = Math.round(decodedData.duration * 1000);
      console.log("Audio duration:", durationMs, "ms");

      // Prepare FormData for upload
      console.log("Preparing file for upload...");
      setUploadProgress(10);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("duration_ms", durationMs.toString());

      // Upload file using XMLHttpRequest for progress tracking
      console.log("Uploading file to server...");
      const uploadAudioEndpoint = `${getBaseUrl()}/recordings/sessions/${sessionId}/upload-audio`;
      const accessToken = getAccessToken();
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            // Map 10-100% to the upload progress
            const percentComplete =
              10 + Math.round((event.loaded / event.total) * 90);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            console.log("File uploaded successfully!");
            showSuccessToast("Audio file uploaded successfully!");
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload aborted"));
        });

        xhr.open("POST", uploadAudioEndpoint);
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

        xhr.send(formData);
      });

      // Mark upload as finished
      setHasFinishedUpload(true);
      onFinishUpload();
    } catch (error) {
      console.error("Error uploading audio file:", error);
      showErrorToast(
        error instanceof Error
          ? error.message
          : "Failed to upload audio file. Please try again.",
      );
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadButtonClick = () => {
    setLiveAssessmentOpen(true);
  };

  const handleLiveAssessmentConfirm = () => {
    setLiveAssessmentOpen(false);
    handleUploadFile();
  };

  const getUploadStatusMessage = () => {
    if (uploadProgress < 10) {
      return "Preparing file...";
    }
    if (uploadProgress < 100) {
      return "Uploading to server...";
    }
    return "Upload complete!";
  };

  const getUploadDetailMessage = () => {
    if (uploadProgress < 10) {
      return "Processing audio file...";
    }
    if (uploadProgress < 100) {
      return `${Math.round((uploadProgress - 10) / 0.9)}% uploaded`;
    }
    return "Upload successful!";
  };

  return (
    <Box className="w-full">
      {/* Main upload area */}
      <div
        className={`w-full min-h-[160px] px-6 py-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
          isDragging
            ? "border-[#006c67] bg-[#006c67]/10 scale-[1.02] shadow-lg"
            : "border-gray-300 hover:border-[#006c67] hover:bg-gray-50/50"
        } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !isUploading && handleButtonClick()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {!selectedFile ? (
          <>
            {/* Upload icon */}
            <div
              className={`p-3 rounded-full transition-all duration-300 ${
                isDragging
                  ? "bg-[#006c67] scale-110"
                  : "bg-[#006c67]/10 group-hover:bg-[#006c67]/20"
              }`}
            >
              <DriveFolderUpload
                className={`transition-colors duration-300 ${
                  isDragging ? "text-white" : "text-[#006c67]"
                }`}
                sx={{ fontSize: 40 }}
              />
            </div>

            {/* Text content */}
            <div className="text-center">
              <Typography className="text-base font-semibold text-[#2b5469] mb-1">
                {isDragging ? "Drop your audio file here" : "Upload Audio File"}
              </Typography>
              <Typography className="text-sm text-gray-600 mb-2">
                Drag and drop your audio file here, or click to browse
              </Typography>
              <Typography className="text-xs text-gray-500">
                Supported formats: MP3, WAV, M4A
              </Typography>
            </div>

            {/* Browse button */}
            {!isDragging && (
              <PrimaryButton
                buttonText="Browse Files"
                onClick={(e) => {
                  e?.stopPropagation();
                  handleButtonClick();
                }}
                disabled={isUploading}
                className="h-9 px-4 py-2 bg-[#006c67] rounded-full text-white text-[13px] font-medium font-['Public_Sans'] hover:bg-[#005550] transition-colors"
              />
            )}
          </>
        ) : (
          <>
            {/* Selected file display */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
              <div className="p-2 bg-[#006c67]/10 rounded-lg">
                <AudioFile className="text-[#006c67]" sx={{ fontSize: 24 }} />
              </div>
              <div className="flex-1 min-w-0">
                <Typography className="text-sm font-semibold text-[#2b5469] truncate">
                  {selectedFile.name}
                </Typography>
                <Typography className="text-xs text-gray-500 mt-0.5">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </div>
              <Tooltip title="Remove file" arrow>
                <span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFile();
                    }}
                    disabled={isUploading || isLoadingWaveform}
                    className={`p-1.5 rounded-full transition-colors ${
                      isUploading || isLoadingWaveform
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    <Delete sx={{ fontSize: 18 }} />
                  </button>
                </span>
              </Tooltip>
            </div>
          </>
        )}
      </div>

      {/* Waveform and controls */}
      {selectedFile && (
        <Box className="w-full mt-4">
          {/* Waveform visualization */}
          <div className="relative mb-4 p-3 bg-white rounded-xl border border-gray-200">
            <Typography className="text-[11px] font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Audio Preview
            </Typography>
            <div className="relative">
              <div
                ref={waveformRef}
                className="w-full rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-white overflow-hidden"
                style={{ minHeight: "80px" }}
              />
              {isLoadingWaveform && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006c67]" />
                    <Typography className="text-xs text-gray-600 font-medium">
                      Loading audio...
                    </Typography>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress indicators */}
          {isUploading && (
            <Box className="mb-4">
              <Box className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CloudUpload
                      className="text-green-600 animate-pulse"
                      sx={{ fontSize: 20 }}
                    />
                    <Typography className="text-sm font-semibold text-green-900">
                      {getUploadStatusMessage()}
                    </Typography>
                  </div>
                  <Typography className="text-lg font-bold text-green-700">
                    {uploadProgress}%
                  </Typography>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  className="h-2.5 rounded-full"
                  sx={{
                    backgroundColor: "#D1FAE5",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#059669",
                      borderRadius: "9999px",
                      transition: "transform 0.2s ease",
                    },
                  }}
                />
                <Typography className="text-xs text-green-700 mt-2">
                  {getUploadDetailMessage()}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Control buttons */}
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={togglePlayPause}
              disabled={isUploading || isLoadingWaveform}
              className={`h-9 px-4 py-2 rounded-full text-[13px] font-medium font-['Public_Sans'] transition-all duration-200 flex items-center gap-1.5 ${
                isUploading || isLoadingWaveform
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#006c67] text-white hover:bg-[#005550] active:scale-95"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause sx={{ fontSize: 16 }} />
                  Pause
                </>
              ) : (
                <>
                  <PlayArrow sx={{ fontSize: 16 }} />
                  Play
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleUploadButtonClick}
              disabled={isUploading || isLoadingWaveform}
              className={`h-9 px-4 py-2 rounded-full text-[13px] font-medium font-['Public_Sans'] transition-all duration-200 flex items-center gap-1.5 ${
                isUploading || isLoadingWaveform
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#006c67] text-white hover:bg-[#005550] active:scale-95"
              }`}
            >
              {isUploading ? (
                <>
                  <CloudUpload
                    sx={{ fontSize: 16 }}
                    className="animate-bounce"
                  />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudUpload sx={{ fontSize: 16 }} />
                  Upload File
                </>
              )}
            </button>
          </div>
        </Box>
      )}

      <LiveAssessmentModal
        isOpen={liveAssessmentOpen}
        onClose={() => setLiveAssessmentOpen(false)}
        onConfirm={handleLiveAssessmentConfirm}
        isOnline={isOnline}
        isPaused={false}
        isFileUpload={true}
      />
    </Box>
  );
};

export default AudioFileUpload;
