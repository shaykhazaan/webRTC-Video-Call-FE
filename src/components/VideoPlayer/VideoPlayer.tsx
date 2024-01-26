import React, { useEffect, useMemo, useRef, useState } from "react";
import Peer from "peerjs";
import { CopyToClipboard } from "react-copy-to-clipboard";

const VideoCallComponent: React.FC = () => {
  const [user2PeerId, setUser2PeerId] = useState<string>("");
  const [calling, setCalling] = useState<boolean>(false);
  const [me, setMe] = useState("");
  const [copied, setCopied] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peer = useMemo(() => new Peer(), []);
  // Define initiateCall outside of useEffect
  const initiateCall = async () => {
    if (!user2PeerId) {
      alert("Please enter User 2's Peer ID.");
      return;
    }

    setCalling(true);

    const call = peerRef.current?.call(
      user2PeerId,
      localVideoRef.current!.srcObject as MediaStream
    );

    // User 1 handles the stream from the call
    call?.on("stream", (remoteStream) => {
      remoteVideoRef.current!.srcObject = remoteStream;
    });

    call?.on("close", () => {
      setCalling(false);
    });
  };

  useEffect(() => {
    peer.on("open", (peerId): void => {
      setMe(peerId);
      console.log("My peer ID is: " + peerId);
    });
  }, [peer]);

  useEffect(() => {
    const initWebRTC = async () => {
      peerRef.current = peer;

      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current!.srcObject = localStream;

      // User 2 answers incoming calls
      peer.on("call", (incomingCall) => {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((user2LocalStream) => {
            // Display the local stream in the local video element
            localVideoRef.current!.srcObject = user2LocalStream;

            // Answer the call with the local stream
            incomingCall.answer(user2LocalStream);

            // User 2 handles the stream from the incoming call
            incomingCall.on("stream", (user1RemoteStream) => {
              remoteVideoRef.current!.srcObject = user1RemoteStream;
            });

            incomingCall.on("close", () => {
              setCalling(false);
            });
          })
          .catch((error) => {
            console.error("Error accessing media devices:", error);
          });
      });

      // Cleanup on component unmount
      return () => {
        if (peerRef.current) {
          peerRef.current.destroy();
        }
      };
    };

    initWebRTC();
  }, [peer, user2PeerId]);

  return (
    <div>
      <h1>WebRTC Video Call</h1>
      <div>
        <h2>User 1 (Caller)</h2>
        <video ref={localVideoRef} autoPlay playsInline muted />
        <p>{me}</p>
        <CopyToClipboard
          text={me}
          onCopy={() => {
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 5000);
          }}
        >
          <button>Copy</button>
        </CopyToClipboard>
        {copied && (
          <span style={{ color: copied ? "green" : "" }}>Copied!</span>
        )}
      </div>
      <div>
        <h2>User 2 (Receiver)</h2>
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
      <div>
        <input
          type="text"
          placeholder="Enter User 2's Peer ID"
          value={user2PeerId}
          style={{ width: "60%" }}
          onChange={(e) => setUser2PeerId(e.target.value)}
        />
        <button onClick={initiateCall} disabled={calling}>
          {calling ? "Calling..." : "Call"}
        </button>
      </div>
    </div>
  );
};

export default VideoCallComponent;
