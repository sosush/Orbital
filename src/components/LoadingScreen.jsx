import { useState, useEffect } from 'react';

export default function LoadingScreen({ loading }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && progress < 100) {
      setProgress(100);
      setTimeout(() => setDone(true), 400);
    }
  }, [loading, progress]);

  useEffect(() => {
    if (loading) {
      const iv = setInterval(() => {
        setProgress(p => Math.min(p + Math.random() * 8 + 2, 90));
      }, 200);
      return () => clearInterval(iv);
    }
  }, [loading]);

  if (done) return null;

  return (
    <div className={`loading-screen ${!loading ? 'done' : ''}`}>
      <h1 className="loading-title">ORBITAL</h1>
      <p className="loading-subtitle">LOADING SATELLITES</p>
      <div className="loading-bar">
        <div className="loading-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="loading-count">{Math.round(progress)}%</p>
    </div>
  );
}
