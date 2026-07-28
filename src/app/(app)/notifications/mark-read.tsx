"use client";

import { markAllNotificationsRead } from "./actions";
import { useEffect } from "react";

/** Marks everything read once the inbox has been viewed. */
export function MarkAllRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (hasUnread) markAllNotificationsRead();
  }, [hasUnread]);
  return null;
}
