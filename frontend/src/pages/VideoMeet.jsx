import React, { useEffect, useRef, useState } from "react";
import { Badge, IconButton, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import { io } from "socket.io-client";
import "../styles/videoComponent.css";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import { useNavigate, useParams } from "react-router-dom";
import server from "../environment";

const server_url = server;
var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const { url } = useParams();
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(true);
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showModel, setModel] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]);

  const getPermissions = async () => {
    let hasVideo = false;
    let hasAudio = false;

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      s.getTracks().forEach((t) => t.stop());

      hasVideo = true;
    } catch (e) {
      console.log("Camera not available:", e);
    }

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      s.getTracks().forEach((t) => t.stop());

      hasAudio = true;
    } catch (e) {
      console.log("Microphone not available:", e);
    }

    setVideoAvailable(hasVideo);
    setAudioAvailable(hasAudio);

    setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

    if (hasVideo || hasAudio) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: hasVideo,
        audio: hasAudio,
      });

      window.localStream = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          //TODO Blacksilence
          let blackSlience = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSlience();
          localVideoRef.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }),
    );
  };

  let silence = () => {
    let ctx = new AudioContext();

    let oscillator = ctx.createOscillator();

    let dst = oscillator.connect(ctx.createMediaStreamDestination());

    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });

    canvas.getContext("2d").fillRect(0, 0, width, height);

    let stream = canvas.captureStream();

    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then((stream) => {
          getUserMediaSuccess(stream);
        })
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };
  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  //todo
  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("chat-message", addMessage);

    socketRef.current.on("user-left", (id) => {
      setVideos((videos) => videos.filter((video) => video.socketId !== id));
    });

    socketRef.current.on("user-joined", (id, clients) => {
      clients.forEach((socketListId) => {
        if (socketListId === socketIdRef.current) return;

        if (connections[socketListId]) return;
        connections[socketListId] = new RTCPeerConnection(
          peerConfigConnections,
        );

        connections[socketListId].onicecandidate = (event) => {
          if (event.candidate != null) {
            socketRef.current.emit(
              "signal",
              socketListId,
              JSON.stringify({ ice: event.candidate }),
            );
          }
        };

        connections[socketListId].onaddstream = (event) => {
          let videoExists = videoRef.current.find(
            (video) => video.socketId === socketListId,
          );

          if (videoExists) {
            setVideos((videos) => {
              const updatedVideos = videos.map((video) =>
                video.socketId === socketListId
                  ? { ...video, stream: event.stream }
                  : video,
              );

              videoRef.current = updatedVideos;

              return updatedVideos;
            });
          } else {
            let newVideo = {
              socketId: socketListId,
              stream: event.stream,
              autoPlay: true,
              playsinline: true,
            };

            setVideos((videos) => {
              const updatedVideos = [...videos, newVideo];

              videoRef.current = updatedVideos;

              return updatedVideos;
            });
          }
        };

        if (window.localStream !== undefined && window.localStream !== null) {
          connections[socketListId].addStream(window.localStream);
        } else {
          //todo blackslience
          //let blackSlience

          let blackSlience = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSlience();
          connections[socketListId].addStream(window.localStream);
        }
      });

      if (id === socketIdRef.current) {
        for (let id2 in connections) {
          if (id2 === socketIdRef.current) continue;

          try {
            connections[id2].addStream(window.localStream);
          } catch (e) {}
          connections[id2].createOffer().then((description) => {
            connections[id2]
              .setLocalDescription(description)
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  id2,
                  JSON.stringify({ sdp: connections[id2].localDescription }),
                );
              })
              .catch((e) => console.log(e));
          });
        }
      }
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", url);

      socketIdRef.current = socketRef.current.id;
    });
  };
  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let routeTo = useNavigate();

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
  };

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => [
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e)),
      ]);
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          //TODO Blacksilence
          let blackSlience = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSlience();
          localVideoRef.current.srcObject = window.localStream;

          getUserMedia();
        }),
    );
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let sendMessage = () => {
    if (message.trim() === "") return;
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  const cleanupCall = () => {
    try {
      localVideoRef.current?.srcObject
        ?.getTracks()
        .forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    Object.values(connections).forEach((pc) => pc.close());

    connections = {};

    socketRef.current?.disconnect();
  };
  let handleEndCall = () => {
    cleanupCall();
    routeTo("/home");
  };
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, []);

  return (
    <div>
      {askForUsername === true ? (
        <div>
          <h2>Enter into Lobby</h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            variant="outlined"
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button variant="contained" onClick={connect}>
            Connect
          </Button>
          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <div className="meetVideoContainer">
          {showModel ? (
            <div className="chatRoom">
              <div className="chatContainer">
                <h1>Chat</h1>
                <div className="chattingDisplay">
                  {messages.length > 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div style={{ marginBottom: "15px" }} key={index}>
                          <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>
                <div className="chattingArea">
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                    id="outlined-basic"
                    label="Type a message"
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}
          <div className="buttonContainer">
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton
                onClick={() => {
                  setModel(!showModel);
                  setNewMessages(0);
                }}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>
          <video
            className="meetUserVideo"
            ref={localVideoRef}
            autoPlay
            muted
          ></video>
          <div className="conferenceView">
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
