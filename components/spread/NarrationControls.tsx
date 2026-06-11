"use client";

import { useRef, useState, useCallback } from "react";

interface NarrationControlsProps {
  narrationUrl?: string;
}

export function NarrationControls({ narrationUrl }: NarrationControlsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => {
    if (!narrationUrl) return;
    if (!audioRef.current) {
      const audio = new Audio(narrationUrl);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onplay = () => setPlaying(true);
      audio.onpause = () => setPlaying(false);
    }
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => setPlaying(false));
      setPlaying(true);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, [narrationUrl]);

  const replay = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setPlaying(true);
  }, []);

  if (!narrationUrl) {
    return (
      <div className="flex-1 flex justify-center">
        <span className="text-xs text-gray-400">No narration for this spread</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={play}
        className="px-3 py-1.5 text-sm font-medium rounded border border-[#5b8fb9] text-[#5b8fb9] hover:bg-[#5b8fb9]/10"
      >
        {playing ? "Pause" : "Play narration"}
      </button>
      {playing && (
        <button
          type="button"
          onClick={replay}
          className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
        >
          Replay
        </button>
      )}
    </div>
  );
}
