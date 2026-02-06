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

import { useState } from "react";

interface AudioPlayerProps {
  // audioUrl will be added later when we connect to actual audio
  audioUrl?: string | null;
}

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2] as const;

function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180); // Placeholder: 3 minutes
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Connect to actual audio element
  };

  const handleSkip = (delta: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(duration, prev + delta)));
    // TODO: Connect to actual audio element
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    // TODO: Connect to actual audio element
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
    // TODO: Connect to actual audio element
  };

  if (!audioUrl) {
    return (
      <div className="audio-player audio-player-placeholder">
        <span className="audio-placeholder-text">No audio available</span>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <div className="audio-controls">
        <button
          className="audio-btn skip-btn"
          onClick={() => handleSkip(-10)}
          title="Skip back 10 seconds"
        >
          -10s
        </button>

        <button
          className="audio-btn play-btn"
          onClick={handlePlayPause}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button
          className="audio-btn skip-btn"
          onClick={() => handleSkip(10)}
          title="Skip forward 10 seconds"
        >
          +10s
        </button>
      </div>

      <div className="audio-progress">
        <span className="audio-time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="audio-slider"
          min={0}
          max={duration}
          value={currentTime}
          onChange={handleSeek}
        />
        <span className="audio-time">{formatTime(duration)}</span>
      </div>

      <div className="audio-speed">
        {PLAYBACK_SPEEDS.map((speed) => (
          <button
            key={speed}
            className={`speed-btn ${playbackSpeed === speed ? "active" : ""}`}
            onClick={() => handleSpeedChange(speed)}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}

export default AudioPlayer;
