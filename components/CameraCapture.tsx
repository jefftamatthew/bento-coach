"use client";

import { useEffect, useRef, useState } from "react";
import { shotFrom, shotFromFile, type Shot } from "@/lib/image";

export function CameraCapture({ onShot }: { onShot: (shot: Shot) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"starting" | "live" | "unavailable">("starting");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        setMessage(
          window.isSecureContext
            ? "This browser can't open the camera. Upload a photo instead."
            : "The camera needs HTTPS. Upload a photo instead, or open the app over https://.",
        );
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setStatus("live");
      } catch (err) {
        setStatus("unavailable");
        const name = err instanceof DOMException ? err.name : "";
        setMessage(
          name === "NotAllowedError"
            ? "Camera permission was blocked. Allow it in your browser, or upload a photo."
            : name === "NotFoundError"
              ? "No camera found. Upload a photo instead."
              : "Couldn't start the camera. Upload a photo instead.",
        );
      }
    }

    start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    onShot(shotFrom(video));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      onShot(await shotFromFile(file));
    } catch {
      setMessage("Couldn't read that image. Try a JPEG or PNG.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${status === "live" ? "" : "hidden"}`}
        />
        {status === "live" && (
          <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-white/50" />
        )}
        {status !== "live" && (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-white/80">
            {status === "starting" ? "Starting camera…" : message}
          </div>
        )}
      </div>

      {status === "live" && (
        <p className="text-center text-sm text-muted">Fit the whole plate or tray inside the frame.</p>
      )}

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold"
        >
          Upload photo
        </button>
        {status === "live" && (
          <button
            type="button"
            onClick={capture}
            aria-label="Take photo"
            className="h-18 w-18 rounded-full border-4 border-accent bg-card shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            <span className="m-auto block h-13 w-13 rounded-full bg-accent" />
          </button>
        )}
      </div>
      {status === "live" && message && <p className="text-center text-sm text-warn-ink">{message}</p>}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
    </div>
  );
}
