"use client";

import Link from "next/link";
import Image from "next/image";
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, DetailedHTMLProps, HTMLAttributes, JSX } from "react";
import { galleryImages, heroMedia } from "./curation";
import type { HeroMedia } from "./curation";

type ModelViewerProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  "auto-rotate"?: boolean;
  "rotation-per-second"?: string;
  "camera-controls"?: boolean;
  "interaction-prompt"?: string;
  exposure?: string;
  "environment-image"?: string;
  style?: CSSProperties;
};

const ModelViewer = (props: ModelViewerProps) =>
  createElement("model-viewer", props);

export function SiteLanding() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SimpleNav />
      <HeroFullBleed />
      <Marquee />
      <main className="mx-auto w-full max-w-7xl px-4 pb-[calc(var(--safe-area-bottom)+3rem)] pt-10 sm:px-6 lg:px-8">
        <Collage />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function SimpleNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/club/LCDA_logo.jpg"
            alt="LCDA 로고"
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/calendar" className="text-white/80 underline-offset-4 hover:text-white hover:underline">캘린더</Link>
          <a href="#gallery" className="text-white/80 underline-offset-4 hover:text-white hover:underline">갤러리</a>
          <div className="flex items-center gap-3">
            <SocialIconLink
              href="https://www.instagram.com/skku_lcda/"
              label="LCDA 인스타그램"
              text="인스타"
              Icon={InstagramIcon}
            />
            <SocialIconLink
              href="https://www.youtube.com/@skkulcda"
              label="LCDA 유튜브"
              text="유튜브"
              Icon={YouTubeIcon}
            />
          </div>
        </nav>
      </div>
    </header>
  );
}

function HeroFullBleed() {
  const sequence = heroMedia;
  const [idx, setIdx] = useState(0);
  const advance = useCallback(
    () => setIdx((v) => (v + 1) % sequence.length),
    [sequence.length],
  );

  useEffect(() => {
    const current = sequence[idx];
    if (current.type === "image") {
      const timeout = setTimeout(advance, 7000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [advance, idx, sequence]);

  return (
    <section className="relative isolate grid min-h-[60vh] grid-rows-[minmax(420px,70vh)] overflow-hidden bg-black">
      <div className="absolute inset-0">
        {sequence.map((item, i) => (
          <div
            key={item.src}
            className="absolute inset-0 transition-opacity duration-[1500ms]"
            style={{ opacity: i === idx ? 1 : 0 }}
          >
            {item.type === "image" ? (
              <HeroImage src={item.src} alt={item.alt ?? "LCDA"} />
            ) : (
              <HeroVideo item={item} active={i === idx} onAdvance={advance} />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay grain" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-4 pb-20 pt-20 text-center sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
        <HeroLogo />
        <p className="mt-8 max-w-[42rem] text-sm uppercase tracking-[0.32em] text-white/60">
          Since 1998. Thunderstruck.
        </p>
        <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-3">
          <Link href="/calendar" className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-black/30 backdrop-blur hover:bg-white">
            캘린더
          </Link>
          <a href="#gallery" className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/10">
            갤러리
          </a>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  return (
    <div className="border-y border-white/10 bg-black/80">
      <div className="marquee whitespace-nowrap py-3 text-sm tracking-wider text-white/70" style={{ animation: "mlr-marquee 20s linear infinite" }}>
        <span className="mx-6">
          SKKU <span className="text-red-500">LCDA</span> ROCK BAND
        </span>
        <span className="mx-6">LIVE • STUDIO • PRACTICE</span>
        <span className="mx-6">
          SKKU <span className="text-red-500">LCDA</span> ROCK BAND
        </span>
        <span className="mx-6">LIVE • STUDIO • PRACTICE</span>
        <span className="mx-6">
          SKKU <span className="text-red-500">LCDA</span> ROCK BAND
        </span>
        <span className="mx-6">LIVE • STUDIO • PRACTICE</span>
      </div>
    </div>
  );
}

function Collage() {
  const images = galleryImages;
  return (
    <section id="gallery" className="mt-10">
      <h2 className="mb-4 text-lg font-semibold tracking-wide">OUR MOMENTS</h2>
      <div className="grid grid-cols-6 gap-3">
        <CollageTile src={images[0]} className="col-span-3 aspect-[4/3] rotate-[-1deg]" />
        <CollageTile src={images[1]} className="col-span-3 aspect-[4/3] rotate-[1deg]" />
        <CollageTile src={images[2]} className="col-span-2 aspect-[4/3]" />
        <CollageTile src={images[3]} className="col-span-2 aspect-[4/3]" />
        <CollageTile src={images[4]} className="col-span-2 aspect-[4/3]" />
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mt-12 rounded-[20px] border border-white/10 bg-neutral-950 p-6 text-center shadow-[var(--shadow-soft)] sm:p-10">
      <h3 className="text-xl font-semibold tracking-wide">WE’RE LOUDER TOGETHER</h3>
      <p className="mx-auto mt-2 max-w-[42rem] text-sm text-white/70">
        2025-2 신입부원 모집중
      </p>
      <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3">
        <Link href="/calendar" className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-black/30 backdrop-blur hover:bg-white">
          캘린더
        </Link>
        <a href="mailto:contact@example.com" className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/10">
          이메일
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10 py-6 text-center text-xs text-white/50">
      <div className="mb-3 flex items-center justify-center gap-4 text-white/70">
        <SocialIconLink
          href="https://www.instagram.com/skku_lcda/"
          label="LCDA 인스타그램"
          text="인스타"
          Icon={InstagramIcon}
        />
        <SocialIconLink
          href="https://www.youtube.com/@skkulcda"
          label="LCDA 유튜브"
          text="유튜브"
          Icon={YouTubeIcon}
        />
      </div>
      © {new Date().getFullYear()} SKKU <span className="text-red-500">LCDA</span>. All rights reserved.
    </footer>
  );
}

function HeroImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) return <Placeholder alt={alt} />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 50vw"
      onError={() => setError(true)}
    />
  );
}

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) return <Placeholder alt={alt} />;
  return (
    <Image src={src} alt={alt} fill className="object-cover" sizes="33vw" onError={() => setError(true)} />
  );
}

function Placeholder({ alt }: { alt: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-900 via-black to-neutral-900 text-xs text-white/50">
      <span className="rounded-full border border-white/20 bg-black/40 px-2 py-1">이미지 추가: {alt}</span>
    </div>
  );
}

function CollageTile({ src, className }: { src: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[14px] border border-white/10 bg-neutral-900 shadow-[var(--shadow-soft)] ${className ?? ''}`}>
      <GalleryImage src={src} alt="LCDA 사진" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay grain" />
    </div>
  );
}

function HeroVideo({
  item,
  active,
  onAdvance,
}: {
  item: Extract<HeroMedia, { type: "video" }>;
  active: boolean;
  onAdvance: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const advancedRef = useRef(false);
  const start = item.start ?? 0;
  const end = item.end;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const startPlayback = () => {
      advancedRef.current = false;
      if (start >= 0) {
        video.currentTime = start;
      }
      if (active) {
        void video.play();
      }
    };

    if (active) {
      if (video.readyState >= 1) {
        startPlayback();
      } else {
        const handleLoaded = () => {
          startPlayback();
        };
        video.addEventListener("loadedmetadata", handleLoaded, { once: true });
        return () => {
          video.removeEventListener("loadedmetadata", handleLoaded);
        };
      }
    } else {
      video.pause();
    }

    return undefined;
  }, [active, start]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || end === undefined) return;

    const handleTimeUpdate = () => {
      if (!active || advancedRef.current) return;
      if (video.currentTime >= end) {
        advancedRef.current = true;
        video.pause();
        onAdvance();
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      advancedRef.current = false;
    };
  }, [active, end, onAdvance]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      src={item.src}
      poster={item.poster}
      muted
      playsInline
    />
  );
}

function HeroLogo() {
  const [viewerReady, setViewerReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.customElements?.get("model-viewer")) {
      setViewerReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-model-viewer]");
    if (existing) {
      existing.addEventListener("load", () => setViewerReady(true), { once: true });
      existing.addEventListener("error", () => setScriptError(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    script.dataset.modelViewer = "true";
    script.onload = () => setViewerReady(true);
    script.onerror = () => setScriptError(true);
    document.head.appendChild(script);
  }, []);

  return (
    <div className="hero-logo-wrapper">
      {viewerReady && !scriptError ? (
        <ModelViewer
          src="/models/base_basic_shaded.glb"
          alt="LCDA 3D Logo"
          auto-rotate
          rotation-per-second="15deg"
          camera-controls
          interaction-prompt="none"
          environment-image="neutral"
          shadow-intensity="0.4"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div className="hero-logo-loading-shell">
          {scriptError ? (
            <span className="hero-logo-loading-error">3D 뷰어 로드 실패</span>
          ) : (
            <span className="hero-logo-loading" />
          )}
        </div>
      )}
    </div>
  );
}

function SocialIconLink({
  href,
  label,
  text,
  Icon,
}: {
  href: string;
  label: string;
  text: string;
  Icon: (props: { className?: string }) => JSX.Element;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex items-center gap-2 text-white/80 transition hover:text-white"
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs tracking-[0.12em]">{text}</span>
    </a>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M21.58 6.2c-.22-.83-.87-1.48-1.7-1.7C18.72 4 12 4 12 4s-6.72 0-7.88.5c-.83.22-1.48.87-1.7 1.7C2 7.38 2 10 2 10s0 2.62.42 3.8c.22.83.87 1.48 1.7 1.7C5.28 16 12 16 12 16s6.72 0 7.88-.5c.83-.22 1.48-.87 1.7-1.7C22 12.62 22 10 22 10s0-2.62-.42-3.8zM10 13.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}
