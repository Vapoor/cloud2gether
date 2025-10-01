import "../styles/RightSidebar.css";

export default function RightSidebar({ user = {}, playlists = [], members = [] }) {
  return (
    <aside className="right-panel">
      <div className="user-box">
        <img src={user?.avatar_url} alt="" className="user-avatar" />
        <div className="user-meta">
          <div className="user-name" title={user?.username}>{user?.username || ""}</div>
          <div className="user-status">Online</div>
        </div>
      </div>

      <div className="playlist-box">
        <h4 className="sidebar-subtitle">Playlists</h4>
        <ul className="playlist-list">
          {playlists.map((p) => (
            <li key={p.id} className="playlist-item">
              <span className="playlist-title" title={p.title}>{p.title}</span>
              <button className="playlist-add-btn" aria-label="Add playlist">+</button>
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
              <span className="member-name" title={m.username}>{m.username}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}