/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ObservabilitySession } from "@/redux/features/observability/api";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Chrome,
  Globe,
  Globe2,
  Info,
  Monitor,
  MonitorSmartphone,
  MousePointer2,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { UAParser } from "ua-parser-js";

const parser = new UAParser();

function SessionCard({ session }: { session: ObservabilitySession }) {
  const pathname = usePathname();
  const router = useRouter();

  const getBrowserIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe2 className="h-3 w-3" />;
    parser.setUA(userAgent);
    const browserName = parser.getBrowser().name?.toLowerCase() ?? "";

    switch (browserName) {
      case "chrome":
        return <Chrome className="h-3 w-3" />;
      case "firefox":
        return <Monitor className="h-3 w-3" />;
      case "safari":
        return <MonitorSmartphone className="h-3 w-3" />;
      default:
        return <Globe2 className="h-3 w-3" />;
    }
  };

  const getDeviceType = (userAgent: string | null) => {
    if (!userAgent) return "Unknown";
    parser.setUA(userAgent);
    return parser.getDevice().type === "mobile" ||
      parser.getDevice().type === "tablet"
      ? "Mobile"
      : "Desktop";
  };

  return (
    <Card
      className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
        pathname === `/errors/sessions/${session.session_id}` ? "bg-accent" : ""
      }`}
      onClick={() => router.push(`/errors/sessions/${session.session_id}`)}
    >
      <div className="space-y-3 w-full">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className={`text-sm font-medium truncate max-w-[200px]`}>
              {session.referrer}
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info
                  className="h-4 w-4 text-muted-foreground"
                  onClick={() =>
                    router.push(`/recordings/sessions/${session.session_id}`)
                  }
                />
              </TooltipTrigger>
              <TooltipContent className="bg-secondary-foreground text-secondary border-border">
                <p>View session recording</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 capitalize">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(session.start_timestamp), {
              addSuffix: true,
            })}
          </div>
          <div className="flex items-center gap-1">
            {getBrowserIcon(session.user_agent)}
            {session.user_agent
              ? (() => {
                  parser.setUA(session.user_agent);
                  return parser.getBrowser().name || "Unknown";
                })()
              : "Unknown"}
          </div>
          {/* <div className="flex items-center gap-1">
            <Laptop className="h-3 w-3" />
            {session.referrer}
          </div> */}
          <div className="flex items-center gap-1">
            <MousePointer2 className="h-3 w-3" />
            {getDeviceType(session.user_agent)}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{session.session_id}</p>
      </div>
    </Card>
  );
}

export default SessionCard;
