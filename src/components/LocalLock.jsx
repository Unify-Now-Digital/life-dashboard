import React, { useEffect, useRef, useState } from "react";
import { C, styles } from "../lib/tokens";
import {
  isLockEnabled,
  isUnlocked,
  markUnlocked,
  setPin as savePin,
  verifyPin,
  skipLock,
  enableFaceId,
  unlockWithFaceId,
  isFaceIdEnabled,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  LOCK_EVENT,
} from "../lib/authLocal";

// Privacy lock that sits in front of the dashboard. Three modes:
//   "setup"  — set a PIN (reached only by tapping "Set a lock", never on load)
//   "unlock" — PIN entry, with a Face ID button if a passkey is registered
//   "open"   — render children
//
// It NEVER prompts on load. A device that's been unlocked once is trusted and
// stays open across reloads ("remember my device"); the unlock screen appears
// only after an explicit lock. Cloud login (Supabase) runs underneath via
// AuthGate.

const PIN_LEN_MIN = 4;
const PIN_LEN_MAX = 8;

export default function LocalLock({ children }) {
  const [mode, setMode] = useState(() => {
    // Open by default. Only show the unlock screen if a lock is set AND the
    // user deliberately locked last time (trust flag cleared). No PIN, or a
    // trusted device → straight in, no prompt.
    if (!isLockEnabled()) return "open";
    return isUnlocked() ? "open" : "unlock";
  });

  // React to an explicit lock request from anywhere (e.g. the header button).
  // If no lock is configured yet, route to setup; otherwise show unlock.
  useEffect(() => {
    const onLock = () => setMode(isLockEnabled() ? "unlock" : "setup");
    window.addEventListener(LOCK_EVENT, onLock);
    return () => window.removeEventListener(LOCK_EVENT, onLock);
  }, []);

  if (mode === "open") return children;

  return (
    <div
      style={{
        ...styles.page,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px 16px",
      }}
    >
      {mode === "setup" && (
        <SetupPanel
          onDone={() => {
            markUnlocked();
            setMode("open");
          }}
          onSkip={() => {
            skipLock();
            setMode("open");
          }}
        />
      )}
      {mode === "unlock" && (
        <UnlockPanel
          onUnlocked={() => {
            markUnlocked();
            setMode("open");
          }}
        />
      )}
    </div>
  );
}

function PinInput({ value, onChange, autoFocus }) {
  const ref = useRef(null);
  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);
  return (
    <input
      ref={ref}
      type="password"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="one-time-code"
      value={value}
      maxLength={PIN_LEN_MAX}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      style={{
        width: "100%",
        textAlign: "center",
        fontSize: 22,
        letterSpacing: "0.5em",
        padding: "12px 14px",
        border: `0.5px solid ${C.borderStrong}`,
        borderRadius: 8,
        fontFamily: "inherit",
        fontVariantNumeric: "tabular-nums",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function PrimaryButton({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: disabled ? C.bgTertiary : C.accent,
        color: disabled ? C.textTertiary : "#fff",
        border: "none",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: "transparent",
        color: C.textSecondary,
        border: `0.5px solid ${C.border}`,
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function SetupPanel({ onDone, onSkip }) {
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [step, setStep] = useState("create"); // "create" | "confirm" | "biometric"
  const [error, setError] = useState(null);
  const [supportsFaceId, setSupportsFaceId] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setSupportsFaceId);
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    setError(null);
    if (pin1.length < PIN_LEN_MIN) {
      setError(`PIN must be at least ${PIN_LEN_MIN} digits.`);
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError(null);
    if (pin1 !== pin2) {
      setError("PINs don't match. Try again.");
      setPin2("");
      return;
    }
    await savePin(pin1);
    if (supportsFaceId) {
      setStep("biometric");
    } else {
      onDone();
    }
  };

  const handleEnableFaceId = async () => {
    setEnabling(true);
    setError(null);
    try {
      await enableFaceId();
      onDone();
    } catch (err) {
      setError("Couldn't register Face ID. PIN still works.");
      setEnabling(false);
    }
  };

  return (
    <div style={{ ...styles.card, maxWidth: 360, width: "100%" }}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
        {step === "biometric" ? "Add Face ID?" : "Set a PIN"}
      </div>
      <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 16 }}>
        {step === "create" && `${PIN_LEN_MIN}-${PIN_LEN_MAX} digits. Stays on this device.`}
        {step === "confirm" && "Type the PIN again to confirm."}
        {step === "biometric" && "Optional. Unlock with Face ID or Touch ID instead of typing."}
      </div>

      {step === "create" && (
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 10 }}>
            <PinInput value={pin1} onChange={setPin1} autoFocus />
          </div>
          {error && <div style={errorStyle}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton type="submit" disabled={pin1.length < PIN_LEN_MIN}>
              Continue
            </PrimaryButton>
            <GhostButton onClick={onSkip}>Skip — leave dashboard unlocked</GhostButton>
          </div>
        </form>
      )}

      {step === "confirm" && (
        <form onSubmit={handleConfirm}>
          <div style={{ marginBottom: 10 }}>
            <PinInput value={pin2} onChange={setPin2} autoFocus />
          </div>
          {error && <div style={errorStyle}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton type="submit" disabled={pin2.length < PIN_LEN_MIN}>
              Set PIN
            </PrimaryButton>
            <GhostButton
              onClick={() => {
                setStep("create");
                setPin1("");
                setPin2("");
                setError(null);
              }}
            >
              Back
            </GhostButton>
          </div>
        </form>
      )}

      {step === "biometric" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {error && <div style={errorStyle}>{error}</div>}
          <PrimaryButton onClick={handleEnableFaceId} disabled={enabling}>
            {enabling ? "Registering…" : "Enable Face ID / Touch ID"}
          </PrimaryButton>
          <GhostButton onClick={onDone}>Skip for now</GhostButton>
        </div>
      )}
    </div>
  );
}

function UnlockPanel({ onUnlocked }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const faceIdReady = isFaceIdEnabled() && isWebAuthnSupported();
  const triedFaceIdRef = useRef(false);

  // Auto-trigger Face ID once on mount when enabled. The OS prompt is
  // a deliberate gesture so this is safe, and matches native app behaviour.
  useEffect(() => {
    if (!faceIdReady || triedFaceIdRef.current) return;
    triedFaceIdRef.current = true;
    let alive = true;
    (async () => {
      setBiometricBusy(true);
      const ok = await unlockWithFaceId();
      if (!alive) return;
      setBiometricBusy(false);
      if (ok) onUnlocked();
    })();
    return () => {
      alive = false;
    };
  }, [faceIdReady, onUnlocked]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    const ok = await verifyPin(pin);
    setVerifying(false);
    if (ok) {
      onUnlocked();
    } else {
      setError("Wrong PIN.");
      setPin("");
    }
  };

  const tryFaceId = async () => {
    setBiometricBusy(true);
    setError(null);
    const ok = await unlockWithFaceId();
    setBiometricBusy(false);
    if (ok) onUnlocked();
    else setError("Face ID didn't recognise. Use your PIN.");
  };

  return (
    <div style={{ ...styles.card, maxWidth: 360, width: "100%" }}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Locked</div>
      <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 16 }}>
        Enter your PIN to continue.
      </div>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 10 }}>
          <PinInput value={pin} onChange={setPin} autoFocus />
        </div>
        {error && <div style={errorStyle}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <PrimaryButton type="submit" disabled={pin.length < PIN_LEN_MIN || verifying}>
            {verifying ? "Checking…" : "Unlock"}
          </PrimaryButton>
          {faceIdReady && (
            <GhostButton onClick={tryFaceId} disabled={biometricBusy}>
              {biometricBusy ? "Waiting for Face ID…" : "Use Face ID / Touch ID"}
            </GhostButton>
          )}
        </div>
      </form>
    </div>
  );
}

const errorStyle = {
  fontSize: 12,
  color: C.danger,
  marginBottom: 10,
};
