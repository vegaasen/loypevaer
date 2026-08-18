// src/components/AlertsOptIn.tsx
import { useState } from "react";

const OPTED_IN_KEY = "weather-alert-events";

function readOptedIn(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(OPTED_IN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

type Props = {
  eventId: string;
};

export function AlertsOptIn({ eventId }: Props) {
  const [enabled, setEnabled] = useState(() => readOptedIn()[eventId] ?? false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied",
  );

  if (!("Notification" in window)) return null;
  if (permissionState === "denied") {
    return (
      <p className="alerts-opt-in__denied">
        Tillat varsler i nettleserinnstillingene for å motta værvarsler.
      </p>
    );
  }

  async function handleToggle() {
    if (!enabled && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermissionState(result);
      if (result !== "granted") return;
    }

    const next = !enabled;
    setEnabled(next);
    const store = readOptedIn();
    if (next) {
      store[eventId] = true;
    } else {
      delete store[eventId];
    }
    localStorage.setItem(OPTED_IN_KEY, JSON.stringify(store));
  }

  return (
    <div className="alerts-opt-in">
      <label className="alerts-opt-in__label">
        <input
          type="checkbox"
          className="alerts-opt-in__checkbox"
          checked={enabled}
          onChange={() => void handleToggle()}
        />
        <span>Få varsel hvis værmeldingen endrer seg</span>
      </label>
      <p className="alerts-opt-in__note">Varsel sendes neste gang du åpner appen.</p>
    </div>
  );
}
