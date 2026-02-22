"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Key, Shield, CheckCircle, XCircle, Clock, ListMusic, Play, Pause, SkipForward } from 'lucide-react';

export default function KeyPreviewPage() {
  const [keyValue, setKeyValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [ping, setPing] = useState("0 ms");
  const [isPlaying, setIsPlaying] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showAddMusic, setShowAddMusic] = useState(false);
  const [newMusicName, setNewMusicName] = useState("");
  const [newMusicUrl, setNewMusicUrl] = useState("");
  const [customPlaylist, setCustomPlaylist] = useState([
    { name: "1", url: "https://files.catbox.moe/pz50nd.mp3" },
    { name: "2", url: "https://files.catbox.moe/ev5pjz.mp3" },
    { name: "3", url: "https://files.catbox.moe/we2egh.mp3" }
  ]);
  const audioRef = useRef(null);

  const playlist = customPlaylist;

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');
    
    if (key) {
      setKeyValue(key);
      setLoading(false);
    } else {
      setLoading(false);
      addToast('No key found in URL', 'error');
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString("vi-VN", { hour12: false }) + " | VIETNAM");
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    const updatePing = async () => {
      const start = performance.now();
      try {
        const response = await fetch("https://api.meobypass.com/health");
        if (response.ok) {
          setPing(Math.round(performance.now() - start) + " ms");
        } else {
          setPing("OFFLINE");
        }
      } catch {
        setPing("OFFLINE");
      }
    };
    updatePing();
    const pingInterval = setInterval(updatePing, 5000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pingInterval);
    };
  }, []);

  const copyKey = () => {
    if (keyValue) {
      navigator.clipboard.writeText(keyValue);
      setCopied(true);
      addToast('Key copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextSong = () => {
    const nextIndex = (currentSongIndex + 1) % playlist.length;
    setCurrentSongIndex(nextIndex);
    if (audioRef.current) {
      audioRef.current.src = playlist[nextIndex].url;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  };

  const selectSong = (index) => {
    setCurrentSongIndex(index);
    if (audioRef.current) {
      audioRef.current.src = playlist[index].url;
      audioRef.current.play();
      setIsPlaying(true);
    }
    setShowPlaylist(false);
  };

  const addCustomMusic = () => {
    if (newMusicName && newMusicUrl) {
      let processedUrl = newMusicUrl;
      
      if (newMusicUrl.includes('spotify.com/track/')) {
        const trackId = newMusicUrl.split('track/')[1].split('?')[0];
        processedUrl = `https://open.spotify.com/embed/track/${trackId}`;
      }
      
      setCustomPlaylist([...customPlaylist, { name: newMusicName, url: processedUrl }]);
      setNewMusicName("");
      setNewMusicUrl("");
      setShowAddMusic(false);
    }
  };

  const removeMusic = (index) => {
    if (customPlaylist.length > 1) {
      const newList = customPlaylist.filter((_, i) => i !== index);
      setCustomPlaylist(newList);
      if (index === currentSongIndex) {
        setCurrentSongIndex(0);
        if (audioRef.current) {
          audioRef.current.src = newList[0].url;
          if (isPlaying) audioRef.current.play();
        }
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = playlist[0].url;
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 relative overflow-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #050505;
        }
        
        .title-glow {
          text-shadow: 
            0 0 30px rgba(34, 197, 94, 0.6),
            0 0 60px rgba(34, 197, 94, 0.4),
            0 0 90px rgba(34, 197, 94, 0.3);
        }
        
        .mono {
          font-family: 'JetBrains Mono', monospace;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .disk {
          animation: rotate 5s linear infinite;
          animation-play-state: paused;
        }
        
        .disk.playing {
          animation-play-state: running;
        }
        
        .grid-background {
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #16a34a;
        }
        
        @keyframes toast-slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .toast-enter {
          animation: toast-slide-in 0.3s ease-out forwards;
        }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[10001] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-enter bg-black/95 backdrop-blur-xl border rounded-xl p-4 shadow-2xl min-w-[280px] flex items-center gap-3"
            style={{
              borderColor: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#71717a'
            }}
          >
            {toast.type === 'success' && (
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-5 h-5 text-zinc-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
            <p className="text-sm font-bold text-white">{toast.message}</p>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 grid-background"></div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-green-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>

      <audio ref={audioRef} loop />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center bg-black/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-3 shadow-2xl">
          <div className={`w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center disk ${isPlaying ? 'playing' : ''}`}>
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <div className="ml-4 pr-4 flex flex-col items-start">
            <span className="text-white text-[9px] font-black uppercase tracking-widest block truncate max-w-[160px]">
              {playlist[currentSongIndex].name}
            </span>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={toggleMusic}
                className="bg-green-500 text-black w-7 h-7 rounded-lg flex items-center justify-center shadow-lg hover:bg-green-400 transition"
              >
                {isPlaying ? <Pause size={12} fill="black" /> : <Play size={12} fill="black" />}
              </button>
              <button onClick={nextSong} className="hover:scale-110 transition">
                <SkipForward size={16} className="text-white/40 hover:text-green-500 transition" />
              </button>
              <button onClick={() => {
                setShowPlaylist(!showPlaylist);
                setShowAddMusic(false);
              }} className="hover:scale-110 transition">
                <ListMusic size={16} className="text-white/40 hover:text-green-500 transition" />
              </button>
            </div>
          </div>
        </div>

        {showPlaylist && !showAddMusic && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-[10px] font-black uppercase text-green-500 tracking-widest">Now Playing</h3>
              </div>
              <button 
                onClick={() => {
                  setShowAddMusic(true);
                  setShowPlaylist(false);
                }}
                className="text-[8px] font-black uppercase px-3 py-1.5 bg-green-500/10 border border-green-500 text-green-500 rounded-lg hover:bg-green-500 hover:text-black transition flex items-center gap-1"
              >
                <span className="text-sm">+</span> Add Song
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin pb-1">
              {playlist.map((song, i) => (
                <div
                  key={i}
                  className={`relative p-3 rounded-xl cursor-pointer font-black uppercase transition-all overflow-hidden group ${
                    i === currentSongIndex
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-black shadow-lg'
                      : 'bg-zinc-900/50 text-zinc-600 hover:border hover:border-green-500 hover:text-green-500'
                  }`}
                >
                  {i === currentSongIndex && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  )}
                  <div className="relative z-10 flex items-center justify-between">
                    <div onClick={() => selectSong(i)} className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition ${
                        i === currentSongIndex 
                          ? 'bg-black/20 text-black' 
                          : 'bg-zinc-800 text-zinc-700 group-hover:text-green-500'
                      }`}>
                        {i === currentSongIndex ? (
                          <div className="flex gap-0.5">
                            <div className="w-0.5 h-3 bg-black animate-pulse" style={{animationDelay: '0ms'}}></div>
                            <div className="w-0.5 h-3 bg-black animate-pulse" style={{animationDelay: '150ms'}}></div>
                            <div className="w-0.5 h-3 bg-black animate-pulse" style={{animationDelay: '300ms'}}></div>
                          </div>
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[9px] truncate transition ${i === currentSongIndex ? 'text-black' : 'text-zinc-600 group-hover:text-green-500'}`}>
                          {song.name}
                        </p>
                      </div>
                    </div>
                    {playlist.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMusic(i);
                        }}
                        className={`ml-2 w-6 h-6 rounded-lg flex items-center justify-center transition ${
                          i === currentSongIndex
                            ? 'opacity-60 hover:opacity-100 bg-black/20 hover:bg-red-500 text-black hover:text-white'
                            : 'opacity-0 group-hover:opacity-100 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white'
                        }`}
                      >
                        <span className="text-sm font-bold">×</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showPlaylist && showAddMusic && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 w-80 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase text-green-500 tracking-widest mb-3">Add Music</h3>
            <input
              type="text"
              placeholder="Song name..."
              value={newMusicName}
              onChange={(e) => setNewMusicName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-[9px] uppercase font-bold mb-2 outline-none focus:border-green-500 transition placeholder:text-zinc-700"
            />
            <input
              type="url"
              placeholder="Music URL or Spotify link..."
              value={newMusicUrl}
              onChange={(e) => setNewMusicUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-[9px] uppercase font-bold mb-2 outline-none focus:border-green-500 transition placeholder:text-zinc-700"
            />
            <p className="text-[7px] text-zinc-600 mb-3 uppercase font-bold">
              Supports: Direct MP3/Audio links & Spotify tracks
            </p>
            <div className="flex gap-2">
              <button
                onClick={addCustomMusic}
                className="flex-1 bg-green-500 text-black text-[8px] font-black uppercase py-2 rounded-lg hover:bg-green-400 transition"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddMusic(false);
                  setNewMusicName("");
                  setNewMusicUrl("");
                }}
                className="flex-1 bg-zinc-800 text-white text-[8px] font-black uppercase py-2 rounded-lg hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto pt-10 pb-24 relative z-10">
        <header className="mb-6 text-center">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4 title-glow">
            <span className="text-white">YOUR</span><span className="text-green-500">KEY</span>
          </h1>
          <p className="text-[10px] text-zinc-700 max-w-md mx-auto leading-relaxed mb-4 font-bold uppercase tracking-wider">
            Copy your key below<br />and redeem it in the bot
          </p>
          <div className="mono text-[10px] mt-1 uppercase tracking-[0.4em] text-green-500 font-bold">
            {currentTime}
          </div>
          <div className="relative bg-black/80 border border-zinc-800 rounded-3xl p-4 mt-6 max-w-md mx-auto flex justify-between items-center shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5"></div>
            <div className="text-left relative z-10">
              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">Network Ping</p>
              <p className="text-xl font-black text-green-500">{ping}</p>
            </div>
            <div className="text-right relative z-10">
              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">System Status</p>
              <p className="text-[10px] font-bold text-white mono">READY</p>
            </div>
          </div>

          <div className="text-[7px] font-black uppercase tracking-widest text-green-500 mt-6 max-w-xl mx-auto bg-black/60 border border-zinc-900 rounded-2xl p-3 text-center">
            Click the <span className="text-white">copy button</span> below to copy your key and <span className="text-white">redeem</span> it in the bot.
          </div>
        </header>

        {loading ? (
          <div className="max-w-xl mx-auto mb-12 text-center py-12">
            <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Loading Key...</p>
          </div>
        ) : keyValue ? (
          <div className="max-w-xl mx-auto mb-12">
            <div className="p-6 border border-green-500/50 bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-[12px] font-black uppercase text-green-500 tracking-widest">Key Ready</p>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">Click copy button to copy</p>
                </div>
              </div>

              <div className="bg-black/40 border border-zinc-800 rounded-xl p-5 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-5 h-5 text-green-500" />
                  <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Your Key</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base md:text-lg font-mono text-white break-all flex-1">{keyValue}</p>
                  <button
                    onClick={copyKey}
                    className="flex-shrink-0 p-3 bg-green-500 hover:bg-green-400 rounded-lg transition-all duration-300 active:scale-95"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-black" />
                    ) : (
                      <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[7px] mt-3 text-green-600 uppercase font-black tracking-widest">
                  {copied ? "✓ COPIED TO CLIPBOARD" : "CLICK BUTTON TO COPY KEY"}
                </p>
              </div>

              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl relative z-10">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[8px] font-black uppercase text-green-500 tracking-widest mb-1">Next Steps</p>
                    <p className="text-[7px] text-zinc-400 font-bold">
                      1. Copy the key above<br />
                      2. Open the Mèo Bypass Discord bot<br />
                      3. Use the redeem command with your key
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto mb-12">
            <div className="p-6 border border-red-500/50 bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent"></div>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-[12px] font-black uppercase text-red-500 tracking-widest">No Key Found</p>
                  <p className="text-red-400 font-mono text-xs font-semibold mt-1">
                    Please access this page through a valid key claim link.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 max-w-xl mx-auto mb-3">
          <a href="/discord" className="relative bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-green-500 hover:text-green-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="relative z-10">Discord</span>
          </a>
          <a href="/bot" className="relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">Add Bot</span>
          </a>
          <a href="/" className="relative bg-gradient-to-br from-lime-500/10 via-lime-500/5 to-transparent border border-lime-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-lime-500 hover:text-lime-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="relative z-10">Home</span>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto mb-12">
          <a href="/stats" className="relative bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-teal-500 hover:text-teal-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span className="relative z-10">Statistics</span>
          </a>
          <a href="/install.user.js" className="relative bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-cyan-500 hover:text-cyan-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">User Script</span>
          </a>
        </div>

        <div className="text-center mt-12 mono">
          <p className="mb-2 text-[9px] text-zinc-700 font-bold uppercase tracking-widest">
            Only <span className="text-green-500">MEOBYPASS.CLICK</span> and <span className="text-green-500">MEOBYPASS.COM</span> are the official domain of <span className="text-green-500">Mèo Bypass</span>.
          </p>
          <p className="text-[8px] text-zinc-800 mt-6 font-bold uppercase tracking-wider">© 2025 longndev. All rights reserved.</p>
          
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] text-zinc-700 font-bold uppercase">Live Status</span>
            </div>
            <span className="text-[8px] text-zinc-800">•</span>
            <span className="text-[8px] text-zinc-700 font-bold uppercase mono">{ping}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
