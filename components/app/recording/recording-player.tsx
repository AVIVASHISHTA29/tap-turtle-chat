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

interface RRWebEvent {
  type?: number;
  event_type?: number;
  timestamp?: number;
  time?: number;
  data?: unknown;
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

      try {
        // Ensure events have the correct format
        const formattedEvents = events.map((event) => {
          const e = event as RRWebEvent;
          return {
            ...e,
            timestamp: e.timestamp || e.time,
            type: e.type || e.event_type,
          };
        });

        console.log("Initializing player with events:", formattedEvents);

        // Create new player instance
        playerInstanceRef.current = new rrwebPlayer({
          target: playerRef.current,
          props: {
            events: formattedEvents as eventWithTimeAndPacker[],
            autoPlay: true,
            skipInactive: true,
            showController: true,
            width: 800,
            height: 500,
            // FIXME: Remove these if they cause issues
            unpackFn: undefined,
            triggerFocus: true,
          },
        });

        console.log("Player instance created:", playerInstanceRef.current);
      } catch (error) {
        console.error("Error initializing rrweb player:", error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.getReplayer().destroy();
        } catch (error) {
          console.error("Error destroying player:", error);
        }
      }
    };
  }, [events]);

  return (
    <Card className="max-w-[800px] mx-auto flex justify-center items-center w-fit dark:bg-gray-900 border-none">
      <div ref={playerRef} className="w-[800px] h-[500px] rrweb-player-dark" />
    </Card>
  );
}
