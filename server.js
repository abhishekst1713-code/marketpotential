// ================================================================
//  Infopace Proxy Server — Gemini + Gmail SMTP Edition
//
//  EMAIL SETUP (2 steps only):
//  1. Gmail → myaccount.google.com → Security
//     → 2-Step Verification → ON
//     → App Passwords → create one → copy the 16-char password
//  2. Paste it into GMAIL_APP_PASSWORD below
//
//  ⚠  If email hangs: your network blocks SMTP ports.
//     Switch to mobile hotspot and try again.
//
//  TWO OPTIONAL GEMINI KEYS (both, one, or none — all work):
//  Get free keys at: https://aistudio.google.com
// ================================================================

const GMAIL_USER         = 'abhishekst1713@gmail.com';
const GMAIL_APP_PASSWORD = 'rjhm nbsx alvu fbje';   // Gmail App Password

const API_KEY_QUESTIONS  = '';   // ← optional: Gemini key for question generation
const API_KEY_ANALYSIS   = '';   // ← optional: Gemini key for report analysis

// ── Models & token limits ────────────────────────────────────────
const MODEL_QUESTIONS  = 'gemini-2.5-flash';
const MODEL_ANALYSIS   = 'gemini-2.5-flash';
const TOKENS_QUESTIONS = 4096;
const TOKENS_ANALYSIS  = 16000;

// ── Dependencies ─────────────────────────────────────────────────
const http       = require('http');
const https      = require('https');
const fs         = require('fs');
const path       = require('path');
const nodemailer = require('nodemailer');
const PORT       = 4000;

const MIME = {
  '.html':'text/html', '.js':'application/javascript',
  '.css':'text/css',   '.json':'application/json',
  '.png':'image/png',  '.ico':'image/x-icon', '.txt':'text/plain'
};

// ── Gmail SMTP transporter ───────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host:              'smtp.gmail.com',
    port:              587,
    secure:            false,
    requireTLS:        true,
    family:            4,
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     15000,
    tls: { rejectUnauthorized: false },
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
}

// ── Gemini request helper ────────────────────────────────────────
function geminiRequest(apiKey, model, maxTokens, promptText, callback) {
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature:      0.7,
      maxOutputTokens:  maxTokens,
      responseMimeType: 'text/plain'
    }
  });
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path:     '/v1beta/models/' + model + ':generateContent?key=' + apiKey,
    method:   'POST',
    headers: {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };
  const req = https.request(options, res => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => callback(null, res.statusCode, body));
  });
  req.on('error', e => callback(e, null, null));
  req.write(payload);
  req.end();
}

// ── Build HTML report email ──────────────────────────────────────
function buildReportEmail(d) {
  const esc  = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const year = new Date().getFullYear();
  const now  = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

  const scoreColor = d.overallScore >= 70 ? '#059669' : d.overallScore >= 50 ? '#1a56db' : '#dc2626';
  const gradeColor = (d.grade === 'Excellent' || d.grade === 'Strong') ? '#059669'
                   : d.grade === 'Moderate' ? '#d97706' : '#dc2626';

  const sectionHead = function(title, color) {
    color = color || '#1144a0';
    return '<tr><td style="padding:28px 32px 8px;">'
      + '<div style="font-size:11px;font-weight:700;letter-spacing:.14em;color:' + color + ';'
      + 'text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid ' + color + '22;">'
      + esc(title) + '</div></td></tr>';
  };

  const barRow = function(label, value) {
    const pct = Math.min(100, Math.max(0, value || 0));
    const bc  = pct >= 70 ? '#059669' : pct >= 50 ? '#1a56db' : '#d97706';
    return '<tr>'
      + '<td style="padding:5px 32px;font-size:11px;color:#4a6080;width:160px;">' + esc(label) + '</td>'
      + '<td style="padding:5px 8px 5px 0;">'
      + '<table cellpadding="0" cellspacing="0" width="200"><tr>'
      + '<td style="background:#e2e8f0;border-radius:4px;height:8px;width:200px;font-size:0;">'
      + '<table cellpadding="0" cellspacing="0"><tr>'
      + '<td style="background:' + bc + ';height:8px;width:' + (pct * 2) + 'px;border-radius:4px;font-size:0;">&nbsp;</td>'
      + '</tr></table></td></tr></table></td>'
      + '<td style="padding:5px 32px 5px 0;font-size:11px;font-weight:700;color:' + bc + ';font-family:monospace;">' + pct + '/100</td>'
      + '</tr>';
  };

  const bulletList = function(items, bulletColor, prefix) {
    return (items || []).map(function(item) {
      return '<tr><td style="padding:6px 32px;font-size:12px;color:#1e3050;line-height:1.65;">'
        + '<span style="color:' + bulletColor + ';font-weight:700;margin-right:8px;">' + prefix + '</span>'
        + esc(String(item)) + '</td></tr>';
    }).join('');
  };

  // Dimension bars
  const dims = d.dimensions || {};
  const dimDefs = [
    { k:'marketSize',       l:'Market Size'       },
    { k:'audienceQuality',  l:'Audience Quality'  },
    { k:'competitionEdge',  l:'Competitive Edge'  },
    { k:'revenuePotential', l:'Revenue Potential' },
    { k:'riskProfile',      l:'Risk Management'   },
    { k:'sectorFit',        l:'Sector Alignment'  },
  ];
  const dimRows = dimDefs.map(function(dd) { return barRow(dd.l, dims[dd.k] || 0); }).join('');

  // Dimension explanations
  const dimExpl = d.dimensionExplanations || {};
  const dimExplRows = dimDefs.map(function(dd) {
    const expl = dimExpl[dd.k];
    if (!expl) return '';
    const v  = dims[dd.k] || 0;
    const bc = v >= 70 ? '#059669' : v >= 50 ? '#1a56db' : '#d97706';
    return '<tr><td style="padding:8px 32px;border-bottom:1px solid #f0f4ff;">'
      + '<span style="display:inline-block;background:' + bc + '18;border:1px solid ' + bc + '30;'
      + 'border-radius:4px;padding:2px 8px;font-size:10px;font-weight:700;color:' + bc + ';'
      + 'margin-right:10px;font-family:monospace;">' + v + '</span>'
      + '<span style="font-size:11px;font-weight:600;color:#1e3050;">' + esc(dd.l) + '</span>'
      + '<div style="font-size:12px;color:#4a6080;line-height:1.65;margin-top:4px;">' + esc(expl) + '</div>'
      + '</td></tr>';
  }).join('');

  // Investor readiness
  const ir = d.investorReadiness || {};
  const irScore = ir.score || 0;
  const irColor = irScore >= 70 ? '#059669' : irScore >= 50 ? '#1a56db' : '#dc2626';

  // Competitors
  const borderColors = ['#1a56db','#86198f','#10b981'];
  const compRows = (d.competitorProfiles || []).slice(0, 3).map(function(c, i) {
    const bc = borderColors[i] || '#1a56db';
    return '<tr><td style="padding:12px 32px;border-bottom:1px solid #e2e8f0;">'
      + '<table width="100%" cellpadding="0" cellspacing="0"><tr>'
      + '<td style="border-left:3px solid ' + bc + ';padding-left:12px;">'
      + '<div style="font-size:13px;font-weight:700;color:#061228;">' + esc(c.name || '') + '</div>'
      + '<div style="font-size:10px;color:#6080a0;margin-top:2px;">' + esc(c.stage || '') + ' &nbsp;·&nbsp; ~' + (c.marketSharePct || 0) + '% share</div>'
      + '<table width="100%" cellpadding="0" cellspacing="4" style="margin-top:8px;">'
      + (c.strength   ? '<tr><td width="90" style="font-size:9px;font-weight:700;color:#059669;text-transform:uppercase;vertical-align:top;">Strength</td><td style="font-size:11px;color:#1e3050;">' + esc(c.strength) + '</td></tr>' : '')
      + (c.weakness   ? '<tr><td style="font-size:9px;font-weight:700;color:#92400e;text-transform:uppercase;vertical-align:top;">Gap</td><td style="font-size:11px;color:#1e3050;">' + esc(c.weakness) + '</td></tr>' : '')
      + (c.counterMove ? '<tr><td style="font-size:9px;font-weight:700;color:#dc2626;text-transform:uppercase;vertical-align:top;">Counter-Move</td><td style="font-size:11px;color:#1e3050;">' + esc(c.counterMove) + '</td></tr>' : '')
      + (c.howToBeat  ? '<tr><td style="font-size:9px;font-weight:700;color:#1144a0;text-transform:uppercase;vertical-align:top;">How to Beat</td><td style="font-size:11px;color:#1e3050;font-weight:600;">' + esc(c.howToBeat) + '</td></tr>' : '')
      + '</table></td></tr></table></td></tr>';
  }).join('');

  // Risk mitigations
  const riskRows = (d.riskMitigations || []).map(function(r) {
    const pc = r.probability === 'High' ? '#dc2626' : r.probability === 'Medium' ? '#d97706' : '#059669';
    return '<tr><td style="padding:10px 32px;border-bottom:1px solid #f0f4ff;">'
      + '<span style="font-size:9px;font-weight:700;color:#fff;background:' + pc + ';padding:2px 8px;border-radius:3px;margin-right:10px;">' + esc(r.probability || '') + '</span>'
      + '<span style="font-size:12px;font-weight:600;color:#1e3050;">' + esc(r.risk || '') + '</span>'
      + '<div style="font-size:11px;color:#4a6080;line-height:1.6;margin-top:4px;">&#8594; ' + esc(r.mitigation || '') + '</div>'
      + (r.window ? '<div style="font-size:10px;color:#94a3b8;margin-top:3px;font-style:italic;">Window: ' + esc(r.window) + '</div>' : '')
      + '</td></tr>';
  }).join('');

  // Recommendations
  const recBorderColors = ['#dc2626','#1144a0','#1144a0','#6080a0','#6080a0'];
  const recRows = (d.recommendations || []).slice(0, 5).map(function(r, i) {
    const rc      = recBorderColors[i] || '#6080a0';
    const urgency = i === 0 ? 'DO NOW' : i <= 2 ? 'DO SOON' : 'PLAN';
    return '<tr><td style="padding:0 32px 12px;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ' + rc + '30;border-radius:8px;overflow:hidden;">'
      + '<tr>'
      + '<td width="52" style="background:' + rc + '12;padding:12px 8px;text-align:center;border-right:1px solid ' + rc + '20;vertical-align:middle;">'
      + '<div style="font-family:monospace;font-size:22px;font-weight:700;color:' + rc + ';">' + (r.rank || i + 1) + '</div>'
      + '<div style="font-size:8px;font-weight:700;color:' + rc + ';opacity:.7;text-transform:uppercase;">' + urgency + '</div>'
      + '</td>'
      + '<td style="padding:12px 16px;vertical-align:top;">'
      + '<div style="font-size:13px;font-weight:700;color:#061228;line-height:1.5;margin-bottom:6px;">' + esc(r.action || '')
      + (r.timeline ? ' <span style="font-size:9px;font-weight:700;color:#fff;background:' + rc + ';padding:2px 8px;border-radius:3px;margin-left:6px;">' + esc(r.timeline) + '</span>' : '')
      + '</div>'
      + (r.expectedOutcome ? '<div style="font-size:11px;color:#059669;line-height:1.55;margin-bottom:4px;"><strong>Outcome:</strong> ' + esc(r.expectedOutcome) + '</div>' : '')
      + (r.whyNow ? '<div style="font-size:11px;color:#dc2626;line-height:1.55;"><strong>Why now:</strong> ' + esc(r.whyNow) + '</div>' : '')
      + '</td></tr></table></td></tr>';
  }).join('');

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
    + '<title>Market Intelligence Report</title></head>'
    + '<body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;">'
    + '<tr><td align="center" style="padding:24px 16px;">'
    + '<table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:640px;width:100%;box-shadow:0 4px 24px rgba(6,18,40,.10);">'

    // Header
    + '<tr><td style="background:#061228;padding:20px 32px;">'
    + '<table cellpadding="0" cellspacing="0"><tr>'
    + '<td style="width:36px;height:36px;background:#1a56db;border-radius:8px;text-align:center;vertical-align:middle;font-family:monospace;font-size:11px;font-weight:bold;color:#fff;">IP</td>'
    + '<td style="padding-left:12px;"><div style="font-size:13px;font-weight:bold;color:#fff;letter-spacing:.1em;text-transform:uppercase;">Infopace</div>'
    + '<div style="font-size:9px;color:#93c5fd;letter-spacing:.1em;text-transform:uppercase;margin-top:2px;">Market Intelligence Report</div>'
    + '</td></tr></table></td></tr>'

    // Hero
    + '<tr><td style="background:#0d2040;padding:28px 32px 24px;">'
    + '<div style="font-size:11px;font-weight:bold;letter-spacing:.16em;color:#93c5fd;text-transform:uppercase;margin-bottom:8px;">' + esc(d.sector || '') + ' &nbsp;·&nbsp; ' + esc(d.geo || '') + '</div>'
    + '<div style="font-size:26px;font-weight:bold;color:#fff;letter-spacing:-.02em;line-height:1.2;margin-bottom:10px;">' + esc(d.bizName || 'Your Product') + '</div>'
    + '<div style="font-size:13px;color:rgba(255,255,255,.65);line-height:1.7;max-width:480px;">' + esc(d.verdict || '') + '</div>'
    + '<table cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr>'
    + '<td style="background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:12px 20px;text-align:center;">'
    + '<div style="font-family:monospace;font-size:28px;font-weight:bold;color:' + scoreColor + ';">' + (d.overallScore || '—') + '</div>'
    + '<div style="font-size:9px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">Overall Score</div></td>'
    + '<td width="10"></td>'
    + '<td style="background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:12px 20px;text-align:center;">'
    + '<div style="font-size:16px;font-weight:bold;color:' + gradeColor + ';">' + esc(d.grade || '—') + '</div>'
    + '<div style="font-size:9px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">Grade</div></td>'
    + '<td width="10"></td>'
    + '<td style="background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:12px 20px;text-align:center;">'
    + '<div style="font-family:monospace;font-size:16px;font-weight:bold;color:#93c5fd;">&#8593; ' + (d.growthRate || 0) + '%</div>'
    + '<div style="font-size:9px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">CAGR</div></td>'
    + '</tr></table></td></tr>'

    // TAM/SAM/SOM
    + '<tr><td style="background:#fff;border-bottom:2px solid #dbeafe;">'
    + '<table width="100%" cellpadding="0" cellspacing="0"><tr>'
    + '<td style="padding:18px 20px;text-align:center;border-right:1px solid #e2e8f0;">'
    + '<div style="font-family:monospace;font-size:20px;font-weight:bold;color:#061228;">&#8377;' + Math.round(d.tamCrore || 0) + 'Cr</div>'
    + '<div style="font-size:9px;color:#6080a0;text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">Total Market (TAM)</div></td>'
    + '<td style="padding:18px 20px;text-align:center;border-right:1px solid #e2e8f0;">'
    + '<div style="font-family:monospace;font-size:20px;font-weight:bold;color:#1a56db;">&#8377;' + Math.round(d.samCrore || 0) + 'Cr</div>'
    + '<div style="font-size:9px;color:#6080a0;text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">Serviceable (SAM)</div></td>'
    + '<td style="padding:18px 20px;text-align:center;">'
    + '<div style="font-family:monospace;font-size:20px;font-weight:bold;color:#059669;">&#8377;' + Math.round(d.somCrore || 0) + 'Cr</div>'
    + '<div style="font-size:9px;color:#6080a0;text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">3-yr Target (SOM)</div></td>'
    + '</tr></table></td></tr>'

    // Executive Summary
    + (d.executiveSummary ? '<tr><td style="padding:20px 32px 0;">'
    + '<div style="border-left:4px solid #061228;padding-left:16px;">'
    + '<div style="font-size:9px;font-weight:700;color:#6080a0;text-transform:uppercase;letter-spacing:.16em;margin-bottom:8px;">Executive Assessment</div>'
    + '<div style="font-size:13px;color:#061228;line-height:1.8;">' + esc(d.executiveSummary) + '</div>'
    + '</div></td></tr>' : '')

    // Live Insight
    + (d.realTimeInsight ? '<tr><td style="padding:12px 32px 0;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:6px;border:1px solid #bfdbfe;"><tr>'
    + '<td width="40" style="padding:12px;text-align:center;vertical-align:top;font-size:10px;font-weight:bold;color:#059669;">LIVE</td>'
    + '<td style="padding:12px 12px 12px 0;font-size:12px;color:#059669;line-height:1.6;">' + esc(d.realTimeInsight) + '</td>'
    + '</tr></table></td></tr>' : '')

    // Stage Context
    + (d.stageContext ? '<tr><td style="padding:12px 32px 0;font-size:12px;color:#6080a0;line-height:1.7;">'
    + '<span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-right:8px;">Stage Context</span>'
    + esc(d.stageContext) + '</td></tr>' : '')

    // Dimension Scores
    + '<table width="100%" cellpadding="0" cellspacing="0">'
    + sectionHead('Dimension Scores')
    + dimRows
    + '</table>'

    // Dimension Explanations
    + (dimExplRows ? '<table width="100%" cellpadding="0" cellspacing="0">'
    + sectionHead('Why Each Score — What To Do')
    + dimExplRows
    + '</table>' : '')

    // Sector Brutal Truth
    + (d.sectorBrutalTruth ? '<tr><td style="padding:20px 32px 0;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d2040;border-radius:8px;overflow:hidden;"><tr>'
    + '<td style="background:linear-gradient(90deg,#ef4444,#f59e0b);height:3px;font-size:0;">&nbsp;</td></tr><tr>'
    + '<td style="padding:20px 24px;">'
    + '<div style="font-size:9px;font-weight:bold;color:#f87171;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px;">&#9888; Sector Truth</div>'
    + '<div style="font-size:13px;color:rgba(255,255,255,.88);line-height:1.85;">' + esc(d.sectorBrutalTruth) + '</div>'
    + '</td></tr></table></td></tr>' : '')

    // Investor Readiness
    + (ir && ir.score ? '<table width="100%" cellpadding="0" cellspacing="0">'
    + sectionHead('Investor Readiness', '#1144a0')
    + '<tr><td style="padding:8px 32px;">'
    + '<table width="100%" cellpadding="0" cellspacing="0"><tr>'
    + '<td width="120" style="background:#061228;border-radius:8px;padding:16px;text-align:center;vertical-align:top;">'
    + '<div style="font-family:monospace;font-size:32px;font-weight:bold;color:' + irColor + ';">' + irScore + '</div>'
    + '<div style="font-size:8px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">Readiness</div>'
    + (ir.realisticRaiseRange ? '<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08);">'
    + '<div style="font-size:9px;color:rgba(191,219,254,.7);margin-bottom:3px;">Raise Range</div>'
    + '<div style="font-family:monospace;font-size:10px;font-weight:bold;color:#93c5fd;">' + esc(ir.realisticRaiseRange) + '</div></div>' : '')
    + (ir.timeToFundable ? '<div style="margin-top:8px;">'
    + '<div style="font-size:9px;color:rgba(191,219,254,.7);margin-bottom:3px;">Time to Fundable</div>'
    + '<div style="font-family:monospace;font-size:10px;font-weight:bold;color:#93c5fd;">' + esc(ir.timeToFundable) + '</div></div>' : '')
    + '</td>'
    + '<td style="padding-left:16px;vertical-align:top;">'
    + (ir.vcPassReasons && ir.vcPassReasons.length ? '<div style="font-size:10px;font-weight:700;color:#dc2626;margin-bottom:6px;">Why a Tier 1 VC Would Pass Today</div>'
    + '<table cellpadding="0" cellspacing="0" width="100%">' + bulletList(ir.vcPassReasons, '#dc2626', '&#10005;') + '</table>' : '')
    + (ir.whatToFix && ir.whatToFix.length ? '<div style="font-size:10px;font-weight:700;color:#059669;margin-top:12px;margin-bottom:6px;">What to Fix</div>'
    + '<table cellpadding="0" cellspacing="0" width="100%">' + bulletList(ir.whatToFix, '#059669', '&#8594;') + '</table>' : '')
    + '</td></tr></table></td></tr></table>' : '')

    // Key Insights
    + '<table width="100%" cellpadding="0" cellspacing="0">'
    + sectionHead('Key Insights')
    + bulletList((d.keyInsights || []).map(function(i){ return i.replace(/^[^\w\s]+\s*/u, ''); }), '#1144a0', '&#10022;')
    + '</table>'

    // Competitors
    + (compRows ? '<table width="100%" cellpadding="0" cellspacing="0">'
    + sectionHead('Competitor Landscape')
    + compRows
    + '</table>' : '')

    // Risk Mitigations
    + (riskRows ? '<table width="100%" cellpadding="0" cellspacing="0">'
    + sectionHead('Risk Mitigation Strategies', '#dc2626')
    + riskRows
    + '</table>' : '')

    // Quick Wins
    + '<table width="100%" cellpadding="0" cellspacing="0">'
    + sectionHead('Quick Wins (90 Days)')
    + bulletList(d.quickWins, '#059669', '&#8594;')
    + '</table>'

    // Recommendations
    + (recRows ? '<table width="100%" cellpadding="0" cellspacing="0">'
    + sectionHead('Recommendations — Ranked by Urgency')
    + '<tr><td style="padding:12px 32px 0;font-size:11px;color:#6080a0;">Act on these in order. Each is tied to a specific finding from your assessment.</td></tr>'
    + recRows
    + '<tr><td style="padding-bottom:8px;"></td></tr>'
    + '</table>' : '')

    // Footer
    + '<tr><td style="background:#061228;padding:20px 32px;text-align:center;">'
    + '<div style="font-size:11px;color:rgba(255,255,255,.4);">Generated by Infopace Market Intelligence Platform &middot; ' + now + '</div>'
    + '<div style="font-size:10px;color:rgba(255,255,255,.22);margin-top:6px;">&#169; ' + year + ' Infopace Management Pvt Ltd &middot; Confidential</div>'
    + '</td></tr>'

    + '</table></td></tr></table></body></html>';
}

// ── HTTP Server ──────────────────────────────────────────────────
http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── /api → Gemini proxy ────────────────────────────────────────
  if (req.url === '/api' && req.method === 'POST') {
    var body = '';
    req.on('data', function(c){ body += c; });
    req.on('end', function() {
      var payload;
      try { payload = JSON.parse(body); }
      catch(e) { res.writeHead(400); res.end('bad json'); return; }

      var type        = payload._type || 'analysis';
      var isQuestions = type === 'questions';
      var apiKey      = isQuestions ? API_KEY_QUESTIONS : API_KEY_ANALYSIS;
      var model       = isQuestions ? MODEL_QUESTIONS   : MODEL_ANALYSIS;
      var maxTokens   = isQuestions ? TOKENS_QUESTIONS  : TOKENS_ANALYSIS;
      var label       = isQuestions ? 'questions'       : 'analysis';

      // No key → return 503 so client falls back gracefully
      if (!apiKey) {
        console.log('  ⚠️  ' + label + ' key not set — client will use built-in fallback');
        res.writeHead(503, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
        res.end(JSON.stringify({ error:'api_key_not_configured', type:label, fallback:true }));
        return;
      }

      var prompt = payload.prompt || '';
      console.log('  →  ' + label + ' | ' + model + ' | ' + maxTokens + ' tokens');

      geminiRequest(apiKey, model, maxTokens, prompt, function(err, status, respBody) {
        if (err) {
          console.log('  ❌ Network error (' + label + '):', err.message);
          res.writeHead(502, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        console.log('  ' + (status < 300 ? '✅' : '❌') + '  ' + status + '  ' + label);

        var wrapped;
        try {
          var gd   = JSON.parse(respBody);
          var text = (gd && gd.candidates && gd.candidates[0] && gd.candidates[0].content && gd.candidates[0].content.parts || [])
            .map(function(p){ return p.text || ''; }).join('');
          wrapped = JSON.stringify({ candidates: gd.candidates, content: [{ type:'text', text:text }] });
        } catch(e) { wrapped = respBody; }

        res.writeHead(status, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
        res.end(wrapped);
      });
    });
    return;
  }

  // ── /api/send-report → Gmail SMTP ─────────────────────────────
  if (req.url === '/api/send-report' && req.method === 'POST') {
    if (!GMAIL_APP_PASSWORD) {
      console.log('  ❌ GMAIL_APP_PASSWORD not set');
      res.writeHead(500, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
      res.end(JSON.stringify({ error: 'Gmail App Password not set in server.js' }));
      return;
    }

    var body = '';
    req.on('data', function(c){ body += c; });
    req.on('end', function() {
      var payload;
      try { payload = JSON.parse(body); }
      catch(e) { res.writeHead(400); res.end('bad json'); return; }

      var recipientEmail = payload.recipientEmail;
      if (!recipientEmail) {
        res.writeHead(400, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
        res.end(JSON.stringify({ error: 'Missing recipientEmail' }));
        return;
      }

      var reportData = Object.assign({}, payload);
      delete reportData.recipientEmail;

      var subject = 'Market Intelligence Report — ' + (reportData.bizName || 'Your Assessment');
      var html    = buildReportEmail(reportData);

      console.log('  →  send-report to: ' + recipientEmail);

      var transporter = createTransporter();
      transporter.sendMail({
        from:    '"Infopace Reports" <' + GMAIL_USER + '>',
        to:      recipientEmail,
        subject: subject,
        html:    html,
      }, function(err) {
        if (err) {
          console.log('  ❌ Email error:', err.message);
          res.writeHead(500, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        console.log('  ✅ Report emailed to: ' + recipientEmail);
        res.writeHead(200, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
        res.end(JSON.stringify({ ok: true }));
      });
    });
    return;
  }

  // ── Static files ───────────────────────────────────────────────
  var fp = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  fp = path.join(process.cwd(), fp);
  fs.readFile(fp, function(err, data) {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'text/plain' });
    res.end(data);
  });

}).listen(PORT, function() {
  var gmailOk = !!(GMAIL_APP_PASSWORD && GMAIL_APP_PASSWORD !== '');
  var qOk     = !!(API_KEY_QUESTIONS  && API_KEY_QUESTIONS  !== '');
  var aOk     = !!(API_KEY_ANALYSIS   && API_KEY_ANALYSIS   !== '');
  console.log('');
  console.log('  Infopace — Gemini + Gmail SMTP Edition');
  console.log('  ────────────────────────────────────────────────────');
  console.log('  🌐  http://localhost:' + PORT);
  console.log('  ────────────────────────────────────────────────────');
  console.log('  📧  Gmail         : ' + GMAIL_USER);
  console.log('  🔑  App Password  : ' + (gmailOk ? '✅ Set' : '❌ NOT SET — edit line 17'));
  console.log('  ❓  Questions key : ' + (qOk ? '✅ Set' : '⬜ Empty → fallback questions'));
  console.log('  📊  Analysis key  : ' + (aOk ? '✅ Set' : '⬜ Empty → offline analysis'));
  console.log('  ────────────────────────────────────────────────────');
  if (!gmailOk) {
    console.log('');
    console.log('  To enable email reports:');
    console.log('  1. Gmail → myaccount.google.com → Security → 2-Step Verification → ON');
    console.log('  2. Security → App Passwords → create one → copy 16-char password');
    console.log('  3. Paste into GMAIL_APP_PASSWORD on line 17 of this file');
    console.log('  ⚠  If email hangs: your network blocks SMTP. Use mobile hotspot.');
  }
  console.log('');
});