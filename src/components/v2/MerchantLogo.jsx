import React, { useState } from "react";
import { logoUrl } from "../../lib/merchants.js";

// Soft letter-avatar palette for the logo fallback.
const AVATARS = [
  { bg: "#FAEEDA", color: "#854F0B" },
  { bg: "#EAF3DE", color: "#3B6D11" },
  { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#FAECE7", color: "#993C1D" },
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#E6F1FB", color: "#185FA5" },
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Merchant logo: Clearbit by domain, falling back to a coloured letter-avatar
// when there's no domain or the image fails to load (spec §5.4).
export default function MerchantLogo({ name, domain, size = 30 }) {
  const [failed, setFailed] = useState(false);
  const url = logoUrl(domain);
  const showImg = url && !failed;

  if (showImg) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          objectFit: "contain",
          background: "#fff",
          border: "0.5px solid rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      />
    );
  }

  const a = AVATARS[hash(name || "?") % AVATARS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: a.bg,
        color: a.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}
