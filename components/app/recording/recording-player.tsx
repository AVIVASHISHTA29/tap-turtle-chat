// components/recording-player.tsx
"use client";

import { useEffect, useRef } from "react";

import { Card } from "@/components/ui/card";
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
          height: 600,
          width: 1000,
        },
      });
    }
  }, [events]);

  return (
    <Card className="max-w-[1200px] mx-auto flex justify-center items-center w-fit">
      <div ref={playerRef} className="w-[1000px] h-[680px]" />
    </Card>
  );
}
