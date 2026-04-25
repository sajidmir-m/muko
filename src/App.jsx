import React, { useEffect, useMemo, useRef, useState } from "react";
import { BackgroundFX, FireHeartFX } from "./lib/fx.js";
import { delay, pad2, rafLoop, startHearts } from "./lib/dom.js";

function getNextMidnight(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next;
}

function secondsToMidnight() {
  const now = new Date();
  const target = getNextMidnight(now);
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.floor(ms / 1000));
}

function pub(name) {
  // Vite serves /public at site root. Some filenames include spaces and parentheses.
  return `/${encodeURIComponent(name).replace(/%28/g, "(").replace(/%29/g, ")")}`;
}

const MEDIA = [
  { type: "image", src: "cake.png", caption: "A sweet moment" },
  { type: "image", src: "WhatsApp Image 2026-04-25 at 7.38.59 PM.jpeg", caption: "Us" },
  { type: "image", src: "WhatsApp Image 2026-04-25 at 7.38.59 PM (1).jpeg", caption: "Us" },
  { type: "image", src: "WhatsApp Image 2026-04-25 at 7.38.59 PM (2).jpeg", caption: "Us" },
  { type: "image", src: "WhatsApp Image 2026-04-25 at 7.38.59 PM (3).jpeg", caption: "Us" },
  { type: "image", src: "WhatsApp Image 2026-04-25 at 7.38.59 PM (4).jpeg", caption: "Us" },
  { type: "image", src: "WhatsApp Image 2026-04-25 at 7.38.59 PM (5).jpeg", caption: "Us" },
  { type: "image", src: "WhatsApp Image 2026-04-25 at 7.38.59 PM (6).jpeg", caption: "Us" },
  { type: "image", src: "WhatsApp Image 2026-04-25 at 7.38.59 PM (7).jpeg", caption: "Us" },
  { type: "video", src: "WhatsApp Video 2026-04-25 at 7.39.01 PM.mp4", caption: "A little movie" },
  { type: "video", src: "WhatsApp Video 2026-04-25 at 7.39.01 PM (1).mp4", caption: "A little movie" }
];

const QUOTE =
  "From the moment I met you, my world changed…\n\n" +
  "You became my calm, my chaos, my favorite thought.\n" +
  "Today, I just want you to feel loved—deeply, softly, endlessly.\n\n" +
  "Happy Birthday, Muskan.\n" +
  "Will you be mine… always? ❤️";

async function typeText(setter, text, opts = {}) {
  const { minDelay = 16, maxDelay = 44 } = opts;
  setter("");
  for (let i = 0; i < text.length; i++) {
    setter((prev) => prev + text[i]);
    const jitter = minDelay + Math.random() * (maxDelay - minDelay);
    // eslint-disable-next-line no-await-in-loop
    await delay(jitter);
    if (text[i] === "." || text[i] === "…" || text[i] === "!" || text[i] === "?") {
      // eslint-disable-next-line no-await-in-loop
      await delay(200);
    }
    if (text[i] === "\n") {
      // eslint-disable-next-line no-await-in-loop
      await delay(160);
    }
  }
}

export default function App() {
  const [scene, setScene] = useState("countdown"); // countdown | surprise | heart | memory | gallery
  const [preloadDone, setPreloadDone] = useState(false);
  const [preloadPct, setPreloadPct] = useState(0);
  const [left, setLeft] = useState(secondsToMidnight());

  const [typed, setTyped] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const bgRef = useRef(null);
  const heartRef = useRef(null);
  const surpriseHeartsRef = useRef(null);
  const galleryHeartsRef = useRef(null);
  const videoRef = useRef(null);

  // Optional BGM: drop a file in /public and set this:
  const BGM_SRC = "/bgm.mp3";
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const momentsStartedRef = useRef(false);
  const scrollLockRef = useRef(false);
  const countdownSecRef = useRef(null);
  const surpriseSecRef = useRef(null);
  const heartSecRef = useRef(null);
  const memorySecRef = useRef(null);
  const gallerySecRef = useRef(null);

  const scrollTo = (name) => {
    const map = {
      countdown: countdownSecRef.current,
      surprise: surpriseSecRef.current,
      heart: heartSecRef.current,
      memory: memorySecRef.current,
      gallery: gallerySecRef.current
    };
    const el = map[name];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const timeParts = useMemo(() => {
    const h = Math.floor(left / 3600);
    const m = Math.floor((left % 3600) / 60);
    const s = left % 60;
    return { h: pad2(h), m: pad2(m), s: pad2(s) };
  }, [left]);

  // Update "active" scene based on scroll position (for animations + timers)
  useEffect(() => {
    const sections = [countdownSecRef.current, surpriseSecRef.current, heartSecRef.current, memorySecRef.current, gallerySecRef.current].filter(Boolean);
    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        const el = visible?.target;
        const name = el?.getAttribute("data-scene");
        if (!name) return;
        setScene((prev) => (prev === name ? prev : name));
      },
      { threshold: [0.25, 0.45, 0.65] }
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  // Preload key assets
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setPreloadPct(6);
      const assets = [
        { type: "img", src: "/cake.png" },
        { type: "video", src: "/we.mp4" }
      ];
      let done = 0;
      for (const a of assets) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          if (a.type === "img") {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = a.src;
            return;
          }
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => resolve();
          v.onerror = () => resolve();
          v.src = a.src;
        });
        done += 1;
        if (!mounted) return;
        setPreloadPct(6 + (done / assets.length) * 86);
      }
      if (!mounted) return;
      setPreloadPct(100);
      await delay(250);
      if (!mounted) return;
      setPreloadDone(true);
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  // Background FX
  useEffect(() => {
    if (!bgRef.current) return;
    const fx = new BackgroundFX(bgRef.current);
    const stop = rafLoop((dt) => fx.step(dt));
    const onResize = () => {
      fx.resize();
      fx.seed();
    };
    window.addEventListener("resize", onResize);
    return () => {
      stop();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Countdown interval
  useEffect(() => {
    if (scene !== "countdown") return;
    momentsStartedRef.current = false;
    let go = false;
    const id = setInterval(() => {
      const t = secondsToMidnight();
      setLeft(t);
      if (!go && t <= 0) {
        go = true;
        clearInterval(id);
        void (async () => {
          await delay(250);
          setScene("surprise");
          scrollTo("surprise");
          await delay(2600);
          setScene("heart");
          scrollTo("heart");
        })();
      }
    }, 250);
    // initial
    setLeft(secondsToMidnight());
    if (secondsToMidnight() === 0) {
      clearInterval(id);
      void (async () => {
        await delay(450);
        setScene("surprise");
        scrollTo("surprise");
        await delay(2600);
        setScene("heart");
        scrollTo("heart");
      })();
    }
    return () => clearInterval(id);
  }, [scene]);

  // Surprise hearts
  useEffect(() => {
    if (scene !== "surprise") return;
    if (!surpriseHeartsRef.current) return;
    const stop = startHearts(surpriseHeartsRef.current, { minMs: 180, maxMs: 420, durationMin: 5200, durationMax: 8800 });
    return () => stop();
  }, [scene]);

  // Heart FX
  useEffect(() => {
    if (scene !== "heart") return;
    if (!heartRef.current) return;
    const fx = new FireHeartFX(heartRef.current, "/cake.png");
    const stop = rafLoop((dt) => fx.step(dt));
    return () => stop();
  }, [scene]);

  // Gallery hearts
  useEffect(() => {
    if (scene !== "gallery") return;
    if (!galleryHeartsRef.current) return;
    const stop = startHearts(galleryHeartsRef.current, { minMs: 260, maxMs: 560, durationMin: 6200, durationMax: 9800, soft: true });
    return () => stop();
  }, [scene]);

  // Gallery autoplay
  useEffect(() => {
    if (scene !== "gallery") return undefined;
    const id = setInterval(() => setGalleryIdx((i) => (i + 1) % MEDIA.length), 5200);
    return () => clearInterval(id);
  }, [scene]);

  // Ensure only active slide video plays (muted loop)
  useEffect(() => {
    if (scene !== "gallery") return;
    const root = document.getElementById("slides");
    if (!root) return;
    const videos = Array.from(root.querySelectorAll("video"));
    videos.forEach((v) => v.pause());
    const active = root.querySelector(`[data-idx="${galleryIdx}"] video`);
    if (active) active.play().catch(() => {});
  }, [scene, galleryIdx]);

  // Audio (optional) - user gesture required; button handles it
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.55;
      if (BGM_SRC) audioRef.current.src = BGM_SRC;
    }
  }, []);

  // Start BGM on first user gesture (autoplay-safe)
  useEffect(() => {
    const onFirstGesture = async () => {
      const a = audioRef.current;
      if (!a) return;
      a.muted = muted;
      if (muted) return;
      try {
        await a.play();
      } catch {
        // If still blocked, user can press the button.
      }
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstGesture);
  }, [muted]);

  const toggleMute = async () => {
    const next = !muted;
    setMuted(next);
    const a = audioRef.current;
    if (!a) return;
    if (next) {
      a.muted = true;
      a.pause();
      return;
    }
    a.muted = false;
    if (!BGM_SRC) return;
    try {
      await a.play();
    } catch {
      // autoplay blocked; user can press again after another gesture
    }
  };

  const startMoments = async () => {
    if (momentsStartedRef.current) return;
    momentsStartedRef.current = true;
    setTyped("");
    setShowVideo(true);
    setScene("memory");
    scrollTo("memory");
    await delay(520);

    const v = videoRef.current;
    if (!v) return;
    try {
      // Autoplay is only reliable when muted.
      v.muted = true;
      await v.play();
    } catch {
      v.controls = true;
    }

    // Unmute on the next user gesture (optional)
    const unmuteOnce = () => {
      if (!videoRef.current) return;
      videoRef.current.muted = false;
      videoRef.current.volume = 0.95;
      window.removeEventListener("pointerdown", unmuteOnce);
    };
    window.addEventListener("pointerdown", unmuteOnce, { once: true });

    // Start the typing while video is playing (cinematic + emotional)
    void typeText(setTyped, QUOTE);
  };

  const onMomentsClick = async () => {
    await startMoments();
  };

  const onVideoEnded = async () => {
    await delay(400);
    setScene("gallery");
    scrollTo("gallery");
  };

  // Temporary: jump through scenes so you can preview everything now.
  const previewFlow = async () => {
    momentsStartedRef.current = false;
    setShowVideo(false);
    setTyped("");
    setScene("surprise");
    scrollTo("surprise");
    await delay(1400);
    setScene("heart");
    scrollTo("heart");
  };

  // Auto-advance from Fiery Heart after 5 seconds
  useEffect(() => {
    if (scene !== "heart") return;
    const id = setTimeout(() => {
      void startMoments();
    }, 8000);
    return () => clearTimeout(id);
  }, [scene]);

  // Real scrolling is enabled via CSS scroll-snap; no wheel interception.

  return (
    <>
      {/* Preloader */}
      <div className={`preloader ${preloadDone ? "preloader--done" : ""}`} aria-live="polite">
        <div className="preloader__card glass">
          <div className="preloader__title">Loading something special…</div>
          <div
            className="preloader__bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(preloadPct)}
          >
            <div className="preloader__barFill" style={{ width: `${preloadPct}%` }} />
          </div>
          <div className="preloader__hint">Best experienced with sound on.</div>
        </div>
      </div>

      {/* Ambient background canvas */}
      <canvas ref={bgRef} className="bgfx" aria-hidden="true" />

      {/* Audio control */}
      <div className="topControls">
        <button className="iconBtn glass" type="button" aria-pressed={!muted} aria-label="Toggle sound" onClick={toggleMute}>
          <span className="iconBtn__icon" aria-hidden="true">
            {muted ? "🔇" : "🔊"}
          </span>
          <span className="iconBtn__text">{muted ? "Muted" : "Sound"}</span>
        </button>
      </div>

      <main className="app">
        {/* 1) Countdown */}
        <section ref={countdownSecRef} data-scene="countdown" className={`scene ${scene === "countdown" ? "scene--active" : ""}`}>
          <div className="scene__content glass">
            <div className="kicker">A little magic is coming at</div>
            <h1 className="title glow">Midnight</h1>
            <div className="countdown">
              <div className="countdown__label">Time left</div>
              <div className="countdown__time" aria-label="Countdown timer">
                <span>{timeParts.h}</span>
                <span className="sep">:</span>
                <span>{timeParts.m}</span>
                <span className="sep">:</span>
                <span>{timeParts.s}</span>
              </div>
              <div className="countdown__sub">For you, with all my heart.</div>
            </div>

            <div className="previewRow">
              <button className="previewBtn" type="button" onClick={previewFlow}>
                <span className="previewBtn__bg" aria-hidden="true" />
                <span className="previewBtn__text">Preview Now ✨</span>
              </button>
              <div className="previewHint">Temporary button to test the whole experience.</div>
            </div>
          </div>
          <div className="scene__footer">Stay here… and watch the stars.</div>
        </section>

        {/* 2) Surprise */}
        <section ref={surpriseSecRef} data-scene="surprise" className={`scene ${scene === "surprise" ? "scene--active" : ""}`}>
          <div className="scene__content glass">
            <h2 className="bigGlow">
              Happy Birthday <span className="heart">❤️</span>
            </h2>
            <div className="subGlow">My favorite person.</div>
          </div>
          <div ref={surpriseHeartsRef} className="hearts" aria-hidden="true" />
        </section>

        {/* 3/4) Heart */}
        <section ref={heartSecRef} data-scene="heart" className={`scene ${scene === "heart" ? "scene--active" : ""}`}>
          <div className="scene__content glass heartCard">
            <div className="heartWrap">
              <canvas ref={heartRef} className="heartfx" width="900" height="900" aria-label="Fire heart animation" />
              <div className="heartHint">Watch closely…</div>
            </div>
            <div className="ctaRow">
              <button className="ctaBtn" type="button" onClick={onMomentsClick}>
                <span className="ctaBtn__bg" aria-hidden="true" />
                <span className="ctaBtn__text">Our Moments ❤️</span>
              </button>
            </div>
          </div>
        </section>

        {/* 5/6) Memory */}
        <section ref={memorySecRef} data-scene="memory" className={`scene ${scene === "memory" ? "scene--active" : ""}`}>
          <div className="scene__content glass memoryCard">
            <div className="videoBlock" hidden={!showVideo}>
              <div className="videoFrame">
                <video
                  ref={videoRef}
                  className="video video--cinematic"
                  playsInline
                  preload="metadata"
                  autoPlay
                  muted
                  onEnded={onVideoEnded}
                >
                  <source src="/we.mp4" type="video/mp4" />
                </video>
                <div className="lightLeaks" aria-hidden="true" />
                <div className="sparkles" aria-hidden="true" />
              </div>
              <div className="videoHint">Tap play if it doesn’t start automatically.</div>
            </div>

            <div className="memoryQuote">
              <div className="quoteMark">“</div>
              <p className="typingText" aria-live="polite" style={{ whiteSpace: "pre-wrap" }}>
                {typed}
                <span className="typingCursor">▍</span>
              </p>
              <div className="quoteMark quoteMark--end">”</div>
            </div>
          </div>
        </section>

        {/* 7/8) Gallery */}
        <section ref={gallerySecRef} data-scene="gallery" className={`scene ${scene === "gallery" ? "scene--active" : ""}`}>
          <div className="scene__content glass galleryCard">
            <div className="galleryHeader">
              <div className="galleryTitle">Memories</div>
              <div className="gallerySub">Every frame is a little piece of us.</div>
            </div>

            <div className="collage" aria-label="Collage grid">
              {MEDIA.filter((m) => m.type === "image").map((item) => (
                <button
                  key={`collage-${item.src}`}
                  type="button"
                  className="collageItem"
                  onClick={() => setGalleryIdx(MEDIA.findIndex((x) => x.src === item.src))}
                  aria-label="Open memory"
                >
                  <img className="collageImg" alt="" loading="lazy" decoding="async" src={pub(item.src)} />
                  <span className="collageGlow" aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="carousel" aria-label="Slideshow gallery">
              <button className="navBtn glass" type="button" aria-label="Previous slide" onClick={() => setGalleryIdx((i) => (i - 1 + MEDIA.length) % MEDIA.length)}>
                ‹
              </button>

              <div id="slides" className="slides" aria-live="polite">
                {MEDIA.map((item, idx) => {
                  const active = idx === galleryIdx;
                  return (
                    <div key={`${item.type}-${item.src}`} className={`slide ${active ? "slide--active" : ""}`} data-idx={idx}>
                      {item.type === "image" ? (
                        <img className="slideMedia" alt={item.caption || `Slide ${idx + 1}`} loading="lazy" decoding="async" src={pub(item.src)} />
                      ) : (
                        <video className="slideMedia" playsInline loop muted preload="metadata" src={pub(item.src)} />
                      )}
                      <div className="slideCaption glass">{item.caption || ""}</div>
                    </div>
                  );
                })}
              </div>

              <button className="navBtn glass" type="button" aria-label="Next slide" onClick={() => setGalleryIdx((i) => (i + 1) % MEDIA.length)}>
                ›
              </button>
            </div>

            <div className="ending">
              <div className="ending__text glowSoft">
                Forever with you <span className="heart">❤️</span>
              </div>
            </div>
          </div>
          <div ref={galleryHeartsRef} className="hearts hearts--soft" aria-hidden="true" />
        </section>
      </main>
    </>
  );
}

