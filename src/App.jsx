import React, { useEffect, useMemo, useState } from "react";

// --- 3D Print Scale Converter — Dual Tabs with Shared Tips + Toast Copy Everywhere ---

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const round = (v, dp = 3) => (Number.isFinite(v) ? Number(v.toFixed(dp)) : 0);

function inchesToFraction(inches, denom = 16) {
  if (!Number.isFinite(inches)) return { sign: "", whole: 0, num: 0, denom };
  const sign = inches < 0 ? "-" : "";
  const abs = Math.abs(inches);
  const whole = Math.floor(abs);
  const frac = abs - whole;
  const num = Math.round(frac * denom);
  if (num === denom) return { sign, whole: whole + 1, num: 0, denom };
  const g = (a, b) => (b ? g(b, a % b) : a);
  const gg = g(num, denom) || 1;
  return { sign, whole, num: num / gg, denom: denom / gg };
}

const METRIC_UNITS = [
  { key: "mm", label: "Millimetres (mm)", toMM: (v) => v, fromMM: (mm) => mm },
  { key: "cm", label: "Centimetres (cm)", toMM: (v) => v * 10, fromMM: (mm) => mm / 10 },
  { key: "m", label: "Metres (m)", toMM: (v) => v * 1000, fromMM: (mm) => mm / 1000 },
];

const IMPERIAL_UNITS = [
  { key: "in", label: "Inches (in)", toMM: (v) => v * 25.4, fromMM: (mm) => mm / 25.4 },
  { key: "ft", label: "Feet (ft)", toMM: (v) => v * 12 * 25.4, fromMM: (mm) => mm / (12 * 25.4) },
];

const ALL_SCALES = Array.from({ length: 72 }, (_, i) => i + 1);

function toast(msg) {
  const id = "toast-inline";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 text-sm rounded-xl bg-black text-white shadow-lg transition-opacity";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  setTimeout(() => (el.style.opacity = "0"), 1200);
}

export default function App() {
  const [tab, setTab] = useState("measure");
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    document.title = "3D Print Scale Converter";
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-3xl font-extrabold">3D Print Scale Converter</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setTab("measure")}
              className={`px-4 py-2 rounded-xl font-semibold border ${tab === "measure" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"}`}
            >Measurement Converter</button>
            <button
              onClick={() => setTab("scale2scale")}
              className={`px-4 py-2 rounded-xl font-semibold border ${tab === "scale2scale" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"}`}
            >Scale-to-Scale</button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="px-4 py-2 rounded-xl font-semibold border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            >{theme === "dark" ? "Light" : "Dark"} mode</button>
          </div>
        </header>

        {tab === "measure" ? <MeasurementConverter /> : <ScaleToScaleConverter />}

        <SharedTips />
      </div>
    </div>
  );
}

// --- Measurement Converter (original tool) ---
function MeasurementConverter() {
  const [system, setSystem] = useState("metric");
  const [metricUnit, setMetricUnit] = useState("mm");
  const [imperialUnit, setImperialUnit] = useState("in");
  const [inputValue, setInputValue] = useState("100");
  const [scaleN, setScaleN] = useState(10);
  const [inchDenom, setInchDenom] = useState(16);
  const [decimals, setDecimals] = useState(3);

  const unitList = system === "metric" ? METRIC_UNITS : IMPERIAL_UNITS;
  const activeUnitKey = system === "metric" ? metricUnit : imperialUnit;
  const activeUnit = useMemo(() => unitList.find((u) => u.key === activeUnitKey) || unitList[0], [unitList, activeUnitKey]);

  const { mmScaled } = useMemo(() => {
    const num = Number(inputValue);
    if (!Number.isFinite(num)) return { mmScaled: 0 };
    const mmOrig = activeUnit.toMM(num);
    return { mmScaled: mmOrig / scaleN };
  }, [inputValue, activeUnit, scaleN]);

  const metricOut = useMemo(() => ({
    mm: round(mmScaled, decimals),
    cm: round(mmScaled / 10, decimals),
    m: round(mmScaled / 1000, decimals),
  }), [mmScaled, decimals]);

  const imperialOut = useMemo(() => {
    const inches = mmScaled / 25.4;
    const feet = inches / 12;
    const frac = inchesToFraction(inches, inchDenom);
    return { in: round(inches, decimals), ft: round(feet, decimals), frac };
  }, [mmScaled, decimals, inchDenom]);

  const copy = (val, label) => {
    navigator.clipboard.writeText(val.toString());
    toast(`${label} copied`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Measurement Converter (1:n)</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700 space-y-4">
          <label className="block font-medium">Value</label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <label className="block font-medium">System & Unit</label>
          <div className="flex gap-2">
            <button className={`flex-1 px-3 py-2 rounded-xl border ${system === "metric" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800"}`} onClick={() => setSystem("metric")}>Metric</button>
            <button className={`flex-1 px-3 py-2 rounded-xl border ${system === "imperial" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800"}`} onClick={() => setSystem("imperial")}>Imperial</button>
          </div>
          <select className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 mt-2" value={activeUnitKey} onChange={(e) => system === "metric" ? setMetricUnit(e.target.value) : setImperialUnit(e.target.value)}>
            {unitList.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
          </select>
          <label className="block font-medium mt-4">Scale (1:n)</label>
          <select className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950" value={scaleN} onChange={(e) => setScaleN(Number(e.target.value))}>
            {ALL_SCALES.map((n) => <option key={n} value={n}>1:{n}</option>)}
          </select>
          <label className="block font-medium mt-4">Decimal places</label>
          <input type="number" min={0} max={6} className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950" value={decimals} onChange={(e) => setDecimals(clamp(Number(e.target.value), 0, 6))} />
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="font-semibold">Results</h3>
          <p><strong>Metric:</strong> {metricOut.mm} mm | {metricOut.cm} cm | {metricOut.m} m <button onClick={() => copy(metricOut.mm, "mm")} className="ml-2 text-blue-600">Copy</button></p>
          <p><strong>Imperial:</strong> {imperialOut.in} in | {imperialOut.ft} ft | {imperialOut.frac.whole}{imperialOut.frac.num ? ` ${imperialOut.frac.num}/${imperialOut.frac.denom}` : ""} in <button onClick={() => copy(imperialOut.in, "inches")} className="ml-2 text-blue-600">Copy</button></p>
        </div>
      </div>
    </div>
  );
}

// --- Scale-to-Scale Converter ---
function ScaleToScaleConverter() {
  const [fromScale, setFromScale] = useState(14);
  const [toScale, setToScale] = useState(18);

  const percent = useMemo(() => {
    if (!fromScale || !toScale) return 0;
    return ((fromScale / toScale) * 100).toFixed(2);
  }, [fromScale, toScale]);

  const copyPercent = async () => {
    try {
      await navigator.clipboard.writeText(`${percent}%`);
      toast("Copied percentage to clipboard");
    } catch (e) {
      toast("Copy failed");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Scale-to-Scale Converter</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700">
          <label className="block font-medium mb-2">Current Scale (1:n)</label>
          <select className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950" value={fromScale} onChange={(e) => setFromScale(Number(e.target.value))}>
            {ALL_SCALES.map((n) => <option key={n} value={n}>1:{n}</option>)}
          </select>
          <label className="block font-medium mb-2 mt-4">Target Scale (1:n)</label>
          <select className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950" value={toScale} onChange={(e) => setToScale(Number(e.target.value))}>
            {ALL_SCALES.map((n) => <option key={n} value={n}>1:{n}</option>)}
          </select>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center gap-3">
          <p className="text-lg text-gray-700 dark:text-gray-300">Resize model to:</p>
          <p className="text-4xl font-extrabold">{percent}%</p>
          <button
            onClick={copyPercent}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow"
          >Copy %</button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Apply this percentage in your slicer’s scale setting</p>
        </div>
      </div>
    </div>
  );
}

// --- Shared Tips Section ---
function SharedTips() {
  return (
    <section className="mt-12 p-6 rounded-2xl bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4">Tips</h2>
      <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700 dark:text-gray-300">
        <li>Linear dimensions scale by <code>1:n</code>. Areas scale by <code>1:n²</code>; volumes by <code>1:n³</code>.</li>
        <li>Common RC scales: 1:10, 1:12, 1:14, 1:18, 1:24. Miniatures: 1:32, 1:48, 1:72.</li>
        <li>To scale an STL in a slicer: set model scale to <code>100 / n</code>% from 1:1 → 1:n.</li>
        <li>To convert between scales: use the Scale-to-Scale tab for the exact % to enter in your slicer.</li>
      </ul>
    </section>
  );
}
