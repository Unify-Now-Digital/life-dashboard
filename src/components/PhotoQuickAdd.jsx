import React, { useRef, useState } from "react";
import { C } from "../lib/tokens";

// Floating camera button — bottom-left, mirroring the FloatingPills column
// on the right. One tap opens the device camera/photo picker. On select,
// the image is compressed, auto-labelled (via /api/label-image when
// configured) and prepended to the journal as a new entry.
//
// If the labelling API isn't reachable we still create the entry with a
// timestamp label so the shortcut never feels broken.

const isoToday = () => new Date().toISOString().slice(0, 10);
const fmtTime = (d = new Date()) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function compressImage(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function labelImage(dataUrl) {
  try {
    const res = await fetch("/api/label-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataUrl }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default function PhotoQuickAdd({ setState, onCreated }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const file = files[0];
      const dataUrl = await compressImage(file);
      const labelData = await labelImage(dataUrl);
      const fallbackLabel = `Photo · ${fmtTime()}`;
      const label = labelData?.label || fallbackLabel;
      const summary = labelData?.summary || "";

      setState((s) => ({
        ...s,
        projects: {
          ...s.projects,
          journal: {
            ...s.projects.journal,
            entries: [
              {
                id: Date.now(),
                date: isoToday(),
                text: summary,
                label,
                images: [{ id: Date.now(), url: dataUrl }],
                isPrivate: false,
              },
              ...((s.projects.journal && s.projects.journal.entries) || []),
            ],
          },
        },
      }));
      setToast(label);
      setTimeout(() => setToast(null), 2400);
      onCreated && onCreated();
    } catch (err) {
      setToast("Couldn't add photo");
      setTimeout(() => setToast(null), 2400);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />
      <button
        type="button"
        aria-label="Add photo to diary"
        title="Add photo to diary"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        style={{
          position: "fixed",
          left: "max(12px, env(safe-area-inset-left))",
          bottom: "calc(120px + env(safe-area-inset-bottom))",
          width: 44,
          height: 44,
          borderRadius: 22,
          background: busy ? C.bgTertiary : C.bg,
          color: C.accent,
          border: `0.5px solid ${C.borderStrong}`,
          cursor: busy ? "default" : "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 40,
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        {busy ? (
          <span style={{ fontSize: 11, color: C.textSecondary }}>…</span>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        )}
      </button>
      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "calc(180px + env(safe-area-inset-bottom))",
            background: "rgba(0,0,0,0.78)",
            color: "#fff",
            padding: "8px 12px",
            fontSize: 12,
            borderRadius: 10,
            zIndex: 110,
            maxWidth: "min(86vw, 360px)",
            textAlign: "center",
          }}
        >
          {toast === "Couldn't add photo" ? toast : `Added · ${toast}`}
        </div>
      )}
    </>
  );
}
