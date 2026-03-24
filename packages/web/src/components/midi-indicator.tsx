import { useTranslation } from "react-i18next";
import {
  type MidiConnectionState,
  useMidiConnection,
} from "@/hooks/use-midi-connection";
import { Button } from "./button";

interface MidiIndicatorProps {
  onNotePress?: (noteLetter: string) => void;
  enableNoteInput?: boolean;
}

export function MidiIndicator({
  onNotePress,
  enableNoteInput,
}: MidiIndicatorProps) {
  const { t } = useTranslation();
  const {
    state,
    availableDevices,
    connectedDevice,
    error,
    userDeniedConnection,
    requestAccess,
    connectToDevice,
    disconnect,
  } = useMidiConnection({ onNotePress, enableNoteInput });

  const getStatusColor = (state: MidiConnectionState): string => {
    switch (state) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-gray-400";
    }
  };

  const getStatusText = (state: MidiConnectionState): string => {
    switch (state) {
      case "connected":
        return t("midi.connected");
      case "connecting":
        return t("midi.connecting");
      case "disconnected":
        return t("midi.disconnected");
    }
  };

  const handleConnect = () => {
    if (state === "connected" && connectedDevice) {
      disconnect();
    } else if (availableDevices.length > 0) {
      // Connect to first available device
      const firstDevice = availableDevices[0];
      if (firstDevice) {
        connectToDevice(firstDevice.id);
      }
    } else {
      requestAccess();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-card border-2 border-border rounded-lg p-2 shadow-[var(--shadow-brutal)] text-sm">
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor(state)} ${
            state === "connecting" ? "animate-pulse" : ""
          }`}
        />
        <span className="font-medium">
          {t("midi.title")}: {getStatusText(state)}
        </span>

        {connectedDevice && (
          <span className="text-muted-foreground text-xs max-w-24 truncate">
            {connectedDevice.name}
          </span>
        )}

        <Button
          size="sm"
          variant={state === "connected" ? "default" : "primary"}
          onClick={handleConnect}
          className="ml-2 text-xs px-2 py-1"
        >
          {state === "connected"
            ? t("midi.disconnect")
            : availableDevices.length > 0
              ? t("midi.connect")
              : t("midi.enable")}
        </Button>
      </div>

      {error && !userDeniedConnection && (
        <div className="mt-2 bg-red-100 border-2 border-red-300 text-red-800 p-2 rounded text-xs max-w-64">
          {error}
        </div>
      )}

      {userDeniedConnection && (
        <div className="mt-2 bg-yellow-100 border-2 border-yellow-300 text-yellow-800 p-2 rounded text-xs max-w-64">
          {t("midi.permissionDenied")}
        </div>
      )}
    </div>
  );
}
