import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';

const server_url = server;
const peerConfigConnections = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function VideoMeetComponent() {
    const socketRef = useRef(); const socketIdRef = useRef(); const localVideoref = useRef();
    const connectionsRef = useRef({}); const iceCandidateQueueRef = useRef({});
    const remoteVideoRefs = useRef({});
    const renderedStreamIds = useRef(new Set()); // deduplicate by stream.id

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true); const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false); const [showModal, setModal] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]); const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true); const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]);

    useEffect(() => { getPermissions(); }, []);

    const getPermissions = async () => {
        try {
            const v = await navigator.mediaDevices.getUserMedia({ video: true });
            if (v) { setVideoAvailable(true); v.getTracks().forEach(t => t.stop()); }
            const a = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (a) { setAudioAvailable(true); a.getTracks().forEach(t => t.stop()); }
            if (navigator.mediaDevices.getDisplayMedia) setScreenAvailable(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            window.localStream = stream;
            if (localVideoref.current) localVideoref.current.srcObject = stream;
        } catch (e) { console.log("Permission error:", e); }
    };

    const createPeerConnection = (id) => {
        if (connectionsRef.current[id]) return connectionsRef.current[id];
        const pc = new RTCPeerConnection(peerConfigConnections);
        connectionsRef.current[id] = pc;
        iceCandidateQueueRef.current[id] = [];

        pc.onicecandidate = (e) => {
            if (e.candidate) socketRef.current.emit('signal', id, JSON.stringify({ ice: e.candidate }));
        };

        pc.ontrack = (event) => {
            // KEY FIX: only handle video tracks — audio fires ontrack too but needs no video box
            if (event.track.kind !== 'video') return;
            const stream = event.streams[0];
            if (!stream) return;

            // Update ref directly (handles screen share swap without adding new box)
            if (remoteVideoRefs.current[id]) remoteVideoRefs.current[id].srcObject = stream;

            // Only add a new video box if this stream hasn't been shown yet
            if (!renderedStreamIds.current.has(stream.id)) {
                renderedStreamIds.current.add(stream.id);
                setVideos(prev => {
                    const filtered = prev.filter(v => v.socketId !== id);
                    return [...filtered, { socketId: id, stream }];
                });
            }
        };

        if (window.localStream) window.localStream.getTracks().forEach(t => pc.addTrack(t, window.localStream));
        return pc;
    };

    const gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if (fromId === socketIdRef.current) return;
        const pc = createPeerConnection(fromId);

        if (signal.sdp) {
            const okAnswer = pc.signalingState === 'have-local-offer' && signal.sdp.type === 'answer';
            const okOffer = pc.signalingState === 'stable' && signal.sdp.type === 'offer';
            if (!okAnswer && !okOffer) return;

            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                (iceCandidateQueueRef.current[fromId] || []).forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}));
                iceCandidateQueueRef.current[fromId] = [];
                if (signal.sdp.type === 'offer' && pc.signalingState === 'have-remote-offer') {
                    pc.createAnswer().then(d => pc.setLocalDescription(d).then(() =>
                        socketRef.current.emit('signal', fromId, JSON.stringify({ sdp: pc.localDescription }))));
                }
            }).catch(e => console.log("SDP error:", e));
        }

        if (signal.ice) {
            if (pc.remoteDescription?.type) pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(() => {});
            else { if (!iceCandidateQueueRef.current[fromId]) iceCandidateQueueRef.current[fromId] = []; iceCandidateQueueRef.current[fromId].push(signal.ice); }
        }
    };

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });
        socketRef.current.on('signal', gotMessageFromServer);
        socketRef.current.on('connect', () => {
            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit('join-call', window.location.href);
            socketRef.current.on('chat-message', addMessage);
            socketRef.current.on('user-joined', (newUserId, allUsers) => {
                if (newUserId !== socketIdRef.current) {
                    if (!connectionsRef.current[newUserId]) {
                        const pc = createPeerConnection(newUserId);
                        pc.createOffer().then(d => pc.setLocalDescription(d).then(() =>
                            socketRef.current.emit('signal', newUserId, JSON.stringify({ sdp: pc.localDescription }))
                        )).catch(e => console.log("Offer error:", e));
                    }
                } else {
                    allUsers.forEach(id => { if (id !== socketIdRef.current) createPeerConnection(id); });
                }
            });
            socketRef.current.on('user-left', (id) => {
                setVideos(prev => { 
                    const entry = prev.find(v => v.socketId === id);
                    if (entry) renderedStreamIds.current.delete(entry.stream.id);
                    return prev.filter(v => v.socketId !== id);
                });
                delete remoteVideoRefs.current[id];
                if (connectionsRef.current[id]) { connectionsRef.current[id].close(); delete connectionsRef.current[id]; delete iceCandidateQueueRef.current[id]; }
            });
        });
    };

    const handleVideo = () => { const v = !video; setVideo(v); window.localStream?.getVideoTracks().forEach(t => t.enabled = v); };
    const handleAudio = () => { const a = !audio; setAudio(a); window.localStream?.getAudioTracks().forEach(t => t.enabled = a); };

    const handleScreen = async () => {
        if (!screen) {
            try {
                const ss = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const st = ss.getTracks()[0];
                for (let id in connectionsRef.current) { const s = connectionsRef.current[id].getSenders().find(s => s.track?.kind === 'video'); if (s) s.replaceTrack(st); }
                localVideoref.current.srcObject = ss; window.localStream = ss;
                st.onended = stopScreenShare; setScreen(true);
            } catch (e) { console.log(e); }
        } else stopScreenShare();
    };

    const stopScreenShare = async () => {
        try {
            const cs = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            cs.getVideoTracks().forEach(t => t.enabled = video); cs.getAudioTracks().forEach(t => t.enabled = audio);
            const ct = cs.getTracks().find(t => t.kind === 'video');
            for (let id in connectionsRef.current) { const s = connectionsRef.current[id].getSenders().find(s => s.track?.kind === 'video'); if (s) s.replaceTrack(ct); }
            window.localStream = cs; localVideoref.current.srcObject = cs; setScreen(false);
        } catch (e) { console.log(e); }
    };

    const handleEndCall = () => {
        try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()); } catch (e) {}
        for (let id in connectionsRef.current) connectionsRef.current[id].close();
        connectionsRef.current = {}; iceCandidateQueueRef.current = {}; renderedStreamIds.current.clear();
        socketRef.current?.disconnect();
        window.location.href = "/";
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages(prev => [...prev, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) setNewMessages(prev => prev + 1);
    };
    const sendMessage = () => { if (!message.trim()) return; socketRef.current.emit('chat-message', message, username); setMessage(""); };
    const connect = () => {
        if (!username.trim()) { alert("Enter username first"); return; }
        setAskForUsername(false);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            window.localStream = stream;
            if (localVideoref.current) localVideoref.current.srcObject = stream;
            connectToSocketServer();
        }).catch(e => console.log(e));
    };

    return (
        <div>
            {askForUsername ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h2>Enter into Lobby</h2>
                    <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && connect()} />
                    <Button variant="contained" onClick={connect} style={{ marginLeft: 10, height: 56 }}>Connect</Button>
                    <div style={{ marginTop: 20 }}><video ref={localVideoref} autoPlay muted style={{ width: 300, borderRadius: 10 }} /></div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    <div className={styles.conferenceView}>
                        {videos.length === 0
                            ? <div className={styles.waitingMessage}><p>⏳ Waiting for others to join...</p></div>
                            : videos.map(vi => (
                                <div key={vi.socketId} className={styles.remoteVideoWrapper}>
                                    <div className={styles.remoteLabel}>👤 Remote User</div>
                                    <video ref={ref => { if (ref) { remoteVideoRefs.current[vi.socketId] = ref; if (vi.stream) ref.srcObject = vi.stream; } }} autoPlay className={styles.remoteVideo} />
                                </div>
                            ))
                        }
                    </div>

                    {showModal && (
                        <div className={styles.chatRoom}>
                            <h1>Chat</h1>
                            <div style={{ overflowY: 'auto', maxHeight: '70vh' }}>
                                {messages.map((item, i) => (
                                    <div key={i} style={{ textAlign: item.sender === username ? 'right' : 'left', margin: '6px 0' }}>
                                        <span style={{ display: 'inline-block', background: item.sender === username ? '#1976d2' : '#e0e0e0', color: item.sender === username ? 'white' : 'black', borderRadius: 10, padding: '6px 12px', maxWidth: '80%' }}>
                                            <b style={{ display: 'block', fontSize: 11 }}>{item.sender}</b>{item.data}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.chattingArea}>
                                <TextField value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} label="Enter chat" fullWidth />
                                <Button onClick={sendMessage} variant="contained" fullWidth>Send</Button>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: video ? "white" : "red" }}>{video ? <VideocamIcon /> : <VideocamOffIcon />}</IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}><CallEndIcon /></IconButton>
                        <IconButton onClick={handleAudio} style={{ color: audio ? "white" : "red" }}>{audio ? <MicIcon /> : <MicOffIcon />}</IconButton>
                        {screenAvailable && <IconButton onClick={handleScreen} style={{ color: screen ? "#4caf50" : "white" }}>{screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}</IconButton>}
                        <Badge badgeContent={newMessages} max={999} color="warning">
                            <IconButton onClick={() => { setModal(!showModal); setNewMessages(0); }} style={{ color: "white" }}><ChatIcon /></IconButton>
                        </Badge>
                    </div>

                    <div className={styles.localVideoWrapper}>
                        <div className={styles.localLabel}>🟢 You ({username})</div>
                        <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted />
                        {!video && <div style={{ position: 'absolute', top: 22, left: 0, width: '100%', height: 'calc(100% - 22px)', background: '#1a1a2e', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13 }}>📷 Camera Off</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
