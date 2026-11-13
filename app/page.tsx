"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BatteryCharging,
  ChevronDown,
  CircleHelp,
  Compass,
  Gauge,
  MapPin,
  Power,
  Radio,
  Thermometer,
  Waves,
  X,
} from "lucide-react";

type Metric = "speed" | "temperature" | "voltage" | "current";
type Category = "thermal" | "power" | "chassis" | "controls" | "location";

type Sample = {
  second: number;
  speed: [number, number, number, number];
  temperature: [number, number, number];
  voltage: number;
  current: number;
};

const history: Sample[] = [
  { second: -60, speed: [47.8, 47.6, 47.9, 47.7], temperature: [28.4, 67.8, 41.8], voltage: 397.6, current: 53.8 },
  { second: -55, speed: [49.0, 49.2, 49.1, 48.9], temperature: [28.6, 68.2, 42.1], voltage: 397.5, current: 56.2 },
  { second: -50, speed: [50.1, 49.8, 50.4, 50.2], temperature: [28.9, 68.5, 42.4], voltage: 397.4, current: 58.8 },
  { second: -45, speed: [51.8, 51.6, 52.0, 51.7], temperature: [29.3, 69.1, 42.7], voltage: 397.2, current: 61.4 },
  { second: -40, speed: [53.3, 53.1, 53.6, 53.4], temperature: [29.8, 69.6, 43.0], voltage: 397.0, current: 64.2 },
  { second: -35, speed: [54.6, 54.4, 54.8, 54.5], temperature: [30.1, 70.3, 43.4], voltage: 396.9, current: 67.5 },
  { second: -30, speed: [55.9, 55.7, 56.2, 56.0], temperature: [30.4, 71.0, 43.8], voltage: 396.8, current: 70.1 },
  { second: -25, speed: [57.0, 56.8, 57.4, 57.1], temperature: [30.8, 71.4, 44.2], voltage: 396.7, current: 72.6 },
  { second: -20, speed: [58.0, 57.8, 58.4, 58.2], temperature: [31.1, 72.0, 44.6], voltage: 396.6, current: 75.3 },
  { second: -15, speed: [59.0, 58.8, 59.3, 59.1], temperature: [31.5, 72.4, 45.0], voltage: 396.5, current: 77.8 },
  { second: -10, speed: [59.8, 59.7, 60.2, 60.0], temperature: [31.7, 73.0, 45.5], voltage: 396.5, current: 79.4 },
  { second: -5, speed: [60.7, 60.5, 61.0, 60.8], temperature: [32.0, 73.7, 46.1], voltage: 396.4, current: 81.1 },
  { second: 0, speed: [61.4, 61.2, 62.1, 61.9], temperature: [32.0, 74.2, 46.8], voltage: 396.4, current: 82.6 },
];

const chartConfig: Record<Metric, { label: string; unit: string; min: number; max: number; ticks: number[]; series: { label: string; color: string; read: (sample: Sample) => number }[] }> = {
  speed: {
    label: "Wheel speed",
    unit: "km/h",
    min: 0,
    max: 100,
    ticks: [0, 25, 50, 75, 100],
    series: [
      { label: "Front left", color: "#3F7BF0", read: (sample) => sample.speed[0] },
      { label: "Front right", color: "#9EBCFF", read: (sample) => sample.speed[1] },
      { label: "Rear left", color: "#F20C62", read: (sample) => sample.speed[2] },
      { label: "Rear right", color: "#FF8FB4", read: (sample) => sample.speed[3] },
    ],
  },
  temperature: {
    label: "Powertrain temperature",
    unit: "°C",
    min: 0,
    max: 160,
    ticks: [0, 40, 80, 120, 160],
    series: [
      { label: "Cell average", color: "#9EBCFF", read: (sample) => sample.temperature[0] },
      { label: "Motor", color: "#F20C62", read: (sample) => sample.temperature[1] },
      { label: "Inverter", color: "#F3F2EF", read: (sample) => sample.temperature[2] },
    ],
  },
  voltage: {
    label: "BMS voltage",
    unit: "V",
    min: 392,
    max: 400,
    ticks: [392, 394, 396, 398, 400],
    series: [{ label: "Pack voltage", color: "#9EBCFF", read: (sample) => sample.voltage }],
  },
  current: {
    label: "BMS current",
    unit: "A",
    min: 0,
    max: 100,
    ticks: [0, 25, 50, 75, 100],
    series: [{ label: "Pack current", color: "#3F7BF0", read: (sample) => sample.current }],
  },
};

const sensorRows: { title: string; category: Category; icon: typeof Thermometer; readings: { label: string; value: string; unit: string }[] }[] = [
  { title: "Battery cell temperature", category: "thermal", icon: Thermometer, readings: [
    { label: "Cell 01", value: "31.8", unit: "°C" }, { label: "Cell 02", value: "32.1", unit: "°C" },
    { label: "Cell 03", value: "31.6", unit: "°C" }, { label: "Cell 04", value: "32.5", unit: "°C" },
    { label: "Cell 05", value: "33.0", unit: "°C" }, { label: "Cell 06", value: "32.8", unit: "°C" },
    { label: "Cell 07", value: "31.9", unit: "°C" }, { label: "Cell 08", value: "32.4", unit: "°C" },
  ] },
  { title: "Motor temperature", category: "thermal", icon: Thermometer, readings: [{ label: "Motor", value: "74.2", unit: "°C" }] },
  { title: "Inverter temperature", category: "thermal", icon: Thermometer, readings: [{ label: "Inverter", value: "46.8", unit: "°C" }] },
  { title: "BMS voltage and current", category: "power", icon: BatteryCharging, readings: [
    { label: "Voltage", value: "396.4", unit: "V" }, { label: "Current", value: "82.6", unit: "A" },
  ] },
  { title: "Suspension travel", category: "chassis", icon: Waves, readings: [
    { label: "Front left", value: "38.2", unit: "mm" }, { label: "Front right", value: "37.6", unit: "mm" },
    { label: "Rear left", value: "42.4", unit: "mm" }, { label: "Rear right", value: "41.8", unit: "mm" },
  ] },
  { title: "Wheel speed", category: "chassis", icon: Gauge, readings: [
    { label: "Front left", value: "61.4", unit: "km/h" }, { label: "Front right", value: "61.2", unit: "km/h" },
    { label: "Rear left", value: "62.1", unit: "km/h" }, { label: "Rear right", value: "61.9", unit: "km/h" },
  ] },
  { title: "Steering angle", category: "chassis", icon: Compass, readings: [{ label: "Angle", value: "+4.8", unit: "°" }] },
  { title: "IMU / accelerometer", category: "chassis", icon: Activity, readings: [
    { label: "X axis", value: "+0.18", unit: "g" }, { label: "Y axis", value: "−0.62", unit: "g" }, { label: "Z axis", value: "+0.97", unit: "g" },
  ] },
  { title: "Throttle position", category: "controls", icon: Activity, readings: [{ label: "TPS", value: "64.8", unit: "%" }] },
  { title: "GPS coordinates", category: "location", icon: MapPin, readings: [
    { label: "Latitude", value: "−7.2823", unit: "°" }, { label: "Longitude", value: "112.7940", unit: "°" },
  ] },
];

const filters: { id: "all" | Category; label: string }[] = [
  { id: "all", label: "All sensors" },
  { id: "thermal", label: "Temperature" },
  { id: "power", label: "Power" },
  { id: "chassis", label: "Chassis" },
  { id: "controls", label: "Controls" },
  { id: "location", label: "GPS" },
];

const categoryLabels: Record<Category, string> = {
  thermal: "Temperature",
  power: "Power",
  chassis: "Chassis",
  controls: "Controls",
  location: "GPS",
};

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function TelemetryChart({ metric, seconds }: { metric: Metric; seconds: 30 | 60 }) {
  const config = chartConfig[metric];
  const points = history.filter((sample) => sample.second >= -seconds);
  const [wrapRef, measured] = useElementWidth<HTMLDivElement>();
  // The viewBox matches the real pixel width, so axis labels are always a true 11px.
  const width = Math.max(measured, 240);
  const height = width < 520 ? 210 : 260;
  const plot = { left: 40, right: width - 14, top: 14, bottom: height - 42 };
  const x = (index: number) => plot.left + (index / Math.max(points.length - 1, 1)) * (plot.right - plot.left);
  const y = (value: number) => plot.bottom - ((value - config.min) / (config.max - config.min)) * (plot.bottom - plot.top);
  const xLabels = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <div className="chart-units"><span>Value · {config.unit}</span><span>5 sec sample interval</span></div>
      <svg className="telemetry-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${config.label} over the last ${seconds} seconds, vertical axis in ${config.unit}`}>
        {config.ticks.map((tick) => (
          <g key={tick}>
            <line x1={plot.left} x2={plot.right} y1={y(tick)} y2={y(tick)} className="chart-gridline" />
            <text x={plot.left - 8} y={y(tick) + 4} textAnchor="end" className="chart-axis-label">{tick}</text>
          </g>
        ))}
        {xLabels.map((index) => (
          <text key={`${index}-${points[index].second}`} x={x(index)} y={height - 14} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} className="chart-axis-label">
            {points[index].second === 0 ? "Now" : `${Math.abs(points[index].second)} sec ago`}
          </text>
        ))}
        {config.series.map((series) => {
          const coordinates = points.map((point, index) => `${x(index)},${y(series.read(point))}`).join(" ");
          return (
            <g key={series.label}>
              <polyline points={coordinates} fill="none" stroke={series.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <circle cx={x(points.length - 1)} cy={y(series.read(points[points.length - 1]))} r="4" fill={series.color} />
            </g>
          );
        })}
      </svg>
      <div className="chart-legend" aria-label="Chart legend">
        {config.series.map((series) => (
          <span key={series.label}><i style={{ backgroundColor: series.color }} />{series.label}</span>
        ))}
      </div>
    </div>
  );
}

function BrandLockup() {
  return (
    <span className="brand-lockup">
      <Image className="brand-mark" src="/anargya-mark.png" alt="" width={600} height={347} unoptimized loading="eager" />
      <span><span className="brand-name">ANARGYA</span><span className="brand-caption">LIVE TELEMETRY</span></span>
    </span>
  );
}

function InstallControl() {
  const [promptEvent, setPromptEvent] = useState<Event | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!showHelp) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowHelp(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showHelp]);

  async function install() {
    if (!promptEvent) {
      setShowHelp(true);
      return;
    }
    const installPrompt = promptEvent as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }

  return (
    <>
      <button className="install-button" type="button" onClick={install} aria-label="Install app on this device">
        <span className="install-glyph">↓</span><span>{installed ? "Installed" : "Install"}</span>
      </button>
      {showHelp && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHelp(false); }}>
          <section className="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-title">
            <div className="dialog-heading"><span className="dialog-icon"><CircleHelp size={18} /></span><button type="button" className="icon-button" aria-label="Close installation help" onClick={() => setShowHelp(false)}><X size={18} /></button></div>
            <h2 id="install-title">Install Anargya Telemetry</h2>
            <p>Use your browser menu to add this dashboard to your home screen. The app shell can then load offline.</p>
            <button type="button" className="dialog-close" onClick={() => setShowHelp(false)}>Got it</button>
          </section>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  const [metric, setMetric] = useState<Metric>("speed");
  const [seconds, setSeconds] = useState<30 | 60>(60);
  const [filter, setFilter] = useState<"all" | Category>("all");
  const visibleSensors = useMemo(() => sensorRows.filter((sensor) => filter === "all" || sensor.category === filter), [filter]);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="#dashboard" aria-label="Anargya, go to overview">
          <BrandLockup />
        </a>
        <div className="sidebar-caption">Vehicle systems</div>
        <nav className="side-nav">
          <a href="#dashboard" className="nav-link active"><Gauge size={17} /><span>Overview</span><span className="nav-index">01</span></a>
          <a href="#telemetry" className="nav-link"><Activity size={17} /><span>Telemetry</span><span className="nav-index">02</span></a>
          <a href="#sensors" className="nav-link"><Waves size={17} /><span>Sensors</span><span className="nav-index">03</span></a>
          <a href="#location" className="nav-link"><MapPin size={17} /><span>GPS location</span><span className="nav-index">04</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-stream"><span className="stream-dot" /><span><strong>Stream offline</strong><small>Local demo data</small></span></div>
          <div className="sidebar-foot"><span>Build 01</span><span>Demo</span></div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><BrandLockup /></div>
          <div className="breadcrumb"><span>Vehicle systems</span><span className="crumb-slash">/</span><strong>Telemetry</strong></div>
          <div className="topbar-right"><span className="demo-chip"><span /> Demo data</span><InstallControl /></div>
        </header>

        <main className="content" id="dashboard">
          <section className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> Vehicle telemetry <span className="eyebrow-muted">/ Preview</span></div><h1>Telemetry overview</h1><p>Monitor vehicle sensor readings from a local simulation.</p></div>
            <div className="session-stamp"><span className="stamp-label">Data source</span><strong>Local simulation</strong><span className="stamp-time">60-second sample window</span></div>
          </section>

          <section className="summary-grid" aria-label="Telemetry summary">
            <article className="summary-card speed-card"><div className="summary-top"><span>Wheel speed</span><Gauge size={17} /></div><div className="summary-value">61.7<span>km/h</span></div><div className="summary-foot"><span>Four-wheel average</span></div></article>
            <article className="summary-card"><div className="summary-top"><span>BMS voltage</span><BatteryCharging size={17} /></div><div className="summary-value">396.4<span>V</span></div><div className="summary-foot"><span>Battery pack</span><span className="sample-tag">Simulated</span></div></article>
            <article className="summary-card"><div className="summary-top"><span>BMS current</span><Power size={17} /></div><div className="summary-value">82.6<span>A</span></div><div className="summary-foot"><span>Battery pack</span><span className="sample-tag">Simulated</span></div></article>
            <article className="summary-card"><div className="summary-top"><span>Motor temperature</span><Thermometer size={17} /></div><div className="summary-value">74.2<span>°C</span></div><div className="summary-foot"><span>Motor</span><span className="sample-tag">Simulated</span></div></article>
          </section>

          <div className="section-heading" id="telemetry"><div><span className="section-number">01</span><h2>Telemetry history</h2><span className="section-note">Simulated samples</span></div><span className="range-context"><Radio size={14} /> Stream offline</span></div>
          <section className="analysis-grid" aria-label="Telemetry chart and GPS location">
            <article className="panel chart-panel">
              <div className="panel-heading"><div><div className="panel-kicker">Telemetry history</div><h3>{chartConfig[metric].label}</h3></div><span className="panel-live"><span /> Demo data</span></div>
              <div className="chart-controls" role="group" aria-label="Choose a chart metric">
                {(["speed", "temperature", "voltage", "current"] as Metric[]).map((option) => (
                  <button key={option} type="button" className={metric === option ? "metric-tab selected" : "metric-tab"} aria-pressed={metric === option} onClick={() => setMetric(option)}>
                    {option === "speed" ? "Wheels" : option === "temperature" ? "Temp" : option === "voltage" ? "Voltage" : "Current"}
                  </button>
                ))}
                <div className="range-select"><label className="sr-only" htmlFor="range">Chart time range</label><select id="range" value={seconds} onChange={(event) => setSeconds(Number(event.target.value) as 30 | 60)}><option value="30">30 sec</option><option value="60">60 sec</option></select><ChevronDown size={13} aria-hidden="true" /></div>
              </div>
              <TelemetryChart metric={metric} seconds={seconds} />
              <div className="chart-foot"><span><span className="foot-dot" /> Fixed 5-second interval</span><span>{seconds === 30 ? "7" : "13"} data points</span></div>
            </article>

            <article className="panel location-panel" id="location">
              <div className="panel-heading"><div><div className="panel-kicker">Vehicle position</div><h3>GPS coordinates</h3></div><span className="gps-mark"><MapPin size={16} /></span></div>
              <div className="coordinate-map" aria-label="Schematic GPS position from simulated data" role="img">
                <div className="map-spotlight" /><div className="map-crosshair horizontal" /><div className="map-crosshair vertical" />
                <div className="map-ring ring-one" /><div className="map-ring ring-two" /><div className="map-ring ring-three" />
                <span className="map-route route-a" /><span className="map-route route-b" /><span className="map-route route-c" />
                <span className="map-pin"><span /></span><span className="map-label">Simulated fix</span><span className="map-axis axis-x">X</span><span className="map-axis axis-y">Y</span>
              </div>
              <div className="coordinates"><div><span>Latitude</span><strong>−7.2823<span>°</span></strong></div><div><span>Longitude</span><strong>112.7940<span>°</span></strong></div></div>
              <div className="location-foot"><span><span className="foot-dot" /> Demo position, not a road map</span><span>GPS</span></div>
            </article>
          </section>

          <div className="section-heading sensor-section-heading" id="sensors"><div><span className="section-number">02</span><h2>Sensor readings</h2><span className="section-note">10 groups</span></div><span className="range-context">All values are simulated</span></div>
          <div className="filter-row" role="group" aria-label="Filter sensors">
            {filters.map((item) => (
              <button type="button" key={item.id} className={filter === item.id ? "filter-chip selected" : "filter-chip"} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}<span>{item.id === "all" ? sensorRows.length : sensorRows.filter((sensor) => sensor.category === item.id).length}</span></button>
            ))}
          </div>
          <section className="sensor-grid" aria-label="Sensor readings">
            {visibleSensors.map((sensor, index) => {
              const SensorIcon = sensor.icon;
              return (
                <article className="sensor-card" key={sensor.title}>
                  <div className="sensor-card-heading"><span className="sensor-icon"><SensorIcon size={16} /></span><div><h3>{sensor.title}</h3><span>Channel {String(sensorRows.indexOf(sensor) + 1).padStart(2, "0")}</span></div><span className="channel-dot" aria-hidden="true" /></div>
                  <div className={`reading-grid ${sensor.readings.length > 4 ? "dense" : ""}`}>
                    {sensor.readings.map((reading) => (
                      <div className="reading" key={reading.label}><span>{reading.label}</span><strong>{reading.value}<small>{reading.unit}</small></strong></div>
                    ))}
                  </div>
                  <div className="sensor-card-foot"><span>Simulated data</span><span>{categoryLabels[sensor.category]}</span></div>
                </article>
              );
            })}
          </section>

          <footer className="page-footer"><span><span className="footer-mark" /> ANARGYA LIVE TELEMETRY <span className="footer-divider">/</span> Preview build</span><span>Values shown are sample data.</span></footer>
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Bottom navigation">
        <a href="#dashboard"><Gauge size={17} /><span>Overview</span></a>
        <a href="#telemetry"><Activity size={17} /><span>Telemetry</span></a>
        <a href="#sensors"><Waves size={17} /><span>Sensors</span></a>
        <a href="#location"><MapPin size={17} /><span>GPS</span></a>
      </nav>
    </div>
  );
}




