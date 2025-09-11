import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

// Connect to backend
const socket = io("http://localhost:3001");

function App() {
  const [roomId] = useState("demo-room"); // fixed room for testing
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const iframeRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    socket.emit("joinRoom", { roomId });

    socket.on("queueUpdate", (room) => {
      setQueue(room.queue);
      setCurrentIndex(room.currentIndex);
    });

    return () => {
      socket.off("queueUpdate");
    };
  }, [roomId]);

  useEffect(() => {
    if (iframeRef.current && window.SC) {
      widgetRef.current = window.SC.Widget(iframeRef.current);

      // When track finishes, tell backend to move to next
      widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
        socket.emit("nextTrack", { roomId });
      });
    }
  }, [queue, currentIndex]);

  const addDummyTrack = () => {
    // In real app you'd search SoundCloud API, here we hardcode a track ID
    const track = {
      id: "123456789", // replace with a real SoundCloud track ID
      title: "Example Track",
    };
    socket.emit("addTrack", { roomId, track });
  };

  const currentTrack = queue[currentIndex];

  return (
    <div style={{ padding: 20 }}>
      <h1>Listen Together Room: {roomId}</h1>

      <button onClick={addDummyTrack}>Add Dummy Track</button>

      <h2>Queue</h2>
      <ul>
        {queue.map((t, i) => (
          <li key={t.id}>
            {i === currentIndex ? <b>{t.title}</b> : t.title}
          </li>
        ))}
      </ul>

      {currentTrack && (
        <iframe
          id="sc-widget"
          ref={iframeRef}
          width="100%"
          height="166"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${currentTrack.id}&auto_play=true`}
        />
      )}
    </div>
  );
}

export default App;
