import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    const res = await fetch("http://localhost:3001/api/room/create", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    navigate(`/room/${data.code}`);
  };

  const handleJoinRoom = async () => {
    if (roomCode.length !== 5) {
      setError("Code must be 5 characters.");
      return;
    }
    const res = await fetch(
      `http://localhost:3001/api/room/join?code=${roomCode}`,
      {
        credentials: "include",
      }
    );
    const data = await res.json();
    if (data.exists) {
      navigate(`/room/${roomCode}`);
    } else {
      setError("Room does not exist.");
    }
  };

  return (
    <div>
      <h1>Lobby Page</h1>
      <button onClick={handleCreateRoom}>Create Lobby</button>
      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          maxLength={5}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter 5-char code"
        />
        <button onClick={handleJoinRoom}>Join</button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Lobby;