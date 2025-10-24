import { EventEmitter } from "node:events";

export type EventBusEvent = "events:changed";

export type EventBusPayload = {
  type: EventBusEvent;
  data?: unknown;
};

class CalendarEventBus extends EventEmitter {
  emitChange(payload?: EventBusPayload["data"]) {
    this.emit("events:changed", { type: "events:changed", data: payload });
  }
}

export const eventBus = new CalendarEventBus();
eventBus.setMaxListeners(0);

export function emitEventsChanged(payload?: EventBusPayload["data"]) {
  eventBus.emitChange(payload);
}
