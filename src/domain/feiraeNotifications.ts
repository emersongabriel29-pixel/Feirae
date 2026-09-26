export type FeiraeNotificationPermission = NotificationPermission | "unsupported";

export function feiraeNotificationPermission(): FeiraeNotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestFeiraeNotificationPermission(): Promise<FeiraeNotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.requestPermission();
}

export async function showFeiraeNotification({
  title,
  body,
  tag,
  url = "/",
}: {
  title: string;
  body: string;
  tag: string;
  url?: string;
}) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  const notificationTitle = `Feiraê • ${title}`;
  const options: NotificationOptions = {
    body,
    icon: "/feirae-mark.svg",
    badge: "/feirae-mark.svg",
    tag,
    data: { url },
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notificationTitle, options);
      return true;
    }

    const notification = new Notification(notificationTitle, options);
    notification.onclick = () => {
      window.focus();
      window.location.assign(url);
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}
