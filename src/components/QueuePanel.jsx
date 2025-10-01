import "../styles/QueuePanel.css";

export default function QueuePanel({ queue, onRemove, onSkip }) {
  return (
    <aside className="queue-panel">
      <h2 className="panel-title">Queue</h2>
      <div className="queue-container">
        {queue.length === 0 && <div className="queue-empty">Queue is empty</div>}
        {queue.map((track, idx) => (
          <div
            key={track.entryId || track.urn || track.id || `q-${idx}`}
            className="queue-item"
          >
            <img src={track.artwork_url} alt="" className="queue-artwork" />
            <div className="queue-meta">
              <div className="queue-title" title={track.title}>{track.title}</div>
              <div className="queue-artist">
                {track.user?.username}
                {track.addedBy?.username ? ` • added by ${track.addedBy.username}` : ""}
              </div>
            </div>
            <div className="queue-actions">
              {track.addedBy?.avatar_url && (
                <img
                  src={track.addedBy.avatar_url}
                  alt=""
                  className="addedby-avatar"
                  title={`Added by ${track.addedBy.username || "Unknown"}`}
                />
              )}
              <button onClick={() => onRemove(idx)} className="remove-btn" aria-label="Remove">×</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onSkip} disabled={queue.length === 0} className="skip-btn">Skip</button>
    </aside>
  );
}