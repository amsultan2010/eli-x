"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";

const LEVELS = ["Child", "Teen", "College", "Expert", "Researcher"] as const;
type Level = (typeof LEVELS)[number];

export default function Home() {
  const [concept, setConcept] = useState("");
  const [level, setLevel] = useState<Level>("College");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);
  const [sliderBounce, setSliderBounce] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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

  const triggerBounce = () => {
    setSliderBounce(true);
    setTimeout(() => setSliderBounce(false), 300);
  };

  const handleGoDeeper = () => {
    const idx = LEVELS.indexOf(level);
    const newLevel = LEVELS[Math.min(idx + 1, LEVELS.length - 1)];
    setLevel(newLevel);
    triggerBounce();
    explain(undefined, newLevel);
  };

  const handleSimplify = () => {
    const idx = LEVELS.indexOf(level);
    const newLevel = LEVELS[Math.max(idx - 1, 0)];
    setLevel(newLevel);
    triggerBounce();
    explain(undefined, newLevel);
  };

  const handleAnalogy = () => {
    explain(undefined, undefined, true);
  };

  const sliderPercent = (LEVELS.indexOf(level) / (LEVELS.length - 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16 pt-14 relative">
      {/* Logo */}
      <h1 style={{ fontSize: 42, fontWeight: 500, letterSpacing: "-0.02em" }}>
        <span style={{ color: "#EDEDEF" }}>ELI-</span>
        <span style={{ color: "#F97316" }}>X</span>
      </h1>
      <p style={{ fontSize: 16, color: "#6B7084", fontWeight: 500, marginTop: 6 }}>
        Understand anything, at any level
      </p>

      {/* Main content */}
      <div className="w-full flex flex-col" style={{ maxWidth: 640, marginTop: 48, gap: 28 }}>
        {/* Input */}
        <div>
          <label
            className="block uppercase"
            style={{ fontSize: 13, fontWeight: 600, color: "#6B7084", letterSpacing: "0.05em", marginBottom: 10 }}
          >
            What do you want to understand?
          </label>
          <input
            type="text"
            placeholder="e.g. How does the stock market work?"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") explain();
            }}
            className="w-full outline-none"
            style={{
              background: "#181B24",
              border: "1px solid #262A36",
              borderRadius: 10,
              color: "#EDEDEF",
              fontSize: 18,
              fontWeight: 500,
              padding: "18px 22px",
              transition: "box-shadow 0.2s ease, border-color 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15), 0 0 16px rgba(249,115,22,0.08)";
              e.currentTarget.style.borderColor = "rgba(249,115,22,0.4)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "#262A36";
            }}
          />
        </div>

        {/* Slider */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <label
              className="uppercase"
              style={{ fontSize: 13, fontWeight: 600, color: "#6B7084", letterSpacing: "0.05em" }}
            >
              Explanation Level
            </label>
            <span
              key={level}
              className="rounded-full animate-pill-fade"
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: "3px 14px",
                background: "rgba(249,115,22,0.15)",
                color: "#F97316",
              }}
            >
              {level}
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={LEVELS.indexOf(level)}
              onChange={(e) => {
                setLevel(LEVELS[Number(e.target.value)]);
                triggerBounce();
              }}
              className={`w-full ${sliderBounce ? "bounce" : ""}`}
              style={{
                background: `linear-gradient(to right, #F97316 0%, #F97316 ${sliderPercent}%, #262A36 ${sliderPercent}%, #262A36 100%)`,
                borderRadius: 3,
              }}
            />
            {/* Tick marks */}
            <div className="flex justify-between" style={{ padding: "0 2px", marginTop: 8 }}>
              {LEVELS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 2,
                    height: 6,
                    borderRadius: 1,
                    background: i <= LEVELS.indexOf(level) ? "#F97316" : "#262A36",
                    transition: "background 0.25s ease",
                  }}
                />
              ))}
            </div>
            {/* Labels */}
            <div className="flex justify-between" style={{ marginTop: 6 }}>
              {LEVELS.map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: 13,
                    fontWeight: l === level ? 700 : 500,
                    color: l === level ? "#EDEDEF" : "#6B7084",
                    transition: "color 0.2s ease, font-weight 0.2s ease",
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => explain()}
          disabled={loading || !concept.trim()}
          className="w-full rounded-[10px] disabled:opacity-40 uppercase"
          style={{
            background: "#F97316",
            color: "#0F1117",
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "1px",
            padding: 18,
            transition: "background 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.background = "#FB923C";
              e.currentTarget.style.boxShadow = "0 0 24px rgba(249,115,22,0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#F97316";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {loading ? "Generating..." : "Explain It"}
        </button>

        {/* Response area */}
        {hasResponse && (
          <div
            className="animate-fade-in-up"
            style={{
              background: "#181B24",
              border: "1px solid #262A36",
              borderRadius: 12,
              padding: 24,
              marginTop: 4,
            }}
          >
            {/* Header */}
            <div className="flex items-center" style={{ gap: 8, marginBottom: 20 }}>
              <div
                className={loading ? "animate-pulse-dot" : ""}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "#F97316" }}
              />
              <span
                className="uppercase"
                style={{ fontSize: 13, fontWeight: 600, color: "#6B7084", letterSpacing: "0.05em" }}
              >
                Explanation
              </span>
            </div>

            {/* Body */}
            <div
              className="markdown-response"
              style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.75, color: "#B8BACA" }}
            >
              {loading && !response ? (
                <span style={{ color: "#6B7084" }}>Thinking...</span>
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
                      background: "rgba(249,115,22,0.08)",
                      border: "1px solid rgba(249,115,22,0.20)",
                      color: "#F97316",
                      fontSize: 14,
                      fontWeight: 600,
                      padding: "10px 18px",
                      transition: "background 0.2s ease, border-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(249,115,22,0.15)";
                      e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(249,115,22,0.08)";
                      e.currentTarget.style.borderColor = "rgba(249,115,22,0.20)";
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <p style={{ color: "#3E4254", fontSize: 11, fontWeight: 500, marginTop: "auto", paddingTop: 56 }}>
        Powered by Claude
      </p>

      {/* Built by */}
      <div
        className="fixed uppercase"
        style={{ bottom: 16, left: 16, color: "#3E4254", fontSize: 11, fontWeight: 500, letterSpacing: "0.5px" }}
      >
        Built by Abdullah Sultan
      </div>
    </div>
  );
}
