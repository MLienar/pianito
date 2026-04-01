import { useCallback, useRef, useState } from "react";

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer?: string;
}

export function useMidiDevices() {
  const [availableDevices, setAvailableDevices] = useState<MidiDevice[]>([]);
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  const refreshDevices = useCallback(async () => {
    const access = midiAccessRef.current;
    if (!access) return;

    const devices: MidiDevice[] = [];
    for (const input of access.inputs.values()) {
      devices.push({
        id: input.id,
        name: input.name || "Unknown Device",
        manufacturer: input.manufacturer || undefined,
      });
    }
    setAvailableDevices((prev) => {
      if (
        prev.length === devices.length &&
        prev.every((d, i) => d.id === devices[i]?.id)
      ) {
        return prev;
      }
      return devices;
    });
  }, []);

  return {
    availableDevices,
    midiAccessRef,
    refreshDevices,
  };
}
