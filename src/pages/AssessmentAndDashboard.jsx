// src/pages/AssessmentAndDashboard.jsx
import { useEffect, useRef } from "react";
import { generateAnalysis } from "../lib/gemini";
import { exportPdf } from "../lib/exportPdf";

// ── Load html2canvas from CDN once ─────────────────────────────────
function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) { resolve(window.html2canvas); return; }
    const script   = document.createElement("script");
    script.src     = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload  = () => resolve(window.html2canvas);
    script.onerror = () => reject(new Error("html2canvas failed to load"));
    document.head.appendChild(script);
  });
}

// Maps React onboarding userData → dashboard.html iframe field codes
function buildPrefill(userData) {
  const SECTOR_MAP = {
    "Information Technology / SaaS": "IT",
    "Healthcare & Pharma":           "HC",
    "Financial Services / FinTech":  "FS",
    "E-Commerce & Retail":           "EC",
    "Education & EdTech":            "ED",
    "Manufacturing":                 "MF",
    "Real Estate & PropTech":        "RE",
    "Logistics & Supply Chain":      "LG",
    "Media & Entertainment":         "ME",
    "Agriculture & AgroTech":        "AG",
    "Energy & CleanTech":            "EN",
  };

  const BIZ_TYPE_MAP = {
  // Short form — matches OnboardingForm BUSINESS_TYPES values
  "B2B":             "B2B_SME",
  "B2C":             "B2C_MASS",
  "B2B2C":           "B2B_SME",
  "D2C":             "B2C_MASS",
  "Marketplace":     "B2B_SME",
  "SaaS / Platform": "B2B_SME",
  // Long form — kept for backwards compatibility
  "B2B (Business to Business)": "B2B_SME",
  "B2C (Business to Consumer)": "B2C_MASS",
  "D2C (Direct to Consumer)":   "B2C_MASS",
  "Other":                      "B2B_SME",
};

  return {
    organization: userData.organization,
    bizName:      userData.productName   || userData.organization,
    sectorCode:   SECTOR_MAP[userData.sector]       || "OT",
    bizTypeCode:  BIZ_TYPE_MAP[userData.businessType] || "B2B_SME",
    geoCode:      userData.geography     || "PI",
    problem:      userData.problem,
    stage:        userData.stage,
  };
}

const LOADER_STEPS = [
  { n: 1, msg: "Reading your inputs…",                                    pct: 8  },
  { n: 2, msg: "Searching live market data & sector sizing…",             pct: 25 },
  { n: 3, msg: "Fetching real-time competitor profiles & funding data…",  pct: 48 },
  { n: 4, msg: "Calculating TAM/SAM/SOM, scores & 12-month projections…", pct: 75 },
  { n: 5, msg: "Assembling your market intelligence dashboard…",          pct: 95 },
];

// ── onResult(answers, result) is called by App.jsx to save to Supabase
// ── onScreenshot(blob) is called by App.jsx to upload the dashboard image
export default function AssessmentAndDashboard({ userData, onResult, onScreenshot, onRestart }) {
  const iframeRef       = useRef(null);
  const prefillSentRef  = useRef(false);
  const latestResultRef = useRef(null);
  const latestFdRef     = useRef(null);

  function postToIframe(msg) {
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  }

  async function handleSubmit(fd) {
    latestFdRef.current = fd;

    // Drive loader steps
    for (const s of LOADER_STEPS) {
      postToIframe({ type: "INFOPACE_LOADER_STEP", step: s.n, msg: s.msg, pct: s.pct });
      await new Promise(r => setTimeout(r, s.n === 3 ? 150 : 300));
    }

    try {
      const result = await generateAnalysis(userData, fd.answers || {});
      latestResultRef.current = result;

      // ── Save result to Supabase via App.jsx callback ──────────
      if (onResult) {
        onResult(fd.answers || {}, result);
      }

      // Render dashboard in iframe with AI result
      postToIframe({ type: "INFOPACE_RENDER", fd, analysis: result });

      // ── Capture screenshot after dashboard renders (with delay for animations) ──
      captureAndUpload();

    } catch (err) {
      console.warn("Gemini analysis failed, falling back to offline:", err.message);

      // Pass null analysis — dashboard.html will run offlineAnalysis(fd) itself
      postToIframe({ type: "INFOPACE_LOADER_STEP", step: 5, msg: "Building live analysis…", pct: 95 });

      if (onResult) {
        onResult(fd.answers || {}, {});
      }

      setTimeout(() => {
        postToIframe({ type: "INFOPACE_RENDER", fd, analysis: null });
        // Capture screenshot even for offline analysis
        captureAndUpload();
      }, 600);
    }
  }

  // ── Capture the rendered dashboard and save as base64 data URL ──
  async function captureAndUpload() {
    if (!onScreenshot) return;
    try {
      // Wait for Chart.js animations and rendering to finish
      await new Promise(r => setTimeout(r, 3000));

      const html2canvas = await loadHtml2Canvas();
      const iframeDoc = iframeRef.current?.contentDocument
                     || iframeRef.current?.contentWindow?.document;
      if (!iframeDoc) {
        console.warn("⚠️ captureAndUpload: cannot access iframe document");
        return;
      }

      // Target the charts view or fall back to the full dashboard
      const target = iframeDoc.getElementById("viewCharts")
                  || iframeDoc.getElementById("dashShell")
                  || iframeDoc.body;

      const canvas = await html2canvas(target, {
        useCORS:         true,
        allowTaint:      true,
        scale:           1.5,            // balance quality vs size
        backgroundColor: "#EEF2F7",
        logging:         false,
      });

      // Convert canvas to base64 data URL and send to App.jsx
      const dataUrl = canvas.toDataURL("image/png", 0.85);
      if (dataUrl && dataUrl.length > 100) {
        console.log("📸 Dashboard screenshot captured, length:", dataUrl.length, "chars");
        onScreenshot(dataUrl);
      } else {
        console.warn("⚠️ Screenshot capture produced empty result");
      }
    } catch (err) {
      console.warn("⚠️ Screenshot capture failed:", err.message);
    }
  }

  useEffect(() => {
    function handleMessage(event) {
      if (!event.data) return;

      if (event.data.type === "INFOPACE_LOADED") {
        if (!prefillSentRef.current) {
          prefillSentRef.current = true;
          postToIframe({ type: "INFOPACE_PREFILL", userData: buildPrefill(userData) });
        }
      }

      if (event.data.type === "INFOPACE_SUBMIT") {
        handleSubmit(event.data.fd);
      }

      if (event.data.type === "INFOPACE_EXPORT_PDF") {
        handleExportPdf();
      }

      if (event.data.type === "INFOPACE_RESET") {
        onRestart();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [userData]);

  function handleExportPdf() {
    exportPdf({
      userData,
      answers: latestFdRef.current?.answers || {},
      result:  latestResultRef.current || {},
      iframeEl: iframeRef.current,   
    });
  }

  return (
    <iframe
      ref={iframeRef}
      src="/dashboard.html"
      style={{ position: "fixed", inset: 0, border: "none", width: "100%", height: "100%" }}
      title="Infopace Assessment"
      sandbox="allow-scripts allow-same-origin allow-popups allow-downloads"
    />
  );
}
