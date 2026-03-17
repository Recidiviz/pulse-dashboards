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

import { useRef, useState } from "react";

interface AudioPlayerProps {
  audioUrl?: string | null;
}

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2] as const;

function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkip = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(
      0,
      Math.min(duration, audio.currentTime + delta),
    );
  };

  const handleSpeedChange = (speed: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const value = Number(e.target.value);
    if (audio) audio.currentTime = value;
    setCurrentTime(value);
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
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setIsPlaying(false)}
        style={{ display: "none" }}
      />

      <div className="audio-controls">
        <button
          className="audio-btn skip-btn"
          onClick={() => handleSkip(-5)}
          title="Skip back 5 seconds"
        >
          -5s
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
          onClick={() => handleSkip(5)}
          title="Skip forward 5 seconds"
        >
          +5s
        </button>
      </div>

      <div className="audio-progress">
        <span className="audio-time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="audio-slider"
          min={0}
          max={duration || 0}
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
