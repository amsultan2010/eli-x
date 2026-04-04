"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const LEVELS = ["Child", "Teen", "College", "Expert", "Researcher"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  Child: "Simple as a bedtime story",
  Teen: "Real terms, real examples",
  College: "Textbook depth, clear structure",
  Expert: "Full technical precision",
  Researcher: "Cutting-edge nuance",
};

export default function Home() {
  const [concept, setConcept] = useState("");
  const [level, setLevel] = useState<Level>("College");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);
  const [section2Visible, setSection2Visible] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const section2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = section2Ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSection2Visible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const explain = useCallback(
    async (overrideConcept?: string, overrideLevel?: Level, analogyMode?: boolean) => {
      const c = overrideConcept ?? concept;
      const l = overrideLevel ?? level;
      if (!c.trim()) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setResponse("");
      setHasResponse(true);

      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concept: c, level: l, analogyMode }),
          signal: controller.signal,
        });

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const text = JSON.parse(data);
              setResponse((prev) => prev + text);
            } catch {}
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setResponse("Something went wrong. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [concept, level]
  );

  const handleGoDeeper = () => {
    const idx = LEVELS.indexOf(level);
    const newLevel = LEVELS[Math.min(idx + 1, LEVELS.length - 1)];
    setLevel(newLevel);
    explain(undefined, newLevel);
  };

  const handleSimplify = () => {
    const idx = LEVELS.indexOf(level);
    const newLevel = LEVELS[Math.max(idx - 1, 0)];
    setLevel(newLevel);
    explain(undefined, newLevel);
  };

  const handleAnalogy = () => {
    explain(undefined, undefined, true);
  };

  return (
    <div style={{ background: "#FBF9F6" }}>
      {/* ===== SECTION 1: HERO ===== */}
      <section
        className="relative overflow-hidden flex flex-col"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #FBF9F6 0%, #F0EAE0 100%)",
        }}
      >
        {/* Warm radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(217,207,195,0.3) 0%, transparent 70%)",
          }}
        />

        {/* Decorative circles — hidden on mobile */}
        <div
          className="circles-breathe absolute pointer-events-none hidden md:block"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            marginLeft: "28%",
            width: 500,
            height: 500,
          }}
        >
          {[500, 380, 260, 160].map((size) => (
            <div
              key={size}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                border: "1px solid #D9CFC3",
                opacity: size === 500 ? 0.3 : size === 380 ? 0.4 : size === 260 ? 0.5 : 0.6,
              }}
            />
          ))}
        </div>

        {/* Navbar */}
        <nav
          className="relative z-10 flex items-center justify-between w-full"
          style={{ padding: "24px 32px", maxWidth: 1100, margin: "0 auto" }}
        >
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
            <span style={{ color: "#2C2420" }}>ELI-</span>
            <span style={{ color: "#6B4A2F" }}>X</span>
          </div>
          <div
            className="rounded-full"
            style={{
              background: "#F3ECE4",
              border: "1px solid #D9CFC3",
              color: "#6B4A2F",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
            }}
          >
            Free &middot; Powered by Claude
          </div>
        </nav>

        {/* Hero content */}
        <div
          className="relative z-10 flex flex-col items-center justify-center flex-1 text-center"
          style={{ padding: "0 24px", maxWidth: 720, margin: "0 auto" }}
        >
          {/* Tagline pill */}
          <div
            className="rounded-full hero-line-1"
            style={{
              background: "#F3ECE4",
              border: "1px solid #D9CFC3",
              color: "#6B4A2F",
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 18px",
              marginBottom: 28,
            }}
          >
            Understand any concept, at any level
          </div>

          {/* Hero heading */}
          <h1 className="font-serif" style={{ color: "#2C2420", lineHeight: 1.15 }}>
            <span className="hero-line-1 block text-[32px] md:text-[52px]">Learn Anything.</span>
            <span className="hero-line-2 block text-[32px] md:text-[52px]">At Your Level.</span>
            <span className="hero-line-3 block text-[32px] md:text-[52px]">Instantly.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="hero-subtitle"
            style={{
              fontSize: 18,
              color: "#4A4540",
              fontWeight: 400,
              lineHeight: 1.65,
              marginTop: 24,
              maxWidth: 520,
            }}
          >
            Type any concept. Choose your depth. Get a clear explanation tailored to exactly how much you already know.
          </p>

          {/* Hero level pills */}
          <div
            className="hero-pills flex flex-wrap justify-center"
            style={{ gap: 10, marginTop: 32 }}
          >
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="rounded-full"
                style={{
                  background: l === level ? "#6B4A2F" : "#FFFFFF",
                  color: l === level ? "#FFFFFF" : "#6B4A2F",
                  border: `1.5px solid ${l === level ? "#6B4A2F" : "#DDD5CA"}`,
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "8px 20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* CTA button */}
          <a
            href="#explain"
            className="hero-cta inline-block rounded-full"
            style={{
              background: "#6B4A2F",
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 600,
              padding: "14px 36px",
              marginTop: 40,
              transition: "background 0.2s ease, transform 0.2s ease",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#553A24";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#6B4A2F";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Start Explaining &rarr;
          </a>
        </div>
      </section>

      {/* ===== SECTION 2: EXPLANATION ENGINE ===== */}
      <section
        id="explain"
        ref={section2Ref}
        style={{
          background: "#FBF9F6",
          padding: "80px 24px 60px",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* Section heading */}
          <h2
            className={`font-serif text-center ${section2Visible ? "reveal-animate" : ""}`}
            style={{
              fontSize: 32,
              color: "#2C2420",
              marginBottom: 36,
              opacity: section2Visible ? undefined : 0,
            }}
          >
            What do you want to understand?
          </h2>

          {/* Level cards */}
          <div
            className={`flex gap-3 overflow-x-auto pb-2 ${section2Visible ? "reveal-animate" : ""}`}
            style={{
              marginBottom: 28,
              opacity: section2Visible ? undefined : 0,
              animationDelay: "0.1s",
              scrollbarWidth: "none",
            }}
          >
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="flex-shrink-0 rounded-xl text-left"
                style={{
                  flex: "1 1 0",
                  minWidth: 110,
                  padding: "14px 16px",
                  background: l === level ? "#F3ECE4" : "#FFFFFF",
                  border: `1.5px solid ${l === level ? "#6B4A2F" : "#DDD5CA"}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: l === level ? "#6B4A2F" : "#2C2420",
                    marginBottom: 4,
                    transition: "color 0.2s ease",
                  }}
                >
                  {l}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: "#9C9488",
                    lineHeight: 1.4,
                  }}
                >
                  {LEVEL_DESCRIPTIONS[l]}
                </div>
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            className={section2Visible ? "reveal-animate" : ""}
            style={{
              marginBottom: 16,
              opacity: section2Visible ? undefined : 0,
              animationDelay: "0.2s",
            }}
          >
            <input
              type="text"
              placeholder="e.g. How does quantum computing work?"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") explain();
              }}
              className="w-full outline-none"
              style={{
                background: "#FFFFFF",
                border: "1px solid #DDD5CA",
                borderRadius: 12,
                color: "#2C2420",
                fontSize: 18,
                fontWeight: 500,
                padding: "18px 22px",
                transition: "box-shadow 0.2s ease, border-color 0.2s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(107,74,47,0.15)";
                e.currentTarget.style.borderColor = "#6B4A2F";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#DDD5CA";
              }}
            />
          </div>

          {/* Explain button */}
          <div
            className={section2Visible ? "reveal-animate" : ""}
            style={{
              marginBottom: 28,
              opacity: section2Visible ? undefined : 0,
              animationDelay: "0.3s",
            }}
          >
            <button
              onClick={() => explain()}
              disabled={loading || !concept.trim()}
              className="w-full uppercase disabled:opacity-40"
              style={{
                background: "#6B4A2F",
                color: "#FFFFFF",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "1px",
                padding: 18,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = "#553A24";
                  e.currentTarget.style.transform = "scale(1.02)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#6B4A2F";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {loading ? "Generating..." : "Explain It"}
            </button>
          </div>

          {/* Response area */}
          {hasResponse && (
            <div
              className="animate-fade-in-up"
              style={{
                background: "#FFFFFF",
                border: "1px solid #DDD5CA",
                borderRadius: 12,
                padding: 28,
              }}
            >
              {/* Header */}
              <div className="flex items-center" style={{ gap: 8, marginBottom: 20 }}>
                <div
                  className={loading ? "animate-pulse-dot" : ""}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: "#6B4A2F" }}
                />
                <span
                  className="uppercase"
                  style={{ fontSize: 12, fontWeight: 700, color: "#6B4A2F", letterSpacing: "0.08em" }}
                >
                  Explanation
                </span>
              </div>

              {/* Body */}
              <div
                className="markdown-response"
                style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.75, color: "#4A4540" }}
              >
                {loading && !response ? (
                  <span style={{ color: "#9C9488" }}>Thinking...</span>
                ) : (
                  <ReactMarkdown>{response}</ReactMarkdown>
                )}
              </div>

              {/* Action chips */}
              {!loading && response && (
                <div className="flex flex-wrap" style={{ gap: 10, marginTop: 24 }}>
                  {[
                    { label: "Go deeper", action: handleGoDeeper },
                    { label: "Simplify more", action: handleSimplify },
                    { label: "Give me an analogy", action: handleAnalogy },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="rounded-full"
                      style={{
                        background: "rgba(107,74,47,0.08)",
                        border: "1px solid rgba(107,74,47,0.20)",
                        color: "#6B4A2F",
                        fontSize: 14,
                        fontWeight: 600,
                        padding: "10px 18px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(107,74,47,0.15)";
                        e.currentTarget.style.borderColor = "rgba(107,74,47,0.35)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(107,74,47,0.08)";
                        e.currentTarget.style.borderColor = "rgba(107,74,47,0.20)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-between"
            style={{ marginTop: 48, paddingBottom: 16 }}
          >
            <span
              className="uppercase"
              style={{ color: "#B5AFA6", fontSize: 11, fontWeight: 500, letterSpacing: "0.5px" }}
            >
              Built by Abdullah Sultan
            </span>
            <span style={{ color: "#B5AFA6", fontSize: 11, fontWeight: 500 }}>
              Powered by Claude
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
