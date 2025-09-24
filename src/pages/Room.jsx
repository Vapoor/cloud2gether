import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import "../styles/Room.css";

const Room = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [queue, setQueue] = useState([]);
  const [volume, setVolume] = useState(50);

  const [user, setUser] = useState({});
  const [playlists, setPlaylists] = useState([]);
  const [members, setMembers] = useState([]);

  const iframeRef = useRef(null);
  const widgetRef = useRef(null);
  const socketRef = useRef(null);
  const rpcSocketRef = useRef(null);
  const { code } = useParams();

  // Load SoundCloud widget API
  useEffect(() => {
    if (window.SC && window.SC.Widget) return;
    const s = document.createElement("script");
    s.src = "https://w.soundcloud.com/player/api.js";
    s.onload = initWidget;
    document.body.appendChild(s);
  }, []);

  // Re-init when first track changes
  useEffect(() => {
    initWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length > 0 ? queue[0].id : null]);

  // User + playlists
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3001/api/user", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setUser({
          id: data.user.id,
          username: data.user.username,
          avatar_url:
            data.user.avatar_url ||
            data.user.avatar_url_https ||
            "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png",
        });
        setPlaylists(
          data.playlists.map((p) => ({
            id: p.id,
            title: p.title || "Untitled",
          }))
        );
      } catch (e) {
        console.warn("User load failed", e);
      }
    })();
  }, []);

  // Room socket (members)
  useEffect(() => {
    if (!code || !user?.id) return;
    if (socketRef.current) return;
    const socket = io("http://localhost:3001", { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinRoom", {
        code,
        user: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
        },
      });
    });

    socket.on("members", (list) => setMembers(list));

    return () => {
      socket.emit("leaveRoom", code);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code, user]);

  // Local RPC helper (Discord)
  useEffect(() => {
    const s = io("http://localhost:5000", { transports: ["websocket"] });
    s.on("connect", () => console.log("[RPC] connected"));
    s.on("presenceAck", (a) => console.log("[RPC] ack", a));
    s.on("connect_error", () => console.log("[RPC] helper not running"));
    rpcSocketRef.current = s;
    return () => s.disconnect();
  }, []);

  const sendPresence = (track) => {
    if (!rpcSocketRef.current || !rpcSocketRef.current.connected) return;
    if (!track) return rpcSocketRef.current.emit("clearPresence");
    rpcSocketRef.current.emit("updatePresence", {
      title: track.title,
      artist: track.user?.username,
      room: code,
    });
  };

  // Presence on current track change
  useEffect(() => {
    if (queue.length > 0) sendPresence(queue[0]);
    else sendPresence(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length > 0 ? queue[0].id : null]);

  const skipTrack = () => {
    if (!queue.length) return;
    const skipped = queue[0];
    setRecentTracks((prev) => {
        const next = [skipped, ...prev.filter((t) => t.id !== skipped.id)];
        return next.slice(0, 5);
      });
    setQueue((prev) => prev.slice(1));
    setTimeout(() => {
      if (queue.length > 1) sendPresence(queue[1]);
    }, 0);
  };

  const initWidget = () => {
    if (!iframeRef.current || !(window.SC && window.SC.Widget)) return;
    widgetRef.current = window.SC.Widget(iframeRef.current);
    widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
      widgetRef.current.setVolume(volume);
    });
    widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
      advanceAfterFinish();
    });
  };

  const advanceAfterFinish = () => {
    if (!queue.length) return;
    const finished = queue[0];
    setRecentTracks((prev) => {
      const next = [finished, ...prev.filter((t) => t.id !== finished.id)];
      return next.slice(0, 5);
    });
    setQueue((prev) => prev.slice(1));
  };

  const handleSearch = async () => {
    if (!search.trim()) return setResults([]);
    const res = await fetch(
      `http://localhost:3001/api/search?q=${encodeURIComponent(search)}`,
      { credentials: "include" }
    );
    const data = await res.json();
    setResults(Array.isArray(data.collection) ? data.collection : []);
  };

  const addToQueue = (track) => {
    setQueue((prev) => [...prev, track]);
    setResults([]);
  };

  const removeFromQueue = (idx) => {
    setQueue((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVolumeChange = (e) => {
    const v = parseInt(e.target.value, 10);
    setVolume(v);
    widgetRef.current?.setVolume(v);
  };

  return (
    <div className="room-container three-col">
      <aside className="queue-panel">
        <h2 className="panel-title">Queue</h2>
        <div className="queue-container">
          {queue.length === 0 && <div className="queue-empty">Queue is empty</div>}
          {queue.map((track, idx) => (
            <div key={track.id + "-" + idx} className="queue-item">
              <img src={track.artwork_url} alt="" className="queue-artwork" />
              <div className="queue-meta">
                <div className="queue-title" title={track.title}>
                  {track.title}
                </div>
                <div className="queue-artist">{track.user?.username}</div>
              </div>
              <button
                onClick={() => removeFromQueue(idx)}
                className="remove-btn"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button onClick={skipTrack} disabled={queue.length === 0} className="skip-btn">
          Skip
        </button>
      </aside>

      <main className="main-panel">
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
            <button onClick={handleSearch} className="search-btn">
              Search
            </button>
          </div>
          {results.length > 0 && (
            <div className="results-dropdown">
              {results.slice(0, 20).map((track, idx) => (
                <div key={track.id + "-" + idx} className="result-item">
                  <img src={track.artwork_url} alt="" className="result-artwork" />
                  <div className="result-info">
                    <div className="result-title" title={track.title}>
                      {track.title}
                    </div>
                    <div className="result-artist">{track.user?.username}</div>
                  </div>
                  <button
                    onClick={() => addToQueue(track)}
                    className="add-btn"
                    aria-label="Add to queue"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {queue.length > 0 && (
          <div className="widget-container">
            <iframe
              ref={iframeRef}
              className="widget-iframe"
              scrolling="no"
              allow="autoplay"
              src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${queue[0].id}&auto_play=true&color=%23999999&buying=false&single_active=false`}
              title="SoundCloud Player"
            ></iframe>
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
            <div className="volume-hint">Use slider to adjust volume</div>
          </div>
        )}

        <section className="recent-section">
          <h3 className="recent-title">Recent (last 5)</h3>
          <div className="recent-list">
            {recentTracks.map((track, idx) => (
              <div key={track.id + "-recent-" + idx} className="recent-track">
                <img src={track.artwork_url} alt="" className="recent-artwork" />
                <div className="recent-meta">
                  <div className="recent-track-title" title={track.title}>
                    {track.title}
                  </div>
                  <div className="recent-artist">{track.user?.username}</div>
                </div>
                <button
                  className="add-btn recent-add"
                  onClick={() => addToQueue(track)}
                  aria-label="Re-add to queue"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <aside className="right-panel">
        <div className="user-box">
          <img src={user.avatar_url} alt="" className="user-avatar" />
          <div className="user-meta">
            <div className="user-name" title={user.username}>
              {user.username}
            </div>
            <div className="user-status">Online</div>
          </div>
        </div>

        <div className="playlist-box">
          <h4 className="sidebar-subtitle">Playlists</h4>
          <ul className="playlist-list">
            {playlists.map((p) => (
              <li key={p.id} className="playlist-item">
                <span className="playlist-title" title={p.title}>
                  {p.title}
                </span>
                <button className="playlist-add-btn" aria-label="Add playlist">
                  +
                </button>
              </li>
            ))}
          </ul>
          <div className="playlist-hint">Playlist queue coming soon.</div>
        </div>

        <div className="members-box">
          <h4 className="sidebar-subtitle">Members</h4>
            <div className="members-list">
              {members.map((m) => (
                <div key={m.id} className="member-row">
                  <img src={m.avatar_url} alt="" className="member-avatar" />
                  <span className="member-name" title={m.username}>
                    {m.username}
                  </span>
                </div>
              ))}
            </div>
        </div>
      </aside>
    </div>
  );
};

export default Room;