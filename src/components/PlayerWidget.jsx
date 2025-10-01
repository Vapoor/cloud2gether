import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import "../styles/PlayerWidget.css";

export default forwardRef(function PlayerWidget({ trackId, initialVolume = 50, onEnded }, ref) {
  const iframeRef = useRef(null);
  const widgetRef = useRef(null);
  const latestVolRef = useRef(initialVolume);
  const [apiReady, setApiReady] = useState(!!(window.SC && window.SC.Widget));

  // Expose widget controls to parent (Room)
  useImperativeHandle(ref, () => ({
    setVolume(v) {
      const vol = normalize(v);
      latestVolRef.current = vol;
      try { widgetRef.current?.setVolume(vol); } catch {}
    },
    play() { try { widgetRef.current?.play(); } catch {} },
    pause() { try { widgetRef.current?.pause(); } catch {} },
  }), []);

  // Normalize to 0..100 (accept 0..1 too)
  const normalize = (v) => {
    const n = Number(v);
    if (!isFinite(n)) return 0;
    const scaled = n <= 1 ? n * 100 : n;
    return Math.max(0, Math.min(100, Math.round(scaled)));
  };

  // Always set iframe src when track changes
  useEffect(() => {
    if (!trackId || !iframeRef.current) return;
    iframeRef.current.src =
      `https://w.soundcloud.com/player/?url=` +
      encodeURIComponent(`https://api.soundcloud.com/tracks/${trackId}`) +
      `&auto_play=true&color=%23999999&buying=false&single_active=false`;
  }, [trackId]);

  // Wait for SC Widget API
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

  // Build the widget and bind events (READY, FINISH)
  useEffect(() => {
    if (!apiReady || !iframeRef.current) return;

    const w = window.SC.Widget(iframeRef.current);
    widgetRef.current = w;

    const onReady = () => {
      try { w.setVolume(normalize(latestVolRef.current)); } catch {}
    };
    const onFinish = () => { try { onEnded?.(); } catch {} };

    w.bind(window.SC.Widget.Events.READY, onReady);
    w.bind(window.SC.Widget.Events.FINISH, onFinish);

    return () => {
      try {
        w.unbind(window.SC.Widget.Events.READY);
        w.unbind(window.SC.Widget.Events.FINISH);
      } catch {}
    };
  }, [apiReady, trackId, onEnded]);

  if (!trackId) return null;

  return (
    <div className="widget-container">
      <iframe
        ref={iframeRef}
        className="widget-iframe"
        title="SoundCloud Player"
        allow="autoplay"
        scrolling="no"
      />
    </div>
  );
});