import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import "../styles/PlayerWidget.css";

export default forwardRef(function PlayerWidget({ onEnded }, ref) {
  const iframeRef = useRef(null);
  const widgetRef = useRef(null);
  const [apiReady, setApiReady] = useState(!!(window.SC && window.SC.Widget));
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTrackIdRef = useRef(null);

  // expose imperative controls to parent
  useImperativeHandle(ref, () => ({
    async loadTrackById(id, { autoPlay = false, startMs = 0, volume: vol = 50 } = {}) {
      const w = widgetRef.current;
      if (!w || !id) return;
      
      // Avoid reloading the same track
      if (currentTrackIdRef.current === id) return;
      currentTrackIdRef.current = id;
      
      const url = `https://api.soundcloud.com/tracks/${id}`;
      
      return new Promise((resolve) => {
        try {
          w.load(url, {
            auto_play: false, // Always load paused
            buying: false,
            callback: () => {
              setTimeout(() => { // Give widget time to load
                try {
                  if (typeof startMs === "number" && startMs > 0) {
                    w.seekTo(Math.max(0, Math.floor(startMs)));
                  }
                  w.setVolume(Math.max(0, Math.min(100, Math.floor(vol))));
                  setVolume(vol);
                  
                  if (autoPlay) {
                    w.play();
                  }
                } catch {}
                resolve();
              }, 100);
            },
          });
        } catch {
          resolve();
        }
      });
    },
    
    setVolume(v) {
      const vol = Math.max(0, Math.min(100, Math.floor(Number(v) || 0)));
      setVolume(vol);
      try { widgetRef.current?.setVolume(vol); } catch {}
    },
    
    play() {
      try { 
        widgetRef.current?.play(); 
      } catch {}
    },
    
    pause() {
      try { 
        widgetRef.current?.pause(); 
      } catch {}
    },
    
    seekTo(ms) {
      try { widgetRef.current?.seekTo(Math.max(0, Math.floor(ms || 0))); } catch {}
    },
    
    getPosition() {
      return new Promise((resolve) => {
        try { 
          widgetRef.current?.getPosition((pos) => resolve(Math.floor(pos || 0))); 
        } catch { 
          resolve(0); 
        }
      });
    },
  }), []);

  // Wait for SC API
  useEffect(() => {
    if (apiReady) return;
    let t;
    const check = () => {
      if (window.SC?.Widget) setApiReady(true);
      else t = setTimeout(check, 50);
    };
    check();
    return () => t && clearTimeout(t);
  }, [apiReady]);

  // Create widget ONCE when API is ready
  useEffect(() => {
    if (!apiReady || !iframeRef.current || widgetRef.current) return;
    
    const w = window.SC.Widget(iframeRef.current);
    widgetRef.current = w;

    const onFinish = () => { 
      setIsPlaying(false);
      onEnded?.(); 
    };
    
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    w.bind(window.SC.Widget.Events.FINISH, onFinish);
    w.bind(window.SC.Widget.Events.PLAY, onPlay);
    w.bind(window.SC.Widget.Events.PAUSE, onPause);

    return () => {
      try { 
        w.unbind(window.SC.Widget.Events.FINISH);
        w.unbind(window.SC.Widget.Events.PLAY);
        w.unbind(window.SC.Widget.Events.PAUSE);
      } catch {}
    };
  }, [apiReady, onEnded]);

  const handleVolumeChange = (e) => {
    const v = Number(e.target.value) || 0;
    setVolume(v);
    try { widgetRef.current?.setVolume(v); } catch {}
  };

  const handlePlayPause = () => {
    if (!widgetRef.current) return;
    
    if (isPlaying) {
      widgetRef.current.pause();
    } else {
      widgetRef.current.play();
    }
  };

  return (
    <div className="widget-container">
      <iframe
        ref={iframeRef}
        className="widget-iframe"
        title="SoundCloud Player"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?auto_play=false&color=%23999999&buying=false&single_active=false"
      />
      
      <div className="player-controls">
        <button onClick={handlePlayPause} className="play-pause-btn">
          {isPlaying ? "⏸️" : "▶️"}
        </button>
        
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
    </div>
  );
});