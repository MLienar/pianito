import { useCallback, useEffect, useRef, useState } from "react";

export type MidiConnectionState = "disconnected" | "connecting" | "connected";

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer?: string;
}

interface UseMidiConnectionOptions {
  onNotePress?: (noteLetter: string) => void;
  enableNoteInput?: boolean;
}

export function useMidiConnection({
  onNotePress,
  enableNoteInput = true,
}: UseMidiConnectionOptions = {}) {
  const [state, setState] = useState<MidiConnectionState>("disconnected");
  const [availableDevices, setAvailableDevices] = useState<MidiDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<MidiDevice | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [userDeniedConnection, setUserDeniedConnection] = useState(false);

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const connectedInputRef = useRef<MIDIInput | null>(null);
  const onNotePressRef = useRef(onNotePress);
  onNotePressRef.current = onNotePress;

  // Convert MIDI note number to note letter (C, D, E, F, G, A, B only)
  const midiNoteToLetter = useCallback((noteNumber: number): string | null => {
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const noteName = noteNames[noteNumber % 12];
    // Only return natural notes (no sharps/flats) as the app only uses C-G, A, B
    if (!noteName || noteName.includes("#")) return null;
    return noteName;
  }, []);

  // Handle MIDI message
  const handleMidiMessage = useCallback(
    (event: MIDIMessageEvent) => {
      if (!event.data || event.data.length < 2) return;

      const data = Array.from(event.data);
      const [status, data1] = data;

      // Note on message (status 144-159) with velocity > 0
      if (status >= 144 && status <= 159 && data1 != null) {
        const velocity = data[2];
        if (velocity && velocity > 0) {
          const noteLetter = midiNoteToLetter(data1);
          if (noteLetter && enableNoteInput && onNotePressRef.current) {
            onNotePressRef.current(noteLetter);
          }
        }
      }
    },
    [midiNoteToLetter, enableNoteInput],
  );

  // Get available MIDI devices
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
    setAvailableDevices(devices);
  }, []);

  // Connect to a specific device
  const connectToDevice = useCallback(
    async (deviceId: string) => {
      const access = midiAccessRef.current;
      if (!access) return;

      const input = access.inputs.get(deviceId);
      if (!input) {
        setError("Device not found");
        return;
      }

      try {
        setState("connecting");

        // Disconnect from previous device if any
        if (connectedInputRef.current) {
          connectedInputRef.current.removeEventListener(
            "midimessage",
            handleMidiMessage,
          );
          connectedInputRef.current = null;
        }

        // Connect to new device
        input.addEventListener("midimessage", handleMidiMessage);
        connectedInputRef.current = input;

        setConnectedDevice({
          id: input.id,
          name: input.name || "Unknown Device",
          manufacturer: input.manufacturer || undefined,
        });
        setState("connected");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to connect");
        setState("disconnected");
      }
    },
    [handleMidiMessage],
  );

  // Disconnect from current device
  const disconnect = useCallback(() => {
    if (connectedInputRef.current) {
      connectedInputRef.current.removeEventListener(
        "midimessage",
        handleMidiMessage,
      );
      connectedInputRef.current = null;
    }
    setConnectedDevice(null);
    setState("disconnected");
    setError(null);
  }, [handleMidiMessage]);

  // Request MIDI access
  const requestAccess = useCallback(async () => {
    try {
      setError(null);
      setUserDeniedConnection(false);

      if (!navigator.requestMIDIAccess) {
        setError("MIDI not supported in this browser");
        return;
      }

      setState("connecting");
      const access = await navigator.requestMIDIAccess();

      midiAccessRef.current = access;

      // Set up device change listeners
      access.addEventListener("statechange", refreshDevices);

      await refreshDevices();

      // Auto-connect to first available device if any
      const devices = Array.from(access.inputs.values());
      if (devices.length > 0 && devices[0]) {
        await connectToDevice(devices[0].id);
      } else {
        setState("disconnected");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to access MIDI";
      setError(errorMessage);
      setState("disconnected");

      // Check if user denied permission
      if (
        errorMessage.includes("denied") ||
        errorMessage.includes("NotAllowedError")
      ) {
        setUserDeniedConnection(true);
      }
    }
  }, [refreshDevices, connectToDevice]);

  // Initialize MIDI access on mount
  useEffect(() => {
    // Check if MIDI is supported
    if (!navigator.requestMIDIAccess) {
      setError("MIDI not supported in this browser");
      return;
    }

    // Try to get existing access (if previously granted)
    navigator
      .requestMIDIAccess()
      .then((access) => {
        midiAccessRef.current = access;
        access.addEventListener("statechange", refreshDevices);
        refreshDevices();

        // Don't auto-connect on init, let user choose
        setState("disconnected");
      })
      .catch(() => {
        // User hasn't granted permission yet, that's fine
        setState("disconnected");
      });

    return () => {
      if (midiAccessRef.current) {
        midiAccessRef.current.removeEventListener(
          "statechange",
          refreshDevices,
        );
      }
      disconnect();
    };
  }, [refreshDevices, disconnect]);

  return {
    state,
    availableDevices,
    connectedDevice,
    error,
    userDeniedConnection,
    requestAccess,
    connectToDevice,
    disconnect,
    refreshDevices,
  };
}
