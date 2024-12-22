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
import type Peer from 'simple-peer';
import { toast } from 'sonner';

import { StreamServiceMsg } from '@common/types/message';
import type { User } from '@common/types/user';

import { storage } from '@/lib/services/storage';
import { userMap } from '@/lib/services/user-map';
import { getSocket } from '@/lib/socket';
import { parseError } from '@/lib/utils';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';

import { DeviceControls } from './components/device-controls';
import { VideoControls } from './components/video-controls';
import type { MediaDevice } from './types';
import {
  rotateCamera,
  toggleCamera,
  toggleMic,
  toggleSpeaker,
} from './utils/controls';
import {
  enumerateDevices,
  handleDevicePermissionGranted,
  initDevices,
} from './utils/device';
import { getMedia } from './utils/media';
import { cleanupPeer, createPeer, handleSignal } from './utils/peer';

interface WebcamStreamProps {
  users: User[];
}

const WebcamStream = ({ users }: WebcamStreamProps) => {
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [hasRequestedPermissions, setHasRequestedPermissions] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream | null>
  >({});
  const [remoteMicStates, setRemoteMicStates] = useState<
    Record<string, boolean>
  >({});
  const [remoteSpeakerStates, setRemoteSpeakerStates] = useState<
    Record<string, boolean>
  >({});

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
  const peersRef = useRef<Record<string, Peer.Instance>>({});
  const pendingSignalsRef = useRef<Record<string, any[]>>({});

  // Request permissions on mount
  useEffect(() => {
    const requestInitialPermissions = async () => {
      if (hasRequestedPermissions) return;

      try {
        // Instead of getUserMedia, use enumerateDevices first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasLabels = devices.some((device) => device.label !== '');

        // Only request permissions if we don't have them yet
        if (!hasLabels) {
          // Request with minimal constraints to avoid unnecessary device activation
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }, // minimal constraint
            audio: true,
          });
          // Stop the temporary stream immediately
          stream.getTracks().forEach((track) => track.stop());
        }

        // Update device lists after permissions
        await enumerateDevices(
          setVideoDevices,
          setAudioInputDevices,
          setAudioOutputDevices,
          selectedVideoDevice,
          setSelectedVideoDevice,
          selectedAudioInput,
          setSelectedAudioInput,
          selectedAudioOutput,
          setSelectedAudioOutput,
        );

        setHasRequestedPermissions(true);
      } catch (error) {
        console.warn('Initial permission request failed:', error);
        // Don't show error toast here as it might be intrusive
      }
    };

    requestInitialPermissions();
  }, [
    hasRequestedPermissions,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoDevice,
  ]);

  const handleGetMedia = useCallback(async () => {
    return getMedia(
      selectedVideoDevice,
      selectedAudioInput,
      selectedAudioOutput,
      cameraFacingMode,
      micOn,
      streamRef,
      videoRef,
      peersRef,
      setRemoteStreams,
      pendingSignalsRef,
    );
  }, [
    selectedVideoDevice,
    selectedAudioInput,
    selectedAudioOutput,
    cameraFacingMode,
    micOn,
  ]);

  // Initialize device enumeration
  useEffect(() => {
    const handleDeviceChange = async () => {
      await enumerateDevices(
        setVideoDevices,
        setAudioInputDevices,
        setAudioOutputDevices,
        selectedVideoDevice,
        setSelectedVideoDevice,
        selectedAudioInput,
        setSelectedAudioInput,
        selectedAudioOutput,
        setSelectedAudioOutput,
      );
    };

    initDevices(handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        handleDeviceChange,
      );
    };
  }, [selectedVideoDevice, selectedAudioInput, selectedAudioOutput]);

  // Handle socket events
  useEffect(() => {
    // Only emit stream ready after permissions are requested
    if (hasRequestedPermissions) {
      socket.emit(StreamServiceMsg.STREAM_READY);
    }

    socket.emit(StreamServiceMsg.SPEAKER_STATE, true);

    socket.on(StreamServiceMsg.USER_READY, (userID: string) => {
      if (hasRequestedPermissions) {
        createPeer(
          userID,
          true,
          streamRef,
          peersRef,
          setRemoteStreams,
          pendingSignalsRef,
        );
        socket.emit(StreamServiceMsg.SPEAKER_STATE, speakerOn);
      }
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
        if (hasRequestedPermissions) {
          handleSignal(
            signal,
            userID,
            streamRef,
            peersRef,
            setRemoteStreams,
            pendingSignalsRef,
          );
        }
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
        streamRef.current = null;
      }

      Object.keys(currentPeers).forEach((userID) => {
        cleanupPeer(userID, peersRef, setRemoteStreams);
      });

      setCameraOn(false);
      setMicOn(false);

      socket.emit(StreamServiceMsg.CAMERA_OFF);
    };
  }, [socket, speakerOn, hasRequestedPermissions]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
      socket.emit(StreamServiceMsg.CAMERA_OFF);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [socket]);

  return (
    <div className="relative flex h-full flex-col bg-[color:var(--panel-background)] p-2">
      <div
        className="grid auto-rows-[1fr] gap-2 overflow-y-auto"
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
                  showTooltip={false}
                />
              </div>
            )}
            <VideoControls
              isLocal={true}
              userId={storage.getUserId() ?? ''}
              micOn={micOn}
              speakersOn={speakerOn}
              remoteMicStates={remoteMicStates}
              remoteSpeakerStates={remoteSpeakerStates}
            />
            <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded bg-black/50 px-2 py-1 text-sm text-white">
              {userMap.get(storage.getUserId() ?? '')} (you)
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
                    muted={!speakerOn}
                    className="size-full scale-x-[-1] rounded-lg object-cover"
                    ref={(element) => {
                      if (element) element.srcObject = remoteStreams[user.id];
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar user={user} size="lg" showTooltip={false} />
                  </div>
                )}
                <VideoControls
                  isLocal={false}
                  userId={user.id}
                  micOn={micOn}
                  speakersOn={speakerOn}
                  remoteMicStates={remoteMicStates}
                  remoteSpeakerStates={remoteSpeakerStates}
                />
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
              if (cameraOn) await handleGetMedia();
            }}
            onToggle={() =>
              toggleCamera(
                cameraOn,
                setCameraOn,
                setMicOn,
                streamRef,
                videoRef,
                handleGetMedia,
              )
            }
            isEnabled={cameraOn}
            onDevicePermissionGranted={async () => {
              await enumerateDevices(
                setVideoDevices,
                setAudioInputDevices,
                setAudioOutputDevices,
                selectedVideoDevice,
                setSelectedVideoDevice,
                selectedAudioInput,
                setSelectedAudioInput,
                selectedAudioOutput,
                setSelectedAudioOutput,
              );
            }}
          />

          {isMobile && cameraOn && (
            <Button
              onClick={() =>
                rotateCamera(
                  cameraOn,
                  cameraFacingMode,
                  setCameraFacingMode,
                  streamRef,
                  handleGetMedia,
                )
              }
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
            if (streamRef.current) {
              await handleGetMedia();
            }
          }}
          onToggle={() => toggleMic(micOn, setMicOn, streamRef)}
          isEnabled={micOn}
          disableToggle={!cameraOn}
          onDevicePermissionGranted={async (kind) => {
            await handleDevicePermissionGranted(
              kind,
              setVideoDevices,
              setAudioInputDevices,
              setAudioOutputDevices,
            );
          }}
        />

        <DeviceControls
          icon={speakerOn ? Volume2 : VolumeOff}
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
          onToggle={() => toggleSpeaker(speakerOn, setSpeakerOn)}
          isEnabled={speakerOn}
          onDevicePermissionGranted={async (kind) => {
            await handleDevicePermissionGranted(
              kind,
              setVideoDevices,
              setAudioInputDevices,
              setAudioOutputDevices,
            );
          }}
        />
      </div>
    </div>
  );
};

export { WebcamStream };
