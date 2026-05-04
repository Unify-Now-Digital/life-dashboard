import React, { useState } from "react";
import { C, styles } from "../lib/tokens";

// Format an ISO timestamp as "today HH:mm" / "yesterday" / "MMM d".
function formatLastSync(iso) {
  if (!iso) return "never";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatusPill({ connected }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 4,
        fontWeight: 500,
        background: connected ? "#EAF3DE" : C.bgSecondary,
        color: connected ? C.success : C.textTertiary,
      }}
    >
      {connected ? "connected" : "not connected"}
    </span>
  );
}

function ActionBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color: C.accent,
        border: `0.5px solid ${C.border}`,
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function Row({ label, feeds, connected, lastSync, onToggle, indent }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        paddingLeft: indent ? 16 : 0,
        borderBottom: `0.5px solid ${C.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: C.text }}>{label}</div>
        <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>
          feeds {feeds} · last sync {formatLastSync(lastSync)}
        </div>
      </div>
      <StatusPill connected={connected} />
      <ActionBtn onClick={onToggle}>{connected ? "Disconnect" : "Connect"}</ActionBtn>
    </div>
  );
}

export default function Integrations({ integrations, onToggle, onToggleStripeAccount }) {
  const [showStripe, setShowStripe] = useState(false);

  const single = [
    { id: "revolut", label: "Revolut", feeds: "finances" },
    { id: "appleHealth", label: "Apple Health", feeds: "metrics, trends, habits" },
    { id: "calendar", label: "Calendar", feeds: "upcoming" },
  ];

  const stripeAccounts = integrations.stripe.accounts;
  const stripeConnectedCount = stripeAccounts.filter((a) => a.connected).length;
  const stripeAnyLast = stripeAccounts
    .map((a) => a.lastSync)
    .filter(Boolean)
    .sort()
    .pop();

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        <span>
          Integrations <span style={styles.sectionSub}>backend wiring pending</span>
        </span>
      </div>

      {single.map((s) => (
        <Row
          key={s.id}
          label={s.label}
          feeds={s.feeds}
          connected={integrations[s.id].connected}
          lastSync={integrations[s.id].lastSync}
          onToggle={() => onToggle(s.id)}
        />
      ))}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 0",
          borderBottom: showStripe ? `0.5px solid ${C.border}` : "none",
          cursor: "pointer",
        }}
        onClick={() => setShowStripe(!showStripe)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: C.text }}>Stripe</div>
          <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>
            feeds businesses, finances · {stripeConnectedCount} of {stripeAccounts.length} accounts · last sync{" "}
            {formatLastSync(stripeAnyLast)}
          </div>
        </div>
        <span style={{ fontSize: 11, color: C.textTertiary }}>{showStripe ? "▾" : "▸"}</span>
      </div>

      {showStripe &&
        stripeAccounts.map((a) => (
          <Row
            key={a.id}
            label={a.label}
            feeds="this account"
            connected={a.connected}
            lastSync={a.lastSync}
            onToggle={() => onToggleStripeAccount(a.id)}
            indent
          />
        ))}
    </div>
  );
}
