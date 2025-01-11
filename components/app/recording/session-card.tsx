/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  pushSelectedRecordings,
  removeSelectedRecordings,
} from "@/redux/features/projects/slice";
import { RecordingSession } from "@/redux/features/recordings/api";
import { RootState } from "@/redux/store";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Chrome,
  CircleDashed,
  Globe,
  Globe2,
  Info,
  Laptop,
  Monitor,
  MonitorSmartphone,
  MousePointer2,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { UAParser } from "ua-parser-js";

const parser = new UAParser();

function SessionCard({
  session,
  groupAnalysis,
}: {
  session: RecordingSession;
  groupAnalysis: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedRecordings } = useSelector(
    (state: RootState) => state.projects
  );
  const dispatch = useDispatch();

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
      className={`p-4 hover:bg-accent transition-colors cursor-pointer flex items-center justify-between mb-4 ${
        selectedRecordings.includes(session.session_id)
          ? "bg-accent"
          : pathname === `/recordings/${session.session_id}`
          ? "bg-accent"
          : ""
      }`}
      onClick={() => {
        if (groupAnalysis) {
          if (selectedRecordings.includes(session.session_id)) {
            dispatch(removeSelectedRecordings(session.session_id));
          } else {
            dispatch(pushSelectedRecordings(session.session_id));
          }
        } else {
          router.push(`/recordings/${session.session_id}`);
        }
      }}
    >
      {groupAnalysis && (
        <div className="flex h-4 w-4 mr-3">
          {selectedRecordings.includes(session.session_id) ? (
            <div className="h-3 w-3 bg-primary rounded-full" />
          ) : (
            <CircleDashed className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      )}

      <div className="space-y-3 w-full">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span
              className={`text-sm font-medium truncate ${
                groupAnalysis ? "max-w-[180px]" : "max-w-[200px]"
              }`}
            >
              {session.page_url}
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="bg-secondary-foreground text-secondary border-border">
                <p>View session recording</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
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
          <div className="flex items-center gap-1">
            <Laptop className="h-3 w-3" />
            {session.viewport_width}x{session.viewport_height}
          </div>
          <div className="flex items-center gap-1">
            <MousePointer2 className="h-3 w-3" />
            {getDeviceType(session.user_agent)}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default SessionCard;
