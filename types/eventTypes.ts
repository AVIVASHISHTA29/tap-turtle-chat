export type EventType =
  | "click"
  | "scroll"
  | "mousemove"
  | "dom_load"
  | "dom_unload";

export interface EventData {
  event_type: EventType;
  element_id: string | null;
  css_selector: string | null;
  x_position: number | null;
  y_position: number | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
