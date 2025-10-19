"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight, Copy, Check } from "lucide-react"

export default function BypassPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [result, setResult] = useState("")
  const [error, setError] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false)
  const recaptchaRef = useRef(null)

  useEffect(() => {
    const loadPage = async () => {
      try {
        if (document.fonts) {
          await document.fonts.ready
        }
      } catch (e) {
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
      setIsPageLoading(false)
    }

    loadPage()
  }, [])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js?render=6LeEge4rAAAAAPJ7vKCvI9-DcHBNh7B_92UcK2y6'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      const checkRecaptcha = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            setIsRecaptchaReady(true)
          })
        } else {
          setTimeout(checkRecaptcha, 100)
        }
      }
      checkRecaptcha()
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])
const getRecaptchaToken = async () => {
    try {
      if (window.grecaptcha && window.grecaptcha.execute) {
        try {
          await window.grecaptcha.reset()
        } catch (e) {
        }
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const token = await window.grecaptcha.execute('6LeEge4rAAAAAPJ7vKCvI9-DcHBNh7B_92UcK2y6', { action: 'bypass' })
        return token || ""
      }
      return ""
    } catch (error) {
      return ""
    }
  }
  const pollTaskStatus = async (taskId, recaptchaToken) => {
    const maxAttempts = 60
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`https://api.meobypass.click/taskid/${taskId}`)
        const data = await response.json()

        if (data.status === "success") {
          setResult(data.result)
          setShowResult(true)
          setLoading(false)
          return
        } else if (data.status === "error") {
          setError(true)
          setLoading(false)
          setTimeout(() => {
            setError(false)
          }, 2000)
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
      } catch (err) {
        attempts++
      }
    }

    setError(true)
    setLoading(false)
    setTimeout(() => {
      setError(false)
    }, 2000)
  }

  const handleBypass = async () => {
    if (!url) return
    if (!isRecaptchaReady) return

    setLoading(true)
    setError(false)

    try {
      const recaptchaToken = await getRecaptchaToken()

      const bypassUrl = `https://api.meobypass.click/public/bypass?url=${encodeURIComponent(url)}&recaptcha=${recaptchaToken}`

      const response = await fetch(bypassUrl)

      if (response.status === 200) {
        const data = await response.json()

        if (data.task_id) {
          await pollTaskStatus(data.task_id, recaptchaToken)
        } else {
          setError(true)
          setLoading(false)
          setTimeout(() => {
            setError(false)
          }, 2000)
        }
      } else {
        setError(true)
        setLoading(false)
        setTimeout(() => {
          setError(false)
        }, 2000)
      }
    } catch (err) {
      setError(true)
      setLoading(false)
      setTimeout(() => {
        setError(false)
      }, 2000)
    }
  }

  const handleBack = () => {
    setShowResult(false)
    setResult("")
    setUrl("")
    if (window.grecaptcha) {
      try {
        window.grecaptcha.reset()
      } catch (e) {
        setIsRecaptchaReady(false)
        setTimeout(() => {
          if (window.grecaptcha && window.grecaptcha.ready) {
            window.grecaptcha.ready(() => {
              setIsRecaptchaReady(true)
            })
          }
        }, 100)
      }
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;600&display=swap');
        
        body {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          font-optical-sizing: auto;
          font-weight: 600;
          font-style: normal;
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
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .gradient-orb-1 {
          animation: float 20s ease-in-out infinite;
        }
        
        .gradient-orb-2 {
          animation: float 25s ease-in-out infinite reverse;
        }
        
        .gradient-orb-3 {
          animation: float 30s ease-in-out infinite;
        }
      `}</style>

      <div className="absolute inset-0 grid-background pointer-events-none"></div>

      <div
        className="absolute -top-48 -left-48 w-96 h-96 bg-green-700 opacity-10 gradient-orb-1 pointer-events-none"
        style={{
          filter: "blur(80px)",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        }}
      ></div>
      <div
        className="absolute top-20 right-10 w-[500px] h-[500px] bg-green-700 opacity-8 gradient-orb-2 pointer-events-none"
        style={{
          filter: "blur(100px)",
          borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
        }}
      ></div>
      <div
        className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-700 opacity-8 gradient-orb-3 pointer-events-none"
        style={{
          filter: "blur(90px)",
          borderRadius: "70% 30% 50% 50% / 60% 60% 40% 40%",
        }}
      ></div>
      <div
        className="absolute top-1/2 left-10 w-80 h-80 bg-green-700 opacity-5 pointer-events-none"
        style={{
          filter: "blur(70px)",
          animation: "float 22s ease-in-out infinite",
          borderRadius: "40% 60% 60% 40% / 70% 30% 70% 30%",
        }}
      ></div>

      <main className="max-w-3xl w-full text-center space-y-8 relative z-10">
        <div className="space-y-4 pt-16">
          <h1 className="title-font text-7xl md:text-8xl font-semibold tracking-tight leading-tight text-green-500">
            Work Smarter, <span className="block">Not Harder</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-md mx-auto">
            A fast and reliable way to bypass <br />
            Vietnamese shortlinks.
          </p>
        </div>

        <div className="max-w-lg mx-auto pt-8">
          {!showResult ? (
            <div className="flex gap-3">
              <Input
                type="url"
                placeholder="Enter shortlink URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBypass()}
                className="px-4 text-base bg-zinc-800 border-2 border-zinc-700 text-white placeholder:text-gray-500 rounded-lg transition-all outline-none flex-1"
                style={{
                  boxShadow: "none",
                  height: "64px",
                }}
              />

              <Button
                onClick={handleBypass}
                disabled={!url || loading || !isRecaptchaReady}
                className="px-10 rounded-lg transition-all duration-200 disabled:cursor-not-allowed border-0 whitespace-nowrap flex items-center justify-center gap-2 w-32"
                style={{
                  backgroundColor: error ? "#ef4444" : (url && isRecaptchaReady) ? "#22c55e" : "#3f3f46",
                  color: "white",
                  opacity: loading ? 0.5 : 1,
                  height: "64px",
                  transition: "background-color 0.4s ease-in-out, opacity 0.4s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  if (url && !loading && !error && isRecaptchaReady) {
                    e.currentTarget.style.backgroundColor = "#16a34a"
                  }
                }}
                onMouseLeave={(e) => {
                  if (url && !loading && !error && isRecaptchaReady) {
                    e.currentTarget.style.backgroundColor = "#22c55e"
                  }
                }}
              >
                {error ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Bypass
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <div
                  className="flex-1 px-4 py-4 bg-zinc-800 border-2 border-zinc-700 text-white rounded-lg overflow-hidden"
                  style={{
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <p className="text-left truncate">{result.length > 50 ? result.substring(0, 50) + "..." : result}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-4 bg-zinc-800 border-2 border-zinc-700 text-white rounded-lg hover:bg-zinc-700 transition-all"
                  style={{
                    height: "64px",
                    width: "64px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 0.4s ease-in-out, color 0.4s ease-in-out",
                  }}
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <button
                onClick={handleBack}
                className="w-full px-10 py-4 rounded-lg transition-all duration-200 border-0 whitespace-nowrap flex items-center justify-center gap-2 text-white"
                style={{
                  backgroundColor: "#22c55e",
                  height: "64px",
                  transition: "background-color 0.4s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#16a34a"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#22c55e"
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          )}
        </div>

        <div className="pt-10 flex items-center justify-center gap-4 text-sm text-gray-400">
          <a
            href="https://discord.gg/twuwFhzZhH"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-all duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#eab308"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9ca3af"
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            Support ↗
          </a>
          <a
            href="https://discord.gg/twuwFhzZhH"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-all duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#5865F2"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9ca3af"
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Discord ↗
          </a>
          <a
            href="/"
            className="flex items-center gap-2 transition-all duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#30a2e6"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9ca3af"
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            Telegram ↗
          </a>
        </div>

        <div className="pt-11 pb-16 text-sm text-gray-600">
          <p>Copyright (c) 2025 longndev</p>
        </div>
      </main>
    </div>
  )
}
