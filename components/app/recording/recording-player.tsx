// components/recording-player.tsx
"use client";

import { useEffect, useRef } from "react";

import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import { eventWithTimeAndPacker } from "rrweb/typings/packer/base";

interface RecordingPlayerProps {
  events: unknown[];
}

export function RecordingPlayer({ events }: RecordingPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (playerRef.current && events && events.length > 0) {
      new rrwebPlayer({
        target: playerRef.current,
        props: {
          events: events as eventWithTimeAndPacker[],
          autoPlay: false,
        },
      });
    }
  }, [events]);

  return (
    <div ref={playerRef} className="w-full h-[600px] border border-gray-300" />
  );
}
