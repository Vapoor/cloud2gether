import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "../styles/Room.css";
import PlayerWidget from "../components/PlayerWidget";
import QueuePanel from "../components/QueuePanel";
import RightSidebar from "../components/RightSidebar";
import ConfirmModal from "../components/ConfirmModal";
import RoomCodeBadge from "../components/RoomCodeBadge";
import HomeButton from "../components/HomeButton";

const Room = () => {
  const { code } = useParams();

  // search/results
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  // server-synced state
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [basePositionMs, setBasePositionMs] = useState(0);
  const [updatedAtMs, setUpdatedAtMs] = useState(0);

  // UI
  const [volume, setVolume] = useState(50);
  const playerRef = useRef(null);

  const [user, setUser] = useState({ id: null, username: "", avatar_url: "" });
  const [members, setMembers] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null, onCancel: null });

  // sockets
  const socketRef = useRef(null);
  const serverTimeOffsetRef = useRef(0);

  const currentTrack = queue[currentIndex];

  // Load current user once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:3001/api/user", { credentials: "include" });
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled) return;
        setUser({
          id: d.user?.id ?? null,
          username: d.user?.username || " ",
          avatar_url: d.user?.avatar_url || d.user?.avatar_url_https || " "
        });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // socket join + state sync
  useEffect(() => {
    if (!code || !user?.id) return;
    if (socketRef.current) return;

    const socket = io("http://localhost:3001", { withCredentials: true });
    socketRef.current = socket;

    socket.on("members", setMembers);

    let t0 = 0;
    socket.on("connect", () => {
      const CODE = String(code).toUpperCase();
      socket.emit("joinRoom", { code: CODE, user: { id: user.id, username: user.username, avatar_url: user.avatar_url } });
      t0 = Date.now();
      socket.emit("room:request_state", CODE);
    });

    socket.on("room:state", ({ state, serverTimeMs }) => {
      if (serverTimeMs) {
        const rtt = Date.now() - (t0 || Date.now());
        serverTimeOffsetRef.current = Math.round((t0 + rtt / 2) - serverTimeMs);
        t0 = 0;
      }
      setQueue(state.queue || []);
      setCurrentIndex(state.currentIndex || 0);
      setIsPlaying(!!state.isPlaying);
      setBasePositionMs(state.basePositionMs || 0);
      setUpdatedAtMs(state.updatedAtMs || 0);
    });

    return () => {
      socket.emit("leaveRoom", String(code).toUpperCase());
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code, user]);

  // compute target position from base + elapsed (server clock)
  const targetPositionMs = (() => {
    const updatedAtOnClient = (updatedAtMs || 0) + serverTimeOffsetRef.current;
    const elapsed = Math.max(0, Date.now() - updatedAtOnClient);
    return isPlaying ? (basePositionMs || 0) + elapsed : (basePositionMs || 0);
  })();

  // search
  const handleSearch = async () => {
    if (!search.trim()) return setResults([]);
    const res = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(search)}`, { credentials: "include" });
    const data = await res.json();
    setResults(Array.isArray(data.collection) ? data.collection : []);
  };

  // queue ops
  const addToQueue = (track) => {
    socketRef.current?.emit("room:add", { code: String(code).toUpperCase(), track });
    setResults([]);
  };
  const requestRemove = (index) => {
    setConfirm({
      open: true,
      title: "Remove from queue?",
      message: "This will remove the track for everyone.",
      onConfirm: () => {
        socketRef.current?.emit("room:remove", { code: String(code).toUpperCase(), index });
        setConfirm({ open: false });
      },
      onCancel: () => setConfirm({ open: false }),
    });
  };
  const requestSkip = () => {
    socketRef.current?.emit("room:skip", { code: String(code).toUpperCase() });
  };


  const handleVolumeChange = (e) => {
    const v = Number(e.target.value) || 0;
    setVolume(v);
    playerRef.current?.setVolume(v); // uses widget.setVolume(v)
  };



  return (
    <div className="room-container three-col">
      {/* left queue */}
      <QueuePanel queue={queue} onRemove={requestRemove} onSkip={requestSkip} />

      <main className="main-panel">
        <div className="top-actions">
          <RoomCodeBadge code={code} />
          <HomeButton />
        </div>

        <section className={"search-section" + (results.length > 0 ? " results-open" : "")}>
          <div className="search-bar-container">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SoundCloud tracks..."
              className="search-input"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch} className="search-btn">Search</button>
          </div>
          {results.length > 0 && (
            <div className="results-dropdown">
              {results.slice(0, 20).map((track, idx) => (
                <div
                  key={track.urn || track.id || track.permalink_url || `r-${idx}`}
                  className="result-item"
                >
                  <img src={track.artwork_url} alt="" className="result-artwork" />
                  <div className="result-info">
                    <div className="result-title" title={track.title}>{track.title}</div>
                    <div className="result-artist">{track.user?.username}</div>
                  </div>
                  <button onClick={() => addToQueue(track)} className="add-btn" aria-label="Add to queue">+</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Custom audio player (in sync) */}
        {currentTrack && (
          <div className="widget-container">
            <PlayerWidget
              ref={playerRef}
              trackId={currentTrack.id}
              initialVolume={volume}
              onEnded={requestSkip}
            />
            <div className="volume-control">
              <span className="volume-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
              <span className="volume-value">{volume}%</span>
            </div>
          </div>
        )}
      </main>

      {/* right */}
      <RightSidebar user={user} playlists={playlists} members={members} />

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={confirm.onCancel}
      />
    </div>
  );
};

export default Room;