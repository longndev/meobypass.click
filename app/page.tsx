"use client"

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Copy, Check, Shield, Send } from 'lucide-react';

export default function BypassPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [result, setResult] = useState("");
  const [error, setError] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        if (document.fonts) {
          await document.fonts.ready;
        }
      } catch (e) {}

      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsPageLoading(false);
    };

    loadPage();
  }, []);

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
    } catch (error) {
      return "";
    }
  };

  const pollTaskStatus = async (taskId, recaptchaToken) => {
    const maxAttempts = 60000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`https://api.meobypass.click/taskid/${taskId}`);
        const data = await response.json();

        if (data.status === "success") {
          setResult(data.result);
          setShowResult(true);
          setLoading(false);
          return;
        } else if (data.status === "error") {
          setError(true);
          setLoading(false);
          setTimeout(() => {
            setError(false);
          }, 2000);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch (err) {
        attempts++;
      }
    }

    setError(true);
    setLoading(false);
    setTimeout(() => {
      setError(false);
    }, 2000);
  };

  const handleBypass = async () => {
    if (!url) return;
    if (!isRecaptchaReady) return;

    setLoading(true);
    setError(false);

    try {
      const recaptchaToken = await getRecaptchaToken();
      
      if (!recaptchaToken) {
        setError(true);
        setLoading(false);
        setTimeout(() => {
          setError(false);
        }, 2000);
        return;
      }

      const bypassUrl = `https://api.meobypass.click/public/bypass?url=${encodeURIComponent(url)}&captcha=${recaptchaToken}`;

      const response = await fetch(bypassUrl);

      if (response.status === 200) {
        const data = await response.json();

        if (data.task_id) {
          await pollTaskStatus(data.task_id, recaptchaToken);
        } else {
          setError(true);
          setLoading(false);
          setTimeout(() => {
            setError(false);
          }, 2000);
        }
      } else {
        setError(true);
        setLoading(false);
        setTimeout(() => {
          setError(false);
        }, 2000);
      }
    } catch (err) {
      setError(true);
      setLoading(false);
      setTimeout(() => {
        setError(false);
      }, 2000);
    }
  };

  const handleBack = () => {
    window.location.reload();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-green-500/30 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .title-font {
          font-family: "Pacifico", cursive;
          font-weight: 400;
          font-style: normal;
        }
        
        .grid-background {
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="absolute inset-0 grid-background"></div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-green-600/10 rounded-full blur-3xl float-animation"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl float-animation" style={{ animationDelay: '-3s' }}></div>

      <main className="max-w-4xl w-full text-center space-y-10 relative z-10">
        <div className="space-y-8 pt-8">
          <h1 className="title-font text-7xl md:text-8xl tracking-tight text-green-500">
            Mèo Bypass
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            A fast and reliable way to bypass Vietnamese shortlinks.
          </p>

          <div className="text-sm text-gray-500">
            <p className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-md text-white">
              This service is completely free. Anyone asking for payment is trying to scam you.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto pt-4">
          {!showResult ? (
            <div className="space-y-6">
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="Enter shortlink URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBypass()}
                  className="flex-1 px-5 py-4 bg-zinc-900 border border-zinc-800 text-white placeholder:text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-base"
                  style={{ height: "56px" }}
                />
                <button
                  onClick={handleBypass}
                  disabled={!url || loading || !isRecaptchaReady}
                  className="px-8 py-4 rounded-md font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: error 
                      ? '#ef4444' 
                      : (url && isRecaptchaReady) 
                        ? '#22c55e'
                        : '#3f3f46',
                    color: 'white',
                    height: "56px",
                    minWidth: "140px"
                  }}
                  onMouseEnter={(e) => {
                    if (url && !loading && !error && isRecaptchaReady) {
                      e.currentTarget.style.background = "#16a34a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (url && !loading && !error && isRecaptchaReady) {
                      e.currentTarget.style.background = "#22c55e";
                    }
                  }}
                >
                  {error ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Bypass</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>

              {!isRecaptchaReady && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Initializing security verification...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-md flex items-center" style={{ height: "56px" }}>
                  <p className="text-left truncate text-gray-300">{result}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-5 py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-md transition-all"
                  style={{ height: "56px", width: "56px" }}
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <button
                onClick={handleBack}
                className="w-full px-8 py-4 rounded-md font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#22c55e",
                  height: "56px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#16a34a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#22c55e";
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-8">
          <a
            href="https://meobypass.click/terms"
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-all flex items-center gap-2 text-sm"
          >
            <Shield className="w-4 h-4" />
            Terms of Service
          </a>
          <a
            href="https://meobypass.click/discord"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-all flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Discord
          </a>
          <a
            href="/"
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-all flex items-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            Telegram
          </a>
        </div>

        <div className="pt-8 pb-8">
          <p className="text-sm text-gray-600 mb-2">
            By using this service, you agree to our <a href="https://meobypass.click/terms" className="text-green-400 hover:underline">Terms of Service</a> and Privacy Policy.
          </p>
          <p className="text-sm text-gray-600 font-semibold">
            Only <span className="text-green-400">MEOBYPASS.CLICK</span> and <span className="text-green-400">MEOBYPASS.COM</span> are the official domain of <span className="text-green-400">Mèo Bypass</span>.
          </p>
          <p className="text-sm text-gray-700 mt-6">© 2025 longndev. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
