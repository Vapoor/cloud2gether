import { useState } from "react";
import "../styles/RoomCodeBadge.css";

export default function RoomCodeBadge({ code }) {
  if (!code) return null;
  const [copied, setCopied] = useState(false);
  const upper = String(code).toUpperCase();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(upper);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      window.prompt("Copy room code:", upper);
    }
  };

  return (
    <div className="roomcode-wrap" role="group" aria-label="Room code">
      <div className="roomcode-code" title="Room code">{upper}</div>
      <button className="roomcode-copy" onClick={copy} aria-label="Copy room code">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}