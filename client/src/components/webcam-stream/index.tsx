import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  RefreshCw,
  Video,
  VideoOff,
  Volume2,
  VolumeOff,
} from 'lucide-react';
import { isMobile } from 'react-device-detect';
import Peer from 'simple-peer';
import { toast } from 'sonner';

import { StreamServiceMsg } from '@common/types/message';
import type { User } from '@common/types/user';

import { storage } from '@/lib/services/storage';
import { userMap } from '@/lib/services/user-map';
import { getSocket } from '@/lib/socket';
import { cn, parseError } from '@/lib/utils';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface WebcamStreamProps {
  users: User[];
}

const WebcamStream = ({ users }: WebcamStreamProps) => {
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speakersOn, setSpeakersOn] = useState(true);
  const [remoteStreams, setRemoteStreams] = useState<{
    [key: string]: MediaStream | null;
  }>({});
  const [remoteMicStates, setRemoteMicStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [remoteSpeakerStates, setRemoteSpeakerStates] = useState<{
    [key: string]: boolean;
  }>(() => {
    // Initialize with default 'true' state for all users
    return users.reduce(
      (acc, user) => {
        acc[user.id] = true;
        return acc;
      },
      {} as { [key: string]: boolean },
    );
  });

  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>(
    [],
  );
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [cameraFacingMode, setCameraFacingMode] = useState<
    'user' | 'environment'
  >('user');

  const socket = getSocket();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [key: string]: Peer.Instance }>({});
  const pendingSignalsRef = useRef<{ [key: string]: any[] }>({});

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      // Group devices by kind
      const videoInputs = devices.filter(
        (device) => device.kind === 'videoinput',
      );
      const audioInputs = devices.filter(
        (device) => device.kind === 'audioinput',
      );
      const audioOutputs = devices.filter(
        (device) => device.kind === 'audiooutput',
      );

      // Set all available devices
      setVideoDevices(
        videoInputs.map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
        })),
      );
      setAudioInputDevices(
        audioInputs.map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 4)}`,
        })),
      );
      setAudioOutputDevices(
        audioOutputs.map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${device.deviceId.slice(0, 4)}`,
        })),
      );

      // Set default devices if not already set
      if (!selectedVideoDevice) {
        const defaultVideo =
          videoInputs.find((d) => d.deviceId === 'default')?.deviceId ||
          videoInputs[0]?.deviceId;
        if (defaultVideo) setSelectedVideoDevice(defaultVideo);
      }

      if (!selectedAudioInput) {
        const defaultAudio =
          audioInputs.find((d) => d.deviceId === 'default')?.deviceId ||
          audioInputs[0]?.deviceId;
        if (defaultAudio) setSelectedAudioInput(defaultAudio);
      }

      if (!selectedAudioOutput) {
        const defaultOutput =
          audioOutputs.find((d) => d.deviceId === 'default')?.deviceId ||
          audioOutputs[0]?.deviceId;
        if (defaultOutput) setSelectedAudioOutput(defaultOutput);
      }
    } catch (error) {
      toast.error(`Error enumerating devices: ${parseError(error)}`);
    }
  }, [selectedVideoDevice, selectedAudioInput, selectedAudioOutput]);

  // Clean up a peer connection
  const cleanupPeer = useCallback((userID: string) => {
    const peer = peersRef.current[userID];
    if (peer) {
      if (!peer.destroyed) {
        try {
          peer.destroy();
        } catch (error) {
          toast.warning(`Error destroying peer connection for ${userID}`);
        }
      }
      delete peersRef.current[userID];
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[userID];
        return newStreams;
      });
    }
  }, []);

  // Create a new peer connection
  const createPeer = useCallback(
    (userID: string, initiator: boolean) => {
      try {
        // Clean up existing peer if it exists
        cleanupPeer(userID);

        // Create peer with or without local stream
        const peer = new Peer({
          initiator,
          stream: streamRef.current || undefined,
        });

        peer.on('signal', (signal) => {
          socket.emit(StreamServiceMsg.SIGNAL, signal);
        });

        peer.on('stream', (stream) => {
          setRemoteStreams((prev) => ({
            ...prev,
            [userID]: stream,
          }));
        });

        peer.on('error', (err) => {
          // if (!err.message.includes('state')) {
          //   toast.error(`Peer connection error:\n${parseError(err)}`);
          // }
          console.warn(`Peer connection error:\n${parseError(err)}`);
          cleanupPeer(userID);
        });

        // Process any pending signals
        const pendingSignals = pendingSignalsRef.current[userID] || [];
        pendingSignals.forEach((signal) => {
          try {
            peer.signal(signal);
          } catch (error) {
            toast.warning(
              `Error processing pending signal for ${userID}:\n${error}`,
            );
          }
        });
        delete pendingSignalsRef.current[userID];

        peersRef.current[userID] = peer;
        return peer;
      } catch (error) {
        toast.error(`Error creating peer connection:\n${parseError(error)}`);
        return null;
      }
    },
    [socket, cleanupPeer],
  );

  // Get local media stream
  const getMedia = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: isMobile
          ? { facingMode: cameraFacingMode }
          : selectedVideoDevice
            ? { deviceId: { exact: selectedVideoDevice } }
            : true,
        audio: selectedAudioInput
          ? { deviceId: { exact: selectedAudioInput } }
          : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Store the stream
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Set audio output if supported
        if ('setSinkId' in videoRef.current && selectedAudioOutput) {
          try {
            await (videoRef.current as any).setSinkId(selectedAudioOutput);
          } catch (error) {
            console.warn('Error setting audio output device:', error);
          }
        }
      }

      // Set initial audio track state
      stream.getAudioTracks().forEach((track) => {
        track.enabled = micOn;
      });

      // Update existing peer connections
      Object.entries(peersRef.current).forEach(([userID, peer]) => {
        if (!peer.destroyed) {
          streamRef.current?.getTracks().forEach((track) => {
            try {
              peer.addTrack(track, streamRef.current!);
            } catch (error) {
              cleanupPeer(userID);
              createPeer(userID, true);
            }
          });
        }
      });

      return true;
    } catch (error) {
      toast.error(`Error accessing media devices: ${parseError(error)}`);
      return false;
    }
  }, [
    createPeer,
    micOn,
    cleanupPeer,
    selectedVideoDevice,
    selectedAudioInput,
    selectedAudioOutput,
    cameraFacingMode,
  ]);

  // Function to rotate camera on mobile
  const rotateCamera = async () => {
    if (!isMobile) return;

    const newFacingMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(newFacingMode);

    if (cameraOn) {
      // Stop current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Get new stream with rotated camera
      await getMedia();
    }
  };

  // Device selection components
  interface DeviceButtonProps {
    icon: React.ElementType;
    label: string;
    devices: MediaDevice[];
    selectedDevice: string;
    onDeviceSelect: (deviceId: string) => void;
    onToggle: () => void;
    isEnabled: boolean;
    disabled?: boolean;
  }

  const DeviceControls = ({
    icon: Icon,
    label,
    devices,
    selectedDevice,
    onDeviceSelect,
    onToggle,
    isEnabled,
    disabled = false,
  }: DeviceButtonProps) => (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onToggle}
            className={cn(
              isEnabled
                ? 'bg-[color:var(--toolbar-accent)] text-[color:var(--panel-text-accent)] hover:bg-[color:var(--toolbar-accent)]'
                : 'bg-black/70 hover:bg-black/80 dark:bg-white/10 dark:hover:bg-white/20',
              'rounded-r-none',
            )}
            size="icon"
            disabled={disabled}
            type="button"
            aria-label={`Toggle ${label}`}
          >
            <Icon className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isEnabled ? `Turn off ${label}` : `Turn on ${label}`}
        </TooltipContent>
      </Tooltip>

      <Select
        value={selectedDevice || undefined}
        onValueChange={onDeviceSelect}
        disabled={disabled}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <SelectTrigger
              className="h-10 w-5 rounded-l-none border-0 p-0 hover:bg-foreground/20 [&>svg]:w-full"
              aria-label={`Select ${label} device`}
            ></SelectTrigger>
          </TooltipTrigger>
          <TooltipContent>Select {label}</TooltipContent>
        </Tooltip>
        <SelectContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          {devices.map((device) => (
            <SelectItem
              key={device.deviceId}
              value={device.deviceId}
              className="gap-2"
            >
              {device.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Initialize device enumeration
  useEffect(() => {
    const initDevices = async () => {
      // Request initial permissions to get device labels
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        await enumerateDevices();
      } catch (error) {
        console.warn('Error getting initial permissions:', error);
      }

      // Listen for device changes
      navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    };

    initDevices();
    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        enumerateDevices,
      );
    };
  }, [enumerateDevices]);

  // Handle incoming signals
  const handleSignal = useCallback(
    (userID: string, signal: any) => {
      try {
        let peer = peersRef.current[userID];

        if (!peer || peer.destroyed) {
          if (!pendingSignalsRef.current[userID]) {
            pendingSignalsRef.current[userID] = [];
          }
          pendingSignalsRef.current[userID].push(signal);
          peer = createPeer(userID, false) as Peer.Instance;
        } else {
          peer.signal(signal);
        }
      } catch (error) {
        toast.error(`Error handling peer signal:\n${parseError(error)}`);
      }
    },
    [createPeer],
  );

  // Toggle camera
  const toggleCamera = async () => {
    try {
      if (!cameraOn) {
        const mediaStarted = await getMedia();
        if (mediaStarted) {
          setCameraOn(true);
        }
      } else {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        socket.emit(StreamServiceMsg.CAMERA_OFF);
        streamRef.current = null;
        setCameraOn(false);
        setMicOn(false); // Reset mic state when camera is turned off
      }
    } catch (error) {
      toast.error(`Error toggling camera.\n${parseError(error)}`);
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    try {
      if (!streamRef.current) {
        toast.error('No active media stream');
        return;
      }

      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length === 0) {
        toast.error('No audio track found');
        return;
      }

      const newMicState = !micOn;
      audioTracks.forEach((track) => {
        track.enabled = newMicState;
      });

      setMicOn(newMicState);
      socket.emit(StreamServiceMsg.MIC_STATE, newMicState);
    } catch (error) {
      toast.error(`Error toggling microphone.\n${parseError(error)}`);
    }
  };

  const toggleSpeakers = () => {
    const newSpeakerState = !speakersOn;
    setSpeakersOn(newSpeakerState);
    socket.emit(StreamServiceMsg.SPEAKER_STATE, newSpeakerState);
  };

  // Handle socket events
  useEffect(() => {
    socket.emit(StreamServiceMsg.STREAM_READY);

    socket.on(StreamServiceMsg.USER_READY, (userID: string) => {
      createPeer(userID, true);
    });

    socket.on(
      StreamServiceMsg.MIC_STATE,
      ({ userID, micOn }: { userID: string; micOn: boolean }) => {
        setRemoteMicStates((prev) => ({ ...prev, [userID]: micOn }));
      },
    );

    socket.on(
      StreamServiceMsg.SPEAKER_STATE,
      ({ userID, speakersOn }: { userID: string; speakersOn: boolean }) => {
        setRemoteSpeakerStates((prev) => ({ ...prev, [userID]: speakersOn }));
      },
    );

    socket.on(
      StreamServiceMsg.SIGNAL,
      ({ userID, signal }: { userID: string; signal: any }) => {
        handleSignal(userID, signal);
      },
    );

    socket.on(StreamServiceMsg.CAMERA_OFF, (userID: string) => {
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[userID];
        return newStreams;
      });
    });

    const currentPeers = peersRef.current;

    return () => {
      socket.off(StreamServiceMsg.STREAM_READY);
      socket.off(StreamServiceMsg.USER_READY);
      socket.off(StreamServiceMsg.SIGNAL);
      socket.off(StreamServiceMsg.USER_DISCONNECTED);
      socket.off(StreamServiceMsg.MIC_STATE);
      socket.off(StreamServiceMsg.SPEAKER_STATE);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.keys(currentPeers).forEach(cleanupPeer);
    };
  }, [socket, createPeer, handleSignal, cleanupPeer]);

  const VideoControls = ({
    isLocal,
    userId,
  }: {
    isLocal: boolean;
    userId: string;
  }) => {
    const micState = isLocal ? micOn : remoteMicStates[userId];
    const speakerState = isLocal ? speakersOn : remoteSpeakerStates[userId];

    return (
      <div className="absolute right-2 top-2 flex gap-1">
        <div
          className={cn(
            'rounded px-1.5 py-0.5',
            micState ? 'bg-green-500/70' : 'bg-red-500/70',
          )}
        >
          {micState ? (
            <Mic className="size-4 text-white" />
          ) : (
            <MicOff className="size-4 text-white" />
          )}
        </div>
        <div
          className={cn(
            'rounded px-1.5 py-0.5',
            speakerState ? 'bg-green-500/70' : 'bg-red-500/70',
          )}
        >
          {speakerState ? (
            <Volume2 className="size-4 text-white" />
          ) : (
            <VolumeOff className="size-4 text-white" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-col bg-[color:var(--panel-background)] p-2">
      <div
        className="grid max-h-[95%] auto-rows-[1fr] gap-2 overflow-y-auto"
        style={{
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        }}
      >
        {/* Local video */}
        <div className="relative">
          <div className="relative aspect-video rounded-lg bg-black/10 dark:bg-black/30">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="size-full scale-x-[-1] rounded-lg object-cover"
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar
                  user={{
                    id: storage.getUserId() ?? '',
                    username: userMap.get(storage.getUserId() ?? '') ?? '',
                  }}
                  size="lg"
                />
              </div>
            )}
            <VideoControls isLocal={true} userId={storage.getUserId() ?? ''} />
            <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded bg-black/50 px-2 py-1 text-sm text-white">
              {userMap.get(storage.getUserId() ?? '')} (You)
            </div>
          </div>
        </div>

        {/* Remote videos */}
        {users
          .filter((user) => user.id !== storage.getUserId())
          .map((user) => (
            <div key={user.id} className="relative">
              <div className="relative aspect-video rounded-lg bg-black/10 dark:bg-black/30">
                {remoteStreams[user.id] ? (
                  <video
                    autoPlay
                    playsInline
                    muted={!speakersOn}
                    className="size-full scale-x-[-1] rounded-lg object-cover"
                    ref={(element) => {
                      if (element) element.srcObject = remoteStreams[user.id];
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar user={user} size="lg" />
                  </div>
                )}
                <VideoControls isLocal={false} userId={user.id} />
                <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded bg-black/50 px-2 py-1 text-sm text-white">
                  {user.username}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4">
        <div className="flex items-center gap-2">
          <DeviceControls
            icon={cameraOn ? Video : VideoOff}
            label="camera"
            devices={videoDevices}
            selectedDevice={selectedVideoDevice}
            onDeviceSelect={async (deviceId) => {
              setSelectedVideoDevice(deviceId);
              if (cameraOn) await getMedia();
            }}
            onToggle={toggleCamera}
            isEnabled={cameraOn}
          />

          {isMobile && cameraOn && (
            <Button
              onClick={rotateCamera}
              variant="ghost"
              size="icon"
              className="bg-foreground/10 hover:bg-foreground/20"
              aria-label="Rotate camera"
            >
              <RefreshCw className="size-5" />
            </Button>
          )}
        </div>

        <DeviceControls
          icon={micOn ? Mic : MicOff}
          label="microphone"
          devices={audioInputDevices}
          selectedDevice={selectedAudioInput}
          onDeviceSelect={async (deviceId) => {
            setSelectedAudioInput(deviceId);
            if (cameraOn) await getMedia();
          }}
          onToggle={toggleMic}
          isEnabled={micOn}
          disabled={!cameraOn}
        />

        <DeviceControls
          icon={speakersOn ? Volume2 : VolumeOff}
          label="speaker"
          devices={audioOutputDevices}
          selectedDevice={selectedAudioOutput}
          onDeviceSelect={async (deviceId) => {
            setSelectedAudioOutput(deviceId);
            if (videoRef.current && 'setSinkId' in videoRef.current) {
              try {
                await (videoRef.current as any).setSinkId(deviceId);
              } catch (error) {
                toast.error(`Error setting audio output: ${parseError(error)}`);
              }
            }
          }}
          onToggle={toggleSpeakers}
          isEnabled={speakersOn}
        />
      </div>
    </div>
  );
};

export { WebcamStream };
