"use client"

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, PlusCircle, Code, ShieldCheck, SkipForward, ListMusic, Play, Pause } from 'lucide-react';

export default function BypassPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [ping, setPing] = useState("0 ms");
  const [bypassHistory, setBypassHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [totalBypasses, setTotalBypasses] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [successStreak, setSuccessStreak] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastTimeoutsRef = useRef(new Map());

  const fullText = "Paste your link here...";

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    toastTimeoutsRef.current.forEach((timeout, existingId) => {
      const existingToast = toasts.find(t => t.id === existingId);
      if (existingToast && existingToast.type === type && existingToast.message === message) {
        clearTimeout(timeout);
        toastTimeoutsRef.current.delete(existingId);
        setToasts(prev => prev.filter(t => t.id !== existingId));
      }
    });

    setToasts(prev => [...prev, { id, message, type }]);
    
    const timeout = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      toastTimeoutsRef.current.delete(id);
    }, 4000);
    
    toastTimeoutsRef.current.set(id, timeout);
  };

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

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString("vi-VN", { hour12: false }) + " | VIETNAM");
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    const updatePing = async () => {
      const start = performance.now();
      try {
        await fetch("https://api.meobypass.com/", { mode: "no-cors" });
        setPing(Math.round(performance.now() - start) + " ms");
      } catch {
        setPing("OFFLINE");
      }
    };
    updatePing();
    const pingInterval = setInterval(updatePing, 2000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pingInterval);
      toastTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      toastTimeoutsRef.current.clear();
    };
  }, []);
  useEffect(() => {
    if (!url && isTyping) {
      let index = 0;
      const typingInterval = setInterval(() => {
        if (index <= fullText.length) {
          setTypedText(fullText.substring(0, index));
          index++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => {
            setIsTyping(false);
            setTimeout(() => {
              setIsTyping(true);
              setTypedText("");
            }, 2000);
          }, 3000);
        }
      }, 100);

      return () => clearInterval(typingInterval);
    }
  }, [isTyping, url, fullText]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=6LeEge4rAAAAAPJ7vKCvI9-DcHBNh7B_92UcK2y6';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      const checkRecaptcha = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            setIsRecaptchaReady(true);
          });
        } else {
          setTimeout(checkRecaptcha, 100);
        }
      };
      checkRecaptcha();
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const getRecaptchaToken = async () => {
    try {
      if (window.grecaptcha && window.grecaptcha.execute) {
        const token = await window.grecaptcha.execute('6LeEge4rAAAAAPJ7vKCvI9-DcHBNh7B_92UcK2y6', { action: 'bypass' });
        return token || "";
      }
      return "";
    } catch {
      return "";
    }
  };

  const pollTaskStatus = async (taskId) => {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`https://api.meobypass.com/task/${taskId}`);
        const data = await response.json();

        if (data.status === "success") {
          setResult(data.result);
          setShowResult(true);
          setLoading(false);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          const newHistoryItem = {
            original: url,
            bypassed: data.result,
            timestamp: new Date().toLocaleString('vi-VN')
          };
          setBypassHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
          setTotalBypasses(prev => prev + 1);
          const newStreak = successStreak + 1;
          setSuccessStreak(newStreak);
          if (newStreak === 5 || newStreak === 10 || newStreak === 25 || newStreak === 50) {
            setShowAchievement(true);
            setTimeout(() => setShowAchievement(false), 4000);
          }
          
          return;
        } else if (data.status === "error") {
          setError(true);
          setResult(data.result || "Bypass failed. Please try again.");
          setShowResult(true);
          setLoading(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch {
        attempts++;
      }
    }

    setError(true);
    setResult("Request timeout. Please try again.");
    setShowResult(true);
    setLoading(false);
  };

  const handleBypass = async () => {
    if (!url || !isRecaptchaReady) return;

    setLoading(true);
    setError(false);

    try {
      const recaptchaToken = await getRecaptchaToken();
      
      if (!recaptchaToken) {
        setError(true);
        setLoading(false);
        setTimeout(() => setError(false), 2000);
        return;
      }

      const bypassUrl = `https://api.meobypass.com/bypass/public`;
      const response = await fetch(bypassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          'captcha-response': recaptchaToken
        })
      });

      if (response.status === 200) {
        const data = await response.json();
        
        if (data.status === "pending" && data.task_id) {
          await pollTaskStatus(data.task_id);
        } else if (data.status === "success") {
          setResult(data.result);
          setShowResult(true);
          setLoading(false);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          const newHistoryItem = {
            original: url,
            bypassed: data.result,
            timestamp: new Date().toLocaleString('vi-VN')
          };
          setBypassHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
          setTotalBypasses(prev => prev + 1);
          const newStreak = successStreak + 1;
          setSuccessStreak(newStreak);
          if (newStreak === 5 || newStreak === 10 || newStreak === 25 || newStreak === 50) {
            setShowAchievement(true);
            setTimeout(() => setShowAchievement(false), 4000);
          }
        } else {
          setError(true);
          setResult(data.result || "Bypass failed.");
          setShowResult(true);
          setLoading(false);
        }
      } else {
        setError(true);
        setResult("Server error. Please try again later.");
        setShowResult(true);
        setLoading(false);
      }
    } catch {
      setError(true);
      setResult("Network error. Please check your connection.");
      setShowResult(true);
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      addToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyFromHistory = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Link copied from history!', 'success');
  };

  const clearHistory = () => {
    setBypassHistory([]);
    addToast('History cleared successfully', 'info');
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

  const truncateUrl = (url, maxLength = 80) => {
    if (!url) return '';
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
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
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti {
          position: fixed;
          width: 10px;
          height: 10px;
          z-index: 9999;
          pointer-events: none;
          animation: confetti-fall 3s linear forwards;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes slide-in-right {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-out-right {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
        
        .achievement-enter {
          animation: slide-in-right 0.5s ease-out forwards;
        }
        
        .achievement-exit {
          animation: slide-out-right 0.5s ease-in forwards;
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
        {toasts.map((toast, index) => (
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
      {showAchievement && (
        <div className="fixed top-6 right-6 z-[10000] achievement-enter">
          <div className="bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-400 rounded-2xl p-4 shadow-2xl min-w-[280px]">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black uppercase text-black mb-1">Achievement Unlocked!</p>
                <p className="text-xs font-bold text-black/80">
                  {successStreak === 5 && "Novice Bypasser - 5 successful bypasses"}
                  {successStreak === 10 && "Pro Bypasser - 10 successful bypasses"}
                  {successStreak === 25 && "Expert Bypasser - 25 successful bypasses"}
                  {successStreak === 50 && "Master Bypasser - 50 successful bypasses"}
                </p>
              </div>
            </div>
            <div className="mt-3 bg-black/10 rounded-full h-1.5 overflow-hidden">
              <div className="bg-black/30 h-full animate-pulse" style={{width: '100%'}}></div>
            </div>
          </div>
        </div>
      )}

      {showConfetti && (
        <>
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#22c55e', '#16a34a', '#15803d', '#14532d', '#ffffff'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 1}s`,
                width: `${5 + Math.random() * 10}px`,
                height: `${5 + Math.random() * 10}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0'
              }}
            />
          ))}
        </>
      )}

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
            <span className="text-white">BEST</span><span className="text-green-500">BYPASS</span>
          </h1>
          <p className="text-[10px] text-zinc-700 max-w-md mx-auto leading-relaxed mb-4 font-bold uppercase tracking-wider">
            A fast and reliable way to bypass<br />Vietnamese shortlinks.
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
            This service is completely <span className="text-white">free</span>. Anyone asking for payment is trying to <span className="text-white">scam</span> you.
          </div>
        </header>

        <div className="max-w-xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-green-500/10 to-green-500/20 blur-xl -z-10"></div>
          <div className="bg-black/80 border border-zinc-800 rounded-3xl p-3 mb-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5"></div>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsTyping(false)}
              placeholder={url ? "" : typedText}
              className="w-full bg-transparent px-4 py-2 outline-none text-white font-bold mono text-sm uppercase text-center h-10 resize-none placeholder:text-zinc-700 placeholder:font-bold placeholder:mono placeholder:normal-case relative z-10"
            />
            <button
              onClick={handleBypass}
              disabled={!url || loading || !isRecaptchaReady}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black py-3 rounded-xl font-black text-[11px] uppercase active:scale-95 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-green-500 disabled:to-green-600 shadow-lg shadow-green-500/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  PROCESSING...
                </div>
              ) : error ? (
                "ERROR - TRY AGAIN"
              ) : (
                "Bypass Now"
              )}
            </button>
          </div>
        </div>

        {showResult && (
          <div className="max-w-xl mx-auto mb-12 p-5 border rounded-2xl transition relative overflow-hidden">
            {error ? (
              <div className="border-red-500/50 bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent"></div>
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3 flex-1">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-400 font-mono text-xs font-semibold">{result}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowResult(false);
                      setError(false);
                      setResult("");
                    }}
                    className="flex-shrink-0 p-2.5 bg-zinc-900 border border-zinc-800 hover:border-red-500 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-[7px] mt-3 text-red-600 uppercase font-black tracking-widest relative z-10">
                  CLICK X TO DISMISS
                </p>
              </div>
            ) : (
              <div className="border-green-500/50 bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent"></div>
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <p className="text-white/90 font-mono break-all text-xs font-semibold flex-1 truncate" title={result}>
                    {truncateUrl(result, 80)}
                  </p>
                  <button
                    onClick={copyResult}
                    className="flex-shrink-0 p-2.5 bg-zinc-900 border border-zinc-800 hover:border-green-500 hover:bg-green-500/10 rounded-lg transition"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[7px] mt-3 text-green-600 uppercase font-black tracking-widest relative z-10">
                  {copied ? "✓ COPIED TO CLIPBOARD" : "CLICK COPY BUTTON TO COPY FULL URL"}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 max-w-xl mx-auto mb-3">
          <a href="#" className="relative bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-green-500 hover:text-green-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="relative z-10">Discord</span>
          </a>
          <a href="#" className="relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">Add Bot</span>
          </a>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="relative bg-gradient-to-br from-lime-500/10 via-lime-500/5 to-transparent border border-lime-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-lime-500 hover:text-lime-400 transition-all duration-500 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">History</span>
            {bypassHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-lime-500 text-black text-[8px] font-black rounded-full flex items-center justify-center shadow-lg z-20">
                {bypassHistory.length}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto mb-12">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="relative bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-teal-500 hover:text-teal-400 transition-all duration-500 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span className="relative z-10">Statistics</span>
          </button>
          <a href="#" className="relative bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-cyan-500 hover:text-cyan-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">User Script</span>
          </a>
        </div>

        {showStats && (
          <div className="max-w-xl mx-auto mb-12 bg-black/80 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <h3 className="text-[9px] font-black uppercase text-white tracking-widest">Performance Dashboard</h3>
              </div>
              <span className="text-[7px] text-zinc-600 font-bold uppercase mono">{currentTime}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="relative bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/30 rounded-xl p-4 text-left overflow-hidden group hover:border-green-500 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-[7px] font-black uppercase text-green-500/80 tracking-wider mb-2 relative z-10">Bypasses</p>
                <p className="text-2xl font-black text-green-500 mb-0.5 relative z-10 transition-transform duration-500 group-hover:scale-105">{totalBypasses}</p>
                <p className="text-[7px] text-green-500/60 font-bold uppercase relative z-10">Total Completed</p>
              </div>
              
              <div className="relative bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/30 rounded-xl p-4 text-left overflow-hidden group hover:border-yellow-500 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-[7px] font-black uppercase text-yellow-500/80 tracking-wider mb-2 relative z-10">Streak</p>
                <p className="text-2xl font-black text-yellow-500 mb-0.5 relative z-10 transition-transform duration-500 group-hover:scale-105">{successStreak}</p>
                <p className="text-[7px] text-yellow-500/60 font-bold uppercase relative z-10">Success Run</p>
              </div>
              
              <div className="relative bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/30 rounded-xl p-4 text-left overflow-hidden group hover:border-blue-500 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-[7px] font-black uppercase text-blue-500/80 tracking-wider mb-2 relative z-10">History</p>
                <p className="text-2xl font-black text-blue-500 mb-0.5 relative z-10 transition-transform duration-500 group-hover:scale-105">{bypassHistory.length}</p>
                <p className="text-[7px] text-blue-500/60 font-bold uppercase relative z-10">Saved Links</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-xl p-4 overflow-hidden group hover:border-emerald-500 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <p className="text-[7px] font-black uppercase text-emerald-500/80 tracking-wider">Network</p>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <p className={`text-xl font-black mono mb-1 relative z-10 transition-transform duration-500 group-hover:scale-105 ${ping === 'OFFLINE' ? 'text-white' : 'text-emerald-500'}`}>{ping}</p>
                <p className="text-[7px] text-emerald-500/60 font-bold uppercase relative z-10">Response Time</p>
              </div>
              
              <div className="relative bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 rounded-xl p-4 overflow-hidden group hover:border-purple-500 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <p className="text-[7px] font-black uppercase text-purple-500/80 tracking-wider">Services</p>
                  <svg className="w-3 h-3 text-purple-500/60 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xl font-black text-purple-500 mono mb-1 relative z-10 transition-transform duration-500 group-hover:scale-105">20</p>
                <p className="text-[7px] text-purple-500/60 font-bold uppercase relative z-10">Active Providers</p>
              </div>
            </div>
            <div className="relative bg-gradient-to-r from-green-500/10 via-transparent to-green-500/5 border border-green-500/30 rounded-xl p-3 flex items-center justify-between overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent animate-shimmer"></div>
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black uppercase text-green-500 tracking-wider">System Operational</span>
              </div>
              <span className="text-[7px] text-green-500/60 font-bold uppercase relative z-10">100% Uptime</span>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="max-w-xl mx-auto mb-12 bg-black/80 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <h3 className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Bypass History</h3>
              </div>
              {bypassHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[8px] font-black uppercase px-3 py-1.5 bg-red-500/10 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div id="history-copied" className="hidden mb-3 p-2 bg-green-500/10 border border-green-500 rounded-lg text-center">
              <p className="text-[8px] font-black uppercase text-green-500">✓ Copied to clipboard</p>
            </div>

            {bypassHistory.length === 0 ? (
              <div className="text-center py-8 relative z-10">
                <svg className="w-12 h-12 text-zinc-800 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <p className="text-[9px] font-black uppercase text-zinc-700 tracking-wider">No bypass history yet</p>
                <p className="text-[7px] text-zinc-800 mt-2 uppercase font-bold">Your bypassed links will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin relative z-10">
                {bypassHistory.map((item, index) => (
                  <div key={index} className="relative bg-gradient-to-br from-zinc-500/5 via-transparent to-zinc-500/5 border border-zinc-800 rounded-xl p-4 hover:border-orange-500/50 transition-all duration-500 group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="flex items-start justify-between gap-3 mb-2 relative z-10">
                      <div className="flex-1 min-w-0">
                        <p className="text-[7px] font-black uppercase text-zinc-600 tracking-widest mb-1">Original</p>
                        <p className="text-[9px] text-zinc-500 font-mono truncate" title={item.original}>{truncateUrl(item.original, 60)}</p>
                      </div>
                      <span className="text-[7px] text-zinc-700 font-bold uppercase whitespace-nowrap">{item.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="flex-1 min-w-0">
                        <p className="text-[7px] font-black uppercase text-zinc-600 tracking-widest mb-1">Bypassed</p>
                        <p className="text-[9px] text-orange-500 font-mono truncate font-bold" title={item.bypassed}>{truncateUrl(item.bypassed, 60)}</p>
                      </div>
                      <button
                        onClick={() => copyFromHistory(item.bypassed)}
                        className="flex-shrink-0 p-2 bg-zinc-800 border border-zinc-700 hover:border-orange-500 hover:bg-orange-500/10 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5 text-white/60 transition-transform duration-300 hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

                  <div className="bg-black/80 border border-zinc-800 rounded-3xl p-8 text-left mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5"></div>
          <div className="flex items-center gap-2 mb-8 text-[9px] font-black uppercase text-green-500 tracking-widest relative z-10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Supported Services
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 relative z-10">
            {['Platoboost', 'Hydrogen', 'Codex', 'Linkvertise'].map((service) => (
              <div key={service} className="relative bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/30 rounded-xl p-3 text-center text-[8px] font-black text-white uppercase transition-all duration-500 hover:border-green-500 hover:text-green-400 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <span className="relative z-10 transition-transform duration-300 inline-block group-hover:scale-105">{service}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/80 border border-zinc-800 rounded-3xl p-8 text-left relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5"></div>
          <div className="flex items-center gap-2 mb-8 text-[9px] font-black uppercase text-emerald-500 tracking-widest relative z-10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Vietnamese
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 relative z-10">
            {['LinkNgon', 'TrafficUser', 'TrafficHay', 'TrafficSeoTop', 'Link4M', 'Link2M', 'SynURL', 'Link4Sub', 'LinkNgon.io', '4Mmo', 'YeuLink', 'LinkFree'].map((service) => (
              <div key={service} className="relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-xl p-3 text-center text-[8px] font-black text-white uppercase transition-all duration-500 hover:border-emerald-500 hover:text-emerald-400 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <span className="relative z-10 transition-transform duration-300 inline-block group-hover:scale-105">{service}</span>
              </div>
            ))}
          </div>
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
            <span className="text-[8px] text-zinc-700 font-bold uppercase">{totalBypasses} Total</span>
            <span className="text-[8px] text-zinc-800">•</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-[8px] text-yellow-500 font-bold uppercase">{successStreak} Streak</span>
            </div>
            <span className="text-[8px] text-zinc-800">•</span>
            <span className="text-[8px] text-zinc-700 font-bold uppercase mono">{ping}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BypassPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [ping, setPing] = useState("0 ms");
  const [bypassHistory, setBypassHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [totalBypasses, setTotalBypasses] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [successStreak, setSuccessStreak] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [toasts, setToasts] = useState([]);

  const fullText = "Paste your link here...";

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
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

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString("vi-VN", { hour12: false }) + " | VIETNAM");
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    const updatePing = async () => {
      const start = performance.now();
      try {
        await fetch("https://fonts.googleapis.com/css2?family=Inter", { mode: "no-cors" });
        setPing(Math.round(performance.now() - start) + " ms");
      } catch {
        setPing("OFFLINE");
      }
    };
    updatePing();
    const pingInterval = setInterval(updatePing, 2000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pingInterval);
    };
  }, []);
  useEffect(() => {
    if (!url && isTyping) {
      let index = 0;
      const typingInterval = setInterval(() => {
        if (index <= fullText.length) {
          setTypedText(fullText.substring(0, index));
          index++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => {
            setIsTyping(false);
            setTimeout(() => {
              setIsTyping(true);
              setTypedText("");
            }, 2000);
          }, 3000);
        }
      }, 100);

      return () => clearInterval(typingInterval);
    }
  }, [isTyping, url, fullText]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=6LeEge4rAAAAAPJ7vKCvI9-DcHBNh7B_92UcK2y6';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      const checkRecaptcha = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            setIsRecaptchaReady(true);
          });
        } else {
          setTimeout(checkRecaptcha, 100);
        }
      };
      checkRecaptcha();
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const getRecaptchaToken = async () => {
    try {
      if (window.grecaptcha && window.grecaptcha.execute) {
        const token = await window.grecaptcha.execute('6LeEge4rAAAAAPJ7vKCvI9-DcHBNh7B_92UcK2y6', { action: 'bypass' });
        return token || "";
      }
      return "";
    } catch {
      return "";
    }
  };

  const pollTaskStatus = async (taskId) => {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`https://api.meobypass.click/taskid/${taskId}`);
        const data = await response.json();

        if (data.status === "success") {
          setResult(data.result);
          setShowResult(true);
          setLoading(false);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          const newHistoryItem = {
            original: url,
            bypassed: data.result,
            timestamp: new Date().toLocaleString('vi-VN')
          };
          setBypassHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
          setTotalBypasses(prev => prev + 1);
          const newStreak = successStreak + 1;
          setSuccessStreak(newStreak);
          if (newStreak === 5 || newStreak === 10 || newStreak === 25 || newStreak === 50) {
            setShowAchievement(true);
            setTimeout(() => setShowAchievement(false), 4000);
          }
          
          return;
        } else if (data.status === "error") {
          setError(true);
          setResult(data.message || "Bypass failed. Please try again.");
          setShowResult(true);
          setLoading(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch {
        attempts++;
      }
    }

    setError(true);
    setResult("Request timeout. Please try again.");
    setShowResult(true);
    setLoading(false);
  };

  const handleBypass = async () => {
    if (!url || !isRecaptchaReady) return;

    setLoading(true);
    setError(false);

    try {
      const recaptchaToken = await getRecaptchaToken();
      
      if (!recaptchaToken) {
        setError(true);
        setLoading(false);
        setTimeout(() => setError(false), 2000);
        return;
      }

      const bypassUrl = `https://api.meobypass.click/public/bypass?url=${encodeURIComponent(url)}&captcha=${recaptchaToken}`;
      const response = await fetch(bypassUrl);

      if (response.status === 200) {
        const data = await response.json();
        if (data.task_id) {
          await pollTaskStatus(data.task_id);
        } else {
          setError(true);
          setResult("Invalid response from server.");
          setShowResult(true);
          setLoading(false);
        }
      } else {
        setError(true);
        setResult("Server error. Please try again later.");
        setShowResult(true);
        setLoading(false);
      }
    } catch {
      setError(true);
      setResult("Network error. Please check your connection.");
      setShowResult(true);
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      addToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyFromHistory = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Link copied from history!', 'success');
  };

  const clearHistory = () => {
    setBypassHistory([]);
    addToast('History cleared successfully', 'info');
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
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti {
          position: fixed;
          width: 10px;
          height: 10px;
          z-index: 9999;
          pointer-events: none;
          animation: confetti-fall 3s linear forwards;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes slide-in-right {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-out-right {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
        
        .achievement-enter {
          animation: slide-in-right 0.5s ease-out forwards;
        }
        
        .achievement-exit {
          animation: slide-out-right 0.5s ease-in forwards;
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
        {toasts.map((toast, index) => (
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
      {showAchievement && (
        <div className="fixed top-6 right-6 z-[10000] achievement-enter">
          <div className="bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-400 rounded-2xl p-4 shadow-2xl min-w-[280px]">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black uppercase text-black mb-1">Achievement Unlocked!</p>
                <p className="text-xs font-bold text-black/80">
                  {successStreak === 5 && "Novice Bypasser - 5 successful bypasses"}
                  {successStreak === 10 && "Pro Bypasser - 10 successful bypasses"}
                  {successStreak === 25 && "Expert Bypasser - 25 successful bypasses"}
                  {successStreak === 50 && "Master Bypasser - 50 successful bypasses"}
                </p>
              </div>
            </div>
            <div className="mt-3 bg-black/10 rounded-full h-1.5 overflow-hidden">
              <div className="bg-black/30 h-full animate-pulse" style={{width: '100%'}}></div>
            </div>
          </div>
        </div>
      )}

      {showConfetti && (
        <>
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#22c55e', '#16a34a', '#15803d', '#14532d', '#ffffff'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 1}s`,
                width: `${5 + Math.random() * 10}px`,
                height: `${5 + Math.random() * 10}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0'
              }}
            />
          ))}
        </>
      )}

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
            <span className="text-white">BEST</span><span className="text-green-500">BYPASS</span>
          </h1>
          <p className="text-[10px] text-zinc-700 max-w-md mx-auto leading-relaxed mb-4 font-bold uppercase tracking-wider">
            A fast and reliable way to bypass<br />Vietnamese shortlinks.
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
            This service is completely <span className="text-white">free</span>. Anyone asking for payment is trying to <span className="text-white">scam</span> you.
          </div>
        </header>

        <div className="max-w-xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-green-500/10 to-green-500/20 blur-xl -z-10"></div>
          <div className="bg-black/80 border border-zinc-800 rounded-3xl p-3 mb-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5"></div>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsTyping(false)}
              placeholder={url ? "" : typedText}
              className="w-full bg-transparent px-4 py-2 outline-none text-white font-bold mono text-sm uppercase text-center h-10 resize-none placeholder:text-zinc-700 placeholder:font-bold placeholder:mono placeholder:normal-case relative z-10"
            />
            <button
              onClick={handleBypass}
              disabled={!url || loading || !isRecaptchaReady}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black py-3 rounded-xl font-black text-[11px] uppercase active:scale-95 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-green-500 disabled:to-green-600 shadow-lg shadow-green-500/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  PROCESSING...
                </div>
              ) : error ? (
                "ERROR - TRY AGAIN"
              ) : (
                "Bypass Now"
              )}
            </button>
          </div>
        </div>

        {showResult && (
          <div className="max-w-xl mx-auto mb-12 p-5 border rounded-2xl transition relative overflow-hidden">
            {error ? (
              <div className="border-red-500/50 bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent"></div>
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3 flex-1">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-400 font-mono text-xs font-semibold">{result}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowResult(false);
                      setError(false);
                      setResult("");
                    }}
                    className="flex-shrink-0 p-2.5 bg-zinc-900 border border-zinc-800 hover:border-red-500 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-[7px] mt-3 text-red-600 uppercase font-black tracking-widest relative z-10">
                  CLICK X TO DISMISS
                </p>
              </div>
            ) : (
              <div className="border-green-500/50 bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent"></div>
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <p className="text-white/90 font-mono break-all text-xs font-semibold flex-1 truncate">
                    {result.length > 80 ? `${result.substring(0, 80)}...` : result}
                  </p>
                  <button
                    onClick={copyResult}
                    className="flex-shrink-0 p-2.5 bg-zinc-900 border border-zinc-800 hover:border-green-500 hover:bg-green-500/10 rounded-lg transition"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[7px] mt-3 text-green-600 uppercase font-black tracking-widest relative z-10">
                  {copied ? "✓ COPIED TO CLIPBOARD" : "CLICK ICON TO COPY FULL RESULT"}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 max-w-xl mx-auto mb-3">
          <a href="#" className="relative bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-green-500 hover:text-green-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="relative z-10">Discord</span>
          </a>
          <a href="#" className="relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">Add Bot</span>
          </a>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="relative bg-gradient-to-br from-lime-500/10 via-lime-500/5 to-transparent border border-lime-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-lime-500 hover:text-lime-400 transition-all duration-500 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">History</span>
            {bypassHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-lime-500 text-black text-[8px] font-black rounded-full flex items-center justify-center shadow-lg z-20">
                {bypassHistory.length}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto mb-12">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="relative bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-teal-500 hover:text-teal-400 transition-all duration-500 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span className="relative z-10">Statistics</span>
          </button>
          <a href="#" className="relative bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/30 text-white p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-cyan-500 hover:text-cyan-400 transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">User Script</span>
          </a>
        </div>

        {showStats && (
          <div className="max-w-xl mx-auto mb-12 bg-black/80 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <h3 className="text-[9px] font-black uppercase text-white tracking-widest">Performance Dashboard</h3>
              </div>
              <span className="text-[7px] text-zinc-600 font-bold uppercase mono">{currentTime}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="relative bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/30 rounded-xl p-4 text-left overflow-hidden group hover:border-green-500 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-[7px] font-black uppercase text-green-500/80 tracking-wider mb-2 relative z-10">Bypasses</p>
                <p className="text-2xl font-black text-green-500 mb-0.5 relative z-10 transition-transform duration-500 group-hover:scale-105">{totalBypasses}</p>
                <p className="text-[7px] text-green-500/60 font-bold uppercase relative z-10">Total Completed</p>
              </div>
              
              <div className="relative bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/30 rounded-xl p-4 text-left overflow-hidden group hover:border-yellow-500 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-[7px] font-black uppercase text-yellow-500/80 tracking-wider mb-2 relative z-10">Streak</p>
                <p className="text-2xl font-black text-yellow-500 mb-0.5 relative z-10 transition-transform duration-500 group-hover:scale-105">{successStreak}</p>
                <p className="text-[7px] text-yellow-500/60 font-bold uppercase relative z-10">Success Run</p>
              </div>
              
              <div className="relative bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/30 rounded-xl p-4 text-left overflow-hidden group hover:border-blue-500 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-[7px] font-black uppercase text-blue-500/80 tracking-wider mb-2 relative z-10">History</p>
                <p className="text-2xl font-black text-blue-500 mb-0.5 relative z-10 transition-transform duration-500 group-hover:scale-105">{bypassHistory.length}</p>
                <p className="text-[7px] text-blue-500/60 font-bold uppercase relative z-10">Saved Links</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-xl p-4 overflow-hidden group hover:border-emerald-500 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <p className="text-[7px] font-black uppercase text-emerald-500/80 tracking-wider">Network</p>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <p className={`text-xl font-black mono mb-1 relative z-10 transition-transform duration-500 group-hover:scale-105 ${ping === 'OFFLINE' ? 'text-white' : 'text-emerald-500'}`}>{ping}</p>
                <p className="text-[7px] text-emerald-500/60 font-bold uppercase relative z-10">Response Time</p>
              </div>
              
              <div className="relative bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 rounded-xl p-4 overflow-hidden group hover:border-purple-500 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <p className="text-[7px] font-black uppercase text-purple-500/80 tracking-wider">Services</p>
                  <svg className="w-3 h-3 text-purple-500/60 transition-transform duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xl font-black text-purple-500 mono mb-1 relative z-10 transition-transform duration-500 group-hover:scale-105">20</p>
                <p className="text-[7px] text-purple-500/60 font-bold uppercase relative z-10">Active Providers</p>
              </div>
            </div>
            <div className="relative bg-gradient-to-r from-green-500/10 via-transparent to-green-500/5 border border-green-500/30 rounded-xl p-3 flex items-center justify-between overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent animate-shimmer"></div>
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black uppercase text-green-500 tracking-wider">System Operational</span>
              </div>
              <span className="text-[7px] text-green-500/60 font-bold uppercase relative z-10">100% Uptime</span>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="max-w-xl mx-auto mb-12 bg-black/80 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <h3 className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Bypass History</h3>
              </div>
              {bypassHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[8px] font-black uppercase px-3 py-1.5 bg-red-500/10 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div id="history-copied" className="hidden mb-3 p-2 bg-green-500/10 border border-green-500 rounded-lg text-center">
              <p className="text-[8px] font-black uppercase text-green-500">✓ Copied to clipboard</p>
            </div>

            {bypassHistory.length === 0 ? (
              <div className="text-center py-8 relative z-10">
                <svg className="w-12 h-12 text-zinc-800 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <p className="text-[9px] font-black uppercase text-zinc-700 tracking-wider">No bypass history yet</p>
                <p className="text-[7px] text-zinc-800 mt-2 uppercase font-bold">Your bypassed links will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin relative z-10">
                {bypassHistory.map((item, index) => (
                  <div key={index} className="relative bg-gradient-to-br from-zinc-500/5 via-transparent to-zinc-500/5 border border-zinc-800 rounded-xl p-4 hover:border-orange-500/50 transition-all duration-500 group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="flex items-start justify-between gap-3 mb-2 relative z-10">
                      <div className="flex-1 min-w-0">
                        <p className="text-[7px] font-black uppercase text-zinc-600 tracking-widest mb-1">Original</p>
                        <p className="text-[9px] text-zinc-500 font-mono truncate">{item.original}</p>
                      </div>
                      <span className="text-[7px] text-zinc-700 font-bold uppercase whitespace-nowrap">{item.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="flex-1 min-w-0">
                        <p className="text-[7px] font-black uppercase text-zinc-600 tracking-widest mb-1">Bypassed</p>
                        <p className="text-[9px] text-orange-500 font-mono truncate font-bold">{item.bypassed}</p>
                      </div>
                      <button
                        onClick={() => copyFromHistory(item.bypassed)}
                        className="flex-shrink-0 p-2 bg-zinc-800 border border-zinc-700 hover:border-orange-500 hover:bg-orange-500/10 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5 text-white/60 transition-transform duration-300 hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

                  <div className="bg-black/80 border border-zinc-800 rounded-3xl p-8 text-left mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5"></div>
          <div className="flex items-center gap-2 mb-8 text-[9px] font-black uppercase text-green-500 tracking-widest relative z-10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Supported Services
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 relative z-10">
            {['Platoboost', 'Hydrogen', 'Codex', 'Linkvertise'].map((service) => (
              <div key={service} className="relative bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/30 rounded-xl p-3 text-center text-[8px] font-black text-white uppercase transition-all duration-500 hover:border-green-500 hover:text-green-400 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <span className="relative z-10 transition-transform duration-300 inline-block group-hover:scale-105">{service}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/80 border border-zinc-800 rounded-3xl p-8 text-left relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5"></div>
          <div className="flex items-center gap-2 mb-8 text-[9px] font-black uppercase text-emerald-500 tracking-widest relative z-10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Vietnamese
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 relative z-10">
            {['LinkNgon', 'TrafficUser', 'TrafficHay', 'TrafficSeoTop', 'Link4M', 'Link2M', 'SynURL', 'Link4Sub', 'LinkNgon.io', '4Mmo', 'YeuLink', 'LinkFree'].map((service) => (
              <div key={service} className="relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-xl p-3 text-center text-[8px] font-black text-white uppercase transition-all duration-500 hover:border-emerald-500 hover:text-emerald-400 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <span className="relative z-10 transition-transform duration-300 inline-block group-hover:scale-105">{service}</span>
              </div>
            ))}
          </div>
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
            <span className="text-[8px] text-zinc-700 font-bold uppercase">{totalBypasses} Total</span>
            <span className="text-[8px] text-zinc-800">•</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-[8px] text-yellow-500 font-bold uppercase">{successStreak} Streak</span>
            </div>
            <span className="text-[8px] text-zinc-800">•</span>
            <span className="text-[8px] text-zinc-700 font-bold uppercase mono">{ping}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
