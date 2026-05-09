// HealthProject.jsx — Layout C
//
// Adapted from the standalone Health delivery into the project drilldown
// pattern used elsewhere on the dashboard. Reads from `state.projects.health`
// (which v4 storage migration flattens to {weight, waist, food, targets})
// and writes through the same `setState` channel as every other XProject.
//
// Sub-components inside this file:
//   - MetricCard (Weight, Waist) — number + delta + sparkline + edit list
//   - FoodDiary — today bar + scrollable rows + add entry modal
//   - SettingsModal — set targets and goal direction
//
// Macros estimation calls /api/estimate-macros if available, falls back to
// manual entry.

import React, { useState, useRef, useMemo } from "react";
import { C } from "../../lib/tokens";
import { isoDate } from "../../lib/habits";
import "./Health.css";

// ---- Helpers --------------------------------------------------------------

function relativeDay(dateISO) {
  const d = new Date(dateISO + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) {
    const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${dows[d.getDay()]} ${d.getDate()}`;
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// Compress an image File to a base64 string of reasonable size (max 800px, 70% quality)
function compressImage(file, maxDim = 800, quality = 0.7) {
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

// Call serverless function for macro estimation. Falls back gracefully.
async function estimateMacros({ text, image }) {
  try {
    const res = await fetch("/api/estimate-macros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, image }),
    });
    if (!res.ok) throw new Error("estimation failed");
    const data = await res.json();
    return data; // { kcal, protein, carbs, fat }
  } catch (err) {
    return null; // caller falls back to manual entry
  }
}

// ---- Sparkline ------------------------------------------------------------

function Sparkline({ data, valueKey, goodDirection = "down", width = 200, height = 28 }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", color: C.textTertiary, fontSize: 11 }}>
        Need 2+ entries for trend
      </div>
    );
  }
  const values = data.map((d) => d[valueKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  // Direction logic: if values decreasing AND goal is "down" → green
  const trendDown = values[values.length - 1] < values[0];
  const stroke = (trendDown && goodDirection === "down") || (!trendDown && goodDirection === "up")
    ? C.success
    : trendDown === false && goodDirection === "down"
    ? C.danger
    : C.success;
  const lastX = (values.length - 1) * stepX;
  const lastY = height - ((values[values.length - 1] - min) / range) * (height - 4) - 2;
  return (
    <svg
      style={{ width: "100%", height, display: "block", marginTop: 6 }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline points={points.join(" ")} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={stroke} />
    </svg>
  );
}

// ---- Metric card (Weight / Waist) ----------------------------------------

function MetricCard({ label, unit, valueKey, entries, target, goodDirection, onAdd, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [newValue, setNewValue] = useState("");

  const sortedDesc = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries]
  );
  const sortedAsc = useMemo(() => [...sortedDesc].reverse(), [sortedDesc]);

  const latest = sortedDesc[0];
  // Reference for the delta = the entry closest to (but no later than) seven
  // days ago. Falls back to the oldest entry if nothing is that old yet.
  // Surfaces a meaningful weekly change rather than a noisy day-over-day one.
  const weekAgoISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return isoDate(d);
  }, [entries]);
  const weekRef = useMemo(() => {
    const older = sortedDesc.find((e) => e.date <= weekAgoISO);
    return older || sortedDesc[sortedDesc.length - 1] || null;
  }, [sortedDesc, weekAgoISO]);
  const isWeekRef = weekRef && latest && weekRef.date !== latest.date;

  const value = latest ? latest[valueKey] : null;
  const delta =
    latest && weekRef && isWeekRef
      ? +(latest[valueKey] - weekRef[valueKey]).toFixed(1)
      : 0;

  const deltaIsGood =
    (delta < 0 && goodDirection === "down") ||
    (delta > 0 && goodDirection === "up") ||
    delta === 0;

  const deltaArrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "=";
  const deltaColor = delta === 0 ? C.textSecondary : deltaIsGood ? C.success : C.danger;

  const handleAdd = () => {
    const v = parseFloat(newValue);
    if (!isFinite(v)) return;
    onAdd({ date: isoDate(), [valueKey]: v });
    setNewValue("");
  };

  return (
    <div className="hl-card">
      <div className="hl-h">
        <span className="hl-lbl">{label}</span>
        <button className="hl-edit" onClick={() => setEditing((e) => !e)}>
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {value !== null && value !== undefined ? (
        <>
          <div className="hl-metric-num">
            {value}
            <span className="hl-metric-unit"> {unit}</span>
            {isWeekRef && (
              <span
                className="hl-delta-pill"
                style={{ background: deltaIsGood ? "#EAF3DE" : "#FCEBEB", color: deltaColor }}
                title={`vs ${weekRef.date}`}
              >
                {deltaArrow} {Math.abs(delta)} / wk
              </span>
            )}
          </div>
          <Sparkline data={sortedAsc} valueKey={valueKey} goodDirection={goodDirection} />
          <div className="hl-meta">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
            {target && ` · target ${target} ${unit}`}
            {entries.length >= 2 && ` · ${sortedAsc[0][valueKey]} → ${sortedAsc[sortedAsc.length - 1][valueKey]}`}
          </div>
        </>
      ) : (
        <div className="hl-empty">No entries yet. Tap Edit to add one.</div>
      )}

      {editing && (
        <div className="hl-edit-panel">
          <div className="hl-edit-add-row">
            <input
              className="hl-edit-input"
              type="number"
              step="0.1"
              placeholder={`today's ${unit}`}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button className="hl-edit-add-btn" onClick={handleAdd}>
              + Add
            </button>
          </div>

          <div className="hl-history-list">
            {sortedDesc.slice(0, 8).map((entry) => (
              <div key={entry.date} className="hl-history-row">
                <span className="hl-history-date">{entry.date}</span>
                <span className="hl-history-val">
                  {entry[valueKey]} {unit}
                </span>
                <button className="hl-rm" onClick={() => onRemove(entry.date)}>
                  ×
                </button>
              </div>
            ))}
            {sortedDesc.length > 8 && (
              <div className="hl-history-more">+ {sortedDesc.length - 8} older</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Food diary ----------------------------------------------------------

function FoodDiary({ entries, targets, onAdd, onRemove }) {
  const [showAdd, setShowAdd] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const todayISO = isoDate();
  const todayEntries = entries.filter((e) => e.date === todayISO);
  const todayTotals = todayEntries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + (e.kcal || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const sortedDesc = useMemo(
    () => [...entries].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (b.time || "").localeCompare(a.time || "");
    }),
    [entries]
  );

  const targetCal = targets?.calories || 2200;
  const overTarget = todayTotals.kcal > targetCal;

  return (
    <div className="hl-card">
      <div className="hl-h">
        <span className="hl-lbl">Food diary</span>
        <button className="hl-edit" onClick={() => setShowAdd(true)}>
          + Add entry
        </button>
      </div>

      {/* Today bar */}
      <div className="hl-today-bar">
        <div>
          <div className="hl-today-cal">
            {todayTotals.kcal.toLocaleString("en-GB")}
            <span className="hl-metric-unit"> kcal today</span>
          </div>
          <div className="hl-today-macros">
            P {todayTotals.protein}g · C {todayTotals.carbs}g · F {todayTotals.fat}g
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="hl-today-target-lbl">target</div>
          <div
            className="hl-today-target"
            style={{ color: overTarget ? C.danger : C.success }}
          >
            {targetCal.toLocaleString("en-GB")} kcal
          </div>
        </div>
      </div>

      {/* Scrollable rows */}
      {sortedDesc.length === 0 ? (
        <div className="hl-empty">No food logged yet. Tap "Add entry" above to start.</div>
      ) : (
        <div className="hl-food-scroll">
          {sortedDesc.map((entry) => (
            <div key={entry.id} className="hl-food-row">
              <div className="hl-food-date">
                <div>{relativeDay(entry.date)}</div>
                {entry.time && <div className="hl-food-time">{entry.time}</div>}
              </div>
              <div className="hl-food-body">
                <div className="hl-food-text">
                  {entry.text}
                  {entry.images && entry.images.length > 0 && (
                    <button
                      className="hl-food-img-icon"
                      onClick={() => setPreviewImg(entry.images[0])}
                      title="View attached photo"
                    >
                      📎{entry.images.length > 1 ? ` ${entry.images.length}` : ""}
                    </button>
                  )}
                </div>
                <div className="hl-food-macros">
                  P {entry.protein || 0}g · C {entry.carbs || 0}g · F {entry.fat || 0}g
                  {entry.estimatedAt && !entry.manualEdit && (
                    <span className="hl-food-estimated">· est.</span>
                  )}
                </div>
              </div>
              <div className="hl-food-cal-col">
                <div className="hl-food-cal-strong">{entry.kcal || 0}</div>
                <div className="hl-food-cal-sub">kcal</div>
                <button className="hl-rm hl-rm-food" onClick={() => onRemove(entry.id)}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddFoodModal
          onCancel={() => setShowAdd(false)}
          onSave={(entry) => {
            onAdd(entry);
            setShowAdd(false);
          }}
        />
      )}

      {previewImg && (
        <div className="hl-img-preview" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="meal" />
          <button className="hl-img-close" onClick={() => setPreviewImg(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Add food modal ------------------------------------------------------

function AddFoodModal({ onCancel, onSave }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [estimating, setEstimating] = useState(false);
  const [macros, setMacros] = useState({ kcal: "", protein: "", carbs: "", fat: "" });
  const [estimateFailed, setEstimateFailed] = useState(false);
  const fileRef = useRef();

  const handleFiles = async (files) => {
    const arr = Array.from(files).slice(0, 3 - images.length);
    const compressed = await Promise.all(arr.map((f) => compressImage(f)));
    setImages([...images, ...compressed]);
  };

  const handleEstimate = async () => {
    if (!text.trim()) return;
    setEstimating(true);
    setEstimateFailed(false);
    const result = await estimateMacros({ text, image: images[0] || null });
    setEstimating(false);
    if (result) {
      setMacros({
        kcal: String(result.kcal || ""),
        protein: String(result.protein || ""),
        carbs: String(result.carbs || ""),
        fat: String(result.fat || ""),
      });
    } else {
      setEstimateFailed(true);
    }
  };

  const handleSave = () => {
    if (!text.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    onSave({
      id: Date.now(),
      date: isoDate(),
      time,
      text: text.trim(),
      images,
      kcal: parseInt(macros.kcal) || 0,
      protein: parseInt(macros.protein) || 0,
      carbs: parseInt(macros.carbs) || 0,
      fat: parseInt(macros.fat) || 0,
      estimatedAt: !estimateFailed && macros.kcal ? new Date().toISOString() : null,
      manualEdit: estimateFailed || !macros.kcal,
    });
  };

  return (
    <div className="hl-modal-overlay" onClick={onCancel}>
      <div className="hl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hl-modal-h">Add food entry</div>

        <textarea
          className="hl-modal-textarea"
          placeholder="What did you eat? (e.g. 'chicken breast 200g + rice 150g + broccoli')"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          rows={2}
        />

        <div className="hl-modal-imgs">
          {images.map((img, i) => (
            <div key={i} className="hl-modal-img-thumb">
              <img src={img} alt="" />
              <button className="hl-modal-img-rm" onClick={() => setImages(images.filter((_, j) => j !== i))}>
                ×
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <button className="hl-modal-img-add" onClick={() => fileRef.current?.click()}>
              + Photo
            </button>
          )}
          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: "none" }}
          />
        </div>

        <div className="hl-modal-section">
          <div className="hl-modal-section-h">
            <span>Macros</span>
            <button className="hl-modal-estimate" onClick={handleEstimate} disabled={!text.trim() || estimating}>
              {estimating ? "Estimating..." : "Estimate with AI"}
            </button>
          </div>

          {estimateFailed && (
            <div className="hl-modal-warn">
              Estimation unavailable — enter macros manually below or save with kcal=0.
            </div>
          )}

          <div className="hl-modal-macros">
            <label>
              kcal
              <input type="number" value={macros.kcal} onChange={(e) => setMacros({ ...macros, kcal: e.target.value })} />
            </label>
            <label>
              protein
              <input type="number" value={macros.protein} onChange={(e) => setMacros({ ...macros, protein: e.target.value })} />
            </label>
            <label>
              carbs
              <input type="number" value={macros.carbs} onChange={(e) => setMacros({ ...macros, carbs: e.target.value })} />
            </label>
            <label>
              fat
              <input type="number" value={macros.fat} onChange={(e) => setMacros({ ...macros, fat: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="hl-modal-actions">
          <button className="hl-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="hl-modal-save" onClick={handleSave} disabled={!text.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Settings modal ------------------------------------------------------

function SettingsModal({ targets, onSave, onCancel }) {
  const [t, setT] = useState({ ...targets });

  const handleSave = () => {
    onSave({
      weightKg: parseFloat(t.weightKg) || null,
      waistCm: parseFloat(t.waistCm) || null,
      calories: parseInt(t.calories) || 2200,
      proteinG: parseInt(t.proteinG) || 150,
      direction: t.direction || "cut",
    });
  };

  return (
    <div className="hl-modal-overlay" onClick={onCancel}>
      <div className="hl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hl-modal-h">Health targets</div>

        <div className="hl-modal-section">
          <div className="hl-modal-section-h">
            <span>Goal direction</span>
          </div>
          <div className="hl-direction-row">
            {["cut", "maintain", "bulk"].map((opt) => (
              <button
                key={opt}
                className={"hl-direction-btn" + (t.direction === opt ? " active" : "")}
                onClick={() => setT({ ...t, direction: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="hl-modal-section">
          <div className="hl-modal-targets">
            <label>
              <span className="hl-target-lbl">Weight target</span>
              <div className="hl-target-input">
                <input type="number" step="0.1" value={t.weightKg ?? ""} onChange={(e) => setT({ ...t, weightKg: e.target.value })} />
                <span className="hl-target-unit">kg</span>
              </div>
            </label>
            <label>
              <span className="hl-target-lbl">Waist target</span>
              <div className="hl-target-input">
                <input type="number" step="0.5" value={t.waistCm ?? ""} onChange={(e) => setT({ ...t, waistCm: e.target.value })} />
                <span className="hl-target-unit">cm</span>
              </div>
            </label>
            <label>
              <span className="hl-target-lbl">Daily calories</span>
              <div className="hl-target-input">
                <input type="number" value={t.calories ?? ""} onChange={(e) => setT({ ...t, calories: e.target.value })} />
                <span className="hl-target-unit">kcal</span>
              </div>
            </label>
            <label>
              <span className="hl-target-lbl">Daily protein</span>
              <div className="hl-target-input">
                <input type="number" value={t.proteinG ?? ""} onChange={(e) => setT({ ...t, proteinG: e.target.value })} />
                <span className="hl-target-unit">g</span>
              </div>
            </label>
          </div>
        </div>

        <div className="hl-modal-actions">
          <button className="hl-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="hl-modal-save" onClick={handleSave}>
            Save targets
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main component ------------------------------------------------------

const DEFAULT_TARGETS = { weightKg: 78, waistCm: 85, calories: 2200, proteinG: 160, direction: "cut" };

export default function HealthProject({ state, setState, hideHeader }) {
  const health = state.projects.health || {};
  const weight = health.weight || [];
  const waist = health.waist || [];
  const food = health.food || [];
  const targets = { ...DEFAULT_TARGETS, ...(health.targets || {}) };

  const [showSettings, setShowSettings] = useState(false);

  const updateHealth = (patch) =>
    setState((s) => ({
      ...s,
      projects: {
        ...s.projects,
        health: { ...(s.projects.health || {}), ...patch },
      },
    }));

  // Weight handlers — unique per ISO date.
  const addWeight = (entry) =>
    updateHealth({ weight: [...weight.filter((e) => e.date !== entry.date), entry] });
  const removeWeight = (date) =>
    updateHealth({ weight: weight.filter((e) => e.date !== date) });

  // Waist handlers — same shape.
  const addWaist = (entry) =>
    updateHealth({ waist: [...waist.filter((e) => e.date !== entry.date), entry] });
  const removeWaist = (date) =>
    updateHealth({ waist: waist.filter((e) => e.date !== date) });

  // Food entries — unique per id.
  const addFood = (entry) => updateHealth({ food: [...food, entry] });
  const removeFood = (id) => updateHealth({ food: food.filter((e) => e.id !== id) });

  const saveTargets = (next) => {
    updateHealth({ targets: next });
    setShowSettings(false);
  };

  const settingsBtn = (
    <button
      className="hl-settings-btn"
      onClick={() => setShowSettings(true)}
      title="Health targets"
    >
      ⚙
    </button>
  );

  return (
    <div className={hideHeader ? "" : "hl-section"}>
      {hideHeader ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          {settingsBtn}
        </div>
      ) : (
        <div className="hl-section-h">
          <span className="hl-section-title">Health</span>
          {settingsBtn}
        </div>
      )}

      <div className="hl-metrics-row">
        <MetricCard
          label="Weight"
          unit="kg"
          valueKey="kg"
          entries={weight}
          target={targets.weightKg}
          goodDirection={targets.direction === "bulk" ? "up" : "down"}
          onAdd={addWeight}
          onRemove={removeWeight}
        />
        <MetricCard
          label="Waist"
          unit="cm"
          valueKey="cm"
          entries={waist}
          target={targets.waistCm}
          goodDirection="down"
          onAdd={addWaist}
          onRemove={removeWaist}
        />
      </div>

      <FoodDiary
        entries={food}
        targets={targets}
        onAdd={addFood}
        onRemove={removeFood}
      />

      {showSettings && (
        <SettingsModal
          targets={targets}
          onSave={saveTargets}
          onCancel={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
