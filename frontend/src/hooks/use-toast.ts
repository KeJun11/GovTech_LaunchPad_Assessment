"use client";

import {
  showNotification,
  updateNotification,
  hideNotification,
  cleanNotifications,
} from "@mantine/notifications";
import type { NotificationProps } from "@mantine/notifications";
import type { ReactNode } from "react";

// Define a compatible toast API
type Toast = {
  title?: ReactNode;
  description?: ReactNode;
  color?: NotificationProps["color"];
  icon?: NotificationProps["icon"];
  autoClose?: NotificationProps["autoClose"];
  // ...add other Mantine notification props as needed
};

function toast({ title, description, ...props }: Toast) {
  const id = Math.random().toString(36).substr(2, 9);
  showNotification({
    id,
    title: title as string,
    message: description as string,
    ...props,
  });
  return {
    id,
    dismiss: () => hideNotification(id),
    update: (updateProps: Partial<Toast>) =>
      updateNotification({
        id,
        title: updateProps.title as string,
        message: updateProps.description as string,
        ...updateProps,
      }),
  };
}

function useToast() {
  // Mantine notifications are global, so no need for local state
  return {
    toast,
    dismiss: (id?: string) => {
      if (id) hideNotification(id);
      else cleanNotifications();
    },
  };
}

export { useToast, toast };
