// components/recording-player.tsx
"use client";

import { useEffect, useRef } from "react";

import { Card } from "@/components/ui/card";
import "@/styles/rrweb-player.css";
import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import { eventWithTimeAndPacker } from "rrweb/typings/packer/base";

interface RecordingPlayerProps {
  events: unknown[];
}

export function RecordingPlayer({ events }: RecordingPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<rrwebPlayer | null>(null);

  useEffect(() => {
    if (playerRef.current && events && events.length > 0) {
      // Cleanup previous instance if it exists
      if (playerInstanceRef.current) {
        playerInstanceRef.current.getReplayer().destroy();
      }

      // Create new player instance
      playerInstanceRef.current = new rrwebPlayer({
        target: playerRef.current,
        props: {
          events: events as eventWithTimeAndPacker[],
          autoPlay: false,
          height: 600,
          width: 1000,
        },
      });
    }

    // Cleanup on unmount
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.getReplayer().destroy();
      }
    };
  }, [events]);

  return (
    <Card className="max-w-[1200px] mx-auto flex justify-center items-center w-fit dark:bg-gray-900 border-none">
      <div ref={playerRef} className="w-[1000px] h-[680px] rrweb-player-dark" />
    </Card>
  );
}
