import { useCallback, useEffect, useRef, useState } from "react";
import { type MidiDevice, useMidiDevices } from "./use-midi-devices";
import { useMidiMessage } from "./use-midi-message";

export type MidiConnectionState = "disconnected" | "connecting" | "connected";
export type { MidiDevice };

interface UseMidiConnectionOptions {
  onNotePress?: (noteLetter: string) => void;
  enableNoteInput?: boolean;
}

export function useMidiConnection({
  onNotePress,
  enableNoteInput = true,
}: UseMidiConnectionOptions = {}) {
  const [state, setState] = useState<MidiConnectionState>("disconnected");
  const [connectedDevice, setConnectedDevice] = useState<MidiDevice | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [userDeniedConnection, setUserDeniedConnection] = useState(false);

  const connectedInputRef = useRef<MIDIInput | null>(null);

  const { availableDevices, midiAccessRef, refreshDevices } = useMidiDevices();
  const { handleMidiMessage } = useMidiMessage({
    onNotePress,
    enableNoteInput,
  });

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

        if (connectedInputRef.current) {
          connectedInputRef.current.removeEventListener(
            "midimessage",
            handleMidiMessage,
          );
          connectedInputRef.current = null;
        }

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
    [handleMidiMessage, midiAccessRef],
  );

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

  const requestAccess = useCallback(async () => {
    try {
      setError(null);
      setUserDeniedConnection(false);

      if (!navigator.requestMIDIAccess) {
        setError("MIDI not supported in this browser");
        return;
      }

      setState("connecting");

      if (midiAccessRef.current) {
        midiAccessRef.current.removeEventListener(
          "statechange",
          refreshDevices,
        );
      }

      const access = await navigator.requestMIDIAccess();

      midiAccessRef.current = access;
      access.addEventListener("statechange", refreshDevices);
      await refreshDevices();

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

      if (
        errorMessage.includes("denied") ||
        errorMessage.includes("NotAllowedError")
      ) {
        setUserDeniedConnection(true);
      }
    }
  }, [refreshDevices, connectToDevice, midiAccessRef]);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setError("MIDI not supported in this browser");
      return;
    }

    navigator
      .requestMIDIAccess()
      .then((access) => {
        midiAccessRef.current = access;
        access.addEventListener("statechange", refreshDevices);
        refreshDevices();
        setState("disconnected");
      })
      .catch(() => {
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
  }, [refreshDevices, disconnect, midiAccessRef]);

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
