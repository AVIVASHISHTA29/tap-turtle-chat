/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { useState } from "react";

interface TimeFilterProps {
  onFilterChange: (filter: {
    timeFilter: "30m" | "1h" | "6h" | "1d" | "1w" | "custom" | undefined;
    startDate?: string;
    endDate?: string;
  }) => void;
}

const timeFilterOptions = [
  { label: "Last 30 minutes", value: "30m" },
  { label: "Last 1 hour", value: "1h" },
  { label: "Last 6 hours", value: "6h" },
  { label: "Last 24 hours", value: "1d" },
  { label: "Last week", value: "1w" },
  { label: "Custom range", value: "custom" },
] as const;

export function TimeFilter({ onFilterChange }: TimeFilterProps) {
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof timeFilterOptions)[number]["value"]>();
  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const handleFilterSelect = (
    value: (typeof timeFilterOptions)[number]["value"]
  ) => {
    setSelectedFilter(value);
    if (value === "custom") {
      // Don't trigger filter change yet, wait for date selection
      return;
    }
    onFilterChange({
      timeFilter: value,
    });
  };

  const handleDateSelect = (value: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setDate(value);
    if (value.from && value.to) {
      onFilterChange({
        timeFilter: "custom",
        startDate: value.from.toISOString(),
        endDate: value.to.toISOString(),
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            {selectedFilter
              ? timeFilterOptions.find((opt) => opt.value === selectedFilter)
                  ?.label
              : "All time"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {timeFilterOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleFilterSelect(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedFilter === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(value) => handleDateSelect(value as any)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
