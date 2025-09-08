import React, { useEffect, useMemo, useState } from "react";

// --- 3D Print Scale Converter — Dark‑Mode Friendly ---
// Viewer‑friendly layout with a theme toggle (respects system preference + persists to localStorage)

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

export default function ScaleConverter() {
  // --- Theme (dark / light) ---
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const [system, setSystem] = useState("metric");
  const [metricUnit, setMetricUnit] = useState("mm");
  const [imperialUnit, setImperialUnit] = useState("in");
  const [inputValue, setInputValue] = useState("100");
  const [scaleN, setScaleN] = useState(10);
  const [inchDenom, setInchDenom] = useState(16);
  const [decimals, setDecimals] = useState(3);

  const unitList = system === "metric" ? METRIC_UNITS : IMPERIAL_UNITS;
  const activeUnitKey = system === "metric" ? metricUnit : imperialUnit;

  const activeUnit = useMemo(
    () => unitList.find((u) => u.key === activeUnitKey) || unitList[0],
    [unitList, activeUnitKey]
  );

  const { mmOriginal, mmScaled } = useMemo(() => {
    const val = Number(String(inputValue).replace(/,/g, ""));
    const v = Number.isFinite(val) ? val : 0;
    const mmOrig = activeUnit.toMM(v);
    const scaled = mmOrig / clamp(scaleN, 1, 72);
    return { mmOriginal: mmOrig, mmScaled: scaled };
  }, [inputValue, activeUnit, scaleN]);

  const metricOut = useMemo(() => {
    const mm = mmScaled;
    return { mm: round(mm, decimals), cm: round(mm / 10, decimals), m: round(mm / 1000, decimals) };
  }, [mmScaled, decimals]);

  const imperialOut = useMemo(() => {
    const inches = mmScaled / 25.4;
    const feet = inches / 12;
    const frac = inchesToFraction(inches, inchDenom);
    return { in: round(inches, decimals), ft: round(feet, decimals), frac };
  }, [mmScaled, decimals, inchDenom]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-1">3D Print Scale Converter</h1>
            <p className="text-lg text-gray-700 dark:text-gray-300">Enter a size in metric or imperial, pick a scale, and see results in both systems.</p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
          >
            <span className="text-sm font-semibold">{theme === "dark" ? "Light" : "Dark"} mode</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              {theme === "dark" ? (
                <path d="M6.76 4.84l-1.8-1.79a.75.75 0 10-1.06 1.06l1.79 1.8a.75.75 0 101.07-1.07zM12 4.5a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 0112 4.5zm5.24.34a.75.75 0 101.07 1.07l1.79-1.8a.75.75 0 10-1.06-1.06l-1.8 1.79zM4.5 12a.75.75 0 01-.75.75v.5a.75.75 0 01-1.5 0v-.5A.75.75 0 012.5 12a.75.75 0 01.75-.75h.5A.75.75 0 014.5 12zm16.25 0a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM6.76 19.16a.75.75 0 10-1.07 1.07l-1.79 1.8a.75.75 0 101.06 1.06l1.8-1.79a.75.75 0 10-1.06-1.06l1.06-1.08zM12 19.5a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM18.76 19.16l1.06 1.08a.75.75 0 001.06 0 .75.75 0 000-1.06l-1.79-1.8a.75.75 0 10-1.07 1.07z" />
              ) : (
                <path d="M21.64 13a9 9 0 11-10.8-10.8 1 1 0 011.2 1.2A7 7 0 1020.44 11.8a1 1 0 011.2 1.2z" />
              )}
            </svg>
          </button>
        </header>

        <section className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6 p-6 rounded-2xl bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-4">Input</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Value</label>
                <input
                  className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter a number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">System & Unit</label>
                <div className="flex gap-3">
                  <button
                    className={`flex-1 px-4 py-2 rounded-xl font-semibold border ${
                      system === "metric"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                    }`}
                    onClick={() => setSystem("metric")}
                  >
                    Metric
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 rounded-xl font-semibold border ${
                      system === "imperial"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                    }`}
                    onClick={() => setSystem("imperial")}
                  >
                    Imperial
                  </button>
                </div>
                <select
                  className="mt-3 w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
                  value={activeUnitKey}
                  onChange={(e) =>
                    system === "metric"
                      ? setMetricUnit(e.target.value)
                      : setImperialUnit(e.target.value)
                  }
                >
                  {unitList.map((u) => (
                    <option key={u.key} value={u.key}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Scale (1:n)</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
                    value={scaleN}
                    onChange={(e) => setScaleN(Number(e.target.value))}
                  >
                    {ALL_SCALES.map((n) => (
                      <option key={n} value={n}>
                        1:{n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Decimal Places</label>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
                    value={decimals}
                    onChange={(e) => setDecimals(clamp(Number(e.target.value), 0, 6))}
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Fractional Inches (1/x)</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
                  value={inchDenom}
                  onChange={(e) => setInchDenom(Number(e.target.value))}
                >
                  {[2, 4, 8, 16, 32, 64].map((d) => (
                    <option key={d} value={d}>
                      1/{d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 rounded-2xl bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-4">Results (1:{scaleN})</h2>
            <div className="grid gap-6">
              <div className="p-4 border rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <h3 className="font-semibold mb-2 text-lg">Metric</h3>
                <p className="text-3xl font-extrabold">{metricOut.mm} <span className="text-base font-semibold">mm</span></p>
                <p className="text-lg">{metricOut.cm} cm</p>
                <p className="text-lg">{metricOut.m} m</p>
              </div>
              <div className="p-4 border rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <h3 className="font-semibold mb-2 text-lg">Imperial</h3>
                <p className="text-3xl font-extrabold">{imperialOut.in} <span className="text-base font-semibold">in</span></p>
                <p className="text-lg">{imperialOut.ft} ft</p>
                <p className="text-lg">
                  {imperialOut.frac.sign}
                  {imperialOut.frac.whole}
                  {imperialOut.frac.num ? (
                    <>
                      {imperialOut.frac.whole ? " " : null}
                      <sup>{imperialOut.frac.num}</sup>/<sub>{imperialOut.frac.denom}</sub> in
                    </>
                  ) : imperialOut.frac.whole ? " in" : "0 in"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 p-6 rounded-2xl bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4">Tips</h2>
          <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700 dark:text-gray-300">
            <li>Linear dimensions scale by <code>1:n</code>. Areas scale by <code>1:n²</code>; volumes by <code>1:n³</code>.</li>
            <li>Common RC scales: 1:10, 1:12, 1:14, 1:18, 1:24. Miniatures: 1:32, 1:48, 1:72.</li>
            <li>To scale an STL in a slicer: set model scale to <code>100 / n</code>% from 1:1 → 1:n.</li>
          </ul>
        </section>

        <footer className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} 3D Print Scale Converter
        </footer>
      </div>
    </div>
  );
}
