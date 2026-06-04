import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const SECTORS = [
  "Information Technology / SaaS","Healthcare & Pharma","Financial Services / FinTech",
  "E-Commerce & Retail","Education & EdTech","Manufacturing","Real Estate & PropTech",
  "Logistics & Supply Chain","Media & Entertainment","Agriculture & AgroTech","Energy & CleanTech",
];
const GEO = [
  { v:"T1", l:"India — Tier 1 Cities" },{ v:"T2", l:"India — Tier 2 & 3 Cities" },
  { v:"PI", l:"Pan India" },{ v:"SA", l:"South Asia (SAARC)" },
  { v:"SE", l:"Southeast Asia" },{ v:"MEA", l:"Middle East & Africa" },
  { v:"EU", l:"Europe" },{ v:"NA", l:"North America" },{ v:"GL", l:"Global" },
];
const BUSINESS_TYPES = ["B2B","B2C","B2B2C","D2C","Marketplace","SaaS / Platform"];
const ROLES = [
  "Founder / Co-Founder","CEO / MD","CTO / CPO","CMO / VP Marketing",
  "Business Development","Product Manager","Investor / VC","Consultant / Advisor","Other",
];
const TEAM_SIZES = ["Solo","2–5","6–15","16–50","51–200","200+"];
const STAGES     = ["Idea Stage","MVP / Prototype","Live Pilots","Paying Customers","Scaling"];
const COUNTRIES  = [
  { code:"+91",  flag:"in", name:"India",       length:10, pattern:/^[6-9]\d{9}$/,   placeholder:"9876543210",  hint:"10 digits, starts 6–9" },
  { code:"+1",   flag:"us", name:"USA",          length:10, pattern:/^[2-9]\d{9}$/,   placeholder:"2025550123",  hint:"10 digits" },
  { code:"+1",   flag:"ca", name:"Canada",       length:10, pattern:/^[2-9]\d{9}$/,   placeholder:"4165550123",  hint:"10 digits" },
  { code:"+44",  flag:"gb", name:"UK",           length:10, pattern:/^[1-9]\d{9}$/,   placeholder:"7911123456",  hint:"10 digits" },
  { code:"+61",  flag:"au", name:"Australia",    length:9,  pattern:/^[2-9]\d{8}$/,   placeholder:"412345678",   hint:"9 digits" },
  { code:"+971", flag:"ae", name:"UAE",          length:9,  pattern:/^5\d{8}$/,       placeholder:"501234567",   hint:"9 digits, starts 5" },
  { code:"+966", flag:"sa", name:"Saudi Arabia", length:9,  pattern:/^5\d{8}$/,       placeholder:"512345678",   hint:"9 digits, starts 5" },
  { code:"+65",  flag:"sg", name:"Singapore",    length:8,  pattern:/^[689]\d{7}$/,   placeholder:"91234567",    hint:"8 digits" },
  { code:"+60",  flag:"my", name:"Malaysia",     length:9,  pattern:/^1\d{8}$/,       placeholder:"123456789",   hint:"9 digits" },
  { code:"+49",  flag:"de", name:"Germany",      length:10, pattern:/^[1-9]\d{9}$/,   placeholder:"1512345678",  hint:"10 digits" },
  { code:"+33",  flag:"fr", name:"France",       length:9,  pattern:/^[1-9]\d{8}$/,   placeholder:"612345678",   hint:"9 digits" },
  { code:"+81",  flag:"jp", name:"Japan",        length:10, pattern:/^[789]\d{9}$/,   placeholder:"9012345678",  hint:"10 digits" },
  { code:"+86",  flag:"cn", name:"China",        length:11, pattern:/^1[3-9]\d{9}$/,  placeholder:"13812345678", hint:"11 digits" },
  { code:"+55",  flag:"br", name:"Brazil",       length:11, pattern:/^[1-9]\d{10}$/,  placeholder:"11912345678", hint:"11 digits" },
  { code:"+27",  flag:"za", name:"South Africa", length:9,  pattern:/^[6-8]\d{8}$/,   placeholder:"712345678",   hint:"9 digits" },
  { code:"+234", flag:"ng", name:"Nigeria",      length:10, pattern:/^[7-9]\d{9}$/,   placeholder:"8012345210",  hint:"10 digits" },
  { code:"+880", flag:"bd", name:"Bangladesh",   length:10, pattern:/^1\d{9}$/,       placeholder:"1812345678",  hint:"10 digits" },
  { code:"+92",  flag:"pk", name:"Pakistan",     length:10, pattern:/^3\d{9}$/,       placeholder:"3012345678",  hint:"10 digits" },
];

const STATS = [
  { value: "3×",    label: "Faster than traditional research" },
  { value: "50+",    label: "Data points analysed per assessment" },
  { value: "5 mins",  label: "From inputs to full intelligence dashboard" }
  
];
const FEATURES = [
  "TAM / SAM / SOM breakdown",
  "Competitor radar & scoring",
  "12-month revenue projections",
  "Geographic opportunity map",
  "90-day execution roadmap",
];

// ─── VALIDATION ──────────────────────────────────────────────────────────────
const isEmailValid    = v => /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v);
const isPhoneValidFor = (ph, c) => c.pattern.test(ph) && !/^(\d)\1+$/.test(ph);
const FIELD_LABELS    = {
  name:"Full name", email:"Email", phone:"Phone", organization:"Organization", role:"Role",
  productName:"Product name", businessType:"Business type", sector:"Industry sector",
  geography:"Target geography", problem:"Problem statement", stage:"Stage",
};
const STEP1 = ["name","email","phone","organization","role"];
const STEP2 = ["productName","businessType","sector","geography","problem","stage"];

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  // Core blues
  blue900:  "#0A1628",
  blue800:  "#0D2240",
  blue700:  "#0F3460",
  blue600:  "#1144A0",
  blue500:  "#1a56db",
  blue400:  "#3b82f6",
  blue300:  "#93c5fd",
  blue200:  "#bfdbfe",
  blue100:  "#dbeafe",
  blue50:   "#eff6ff",

  // Surface
  surface:  "#F0F4FF",
  white:    "#FFFFFF",

  // Text
  textPrimary:   "#0A1628",
  textSecondary: "#475569",
  textMuted:     "#94a3b8",
  textOnDark:    "#FFFFFF",

  // Borders
  border:       "rgba(17,68,160,0.15)",
  borderDark:   "rgba(17,68,160,0.3)",

  // Error
  errText:   "#be123c",
  errBg:     "#fff1f2",
  errBorder: "#fda4af",

  // Fonts
  mono:  "'IBM Plex Mono', monospace",
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'Inter', 'DM Sans', system-ui, sans-serif",
};

// ─── ANIMATED BACKGROUND CANVAS ──────────────────────────────────────────────
function AnimatedBackground() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999, vx: 0, vy: 0, px: -9999, py: -9999 });
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      buildGrid();
    }

    // ── Mouse tracking ──
    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      mouseRef.current.vx = mx - mouseRef.current.x;
      mouseRef.current.vy = my - mouseRef.current.y;
      mouseRef.current.x  = mx;
      mouseRef.current.y  = my;
    };
    window.addEventListener("mousemove", onMove);

    // ── Grid of nodes for "ripple field" effect ──
    const COLS = 18, ROWS = 12;
    let nodes = [];
    function buildGrid() {
      nodes = [];
      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          nodes.push({
            ox: (c / COLS) * W,
            oy: (r / ROWS) * H,
            x:  (c / COLS) * W,
            y:  (r / ROWS) * H,
            vx: 0, vy: 0,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }
    buildGrid();
    resize();
    window.addEventListener("resize", resize);

    // ── 3D Wireframe Shapes ──
    // Project a 3D point to 2D canvas coords
    function project(x, y, z, cx, cy, fov = 320) {
      const scale = fov / (fov + z);
      return { x: cx + x * scale, y: cy + y * scale, scale };
    }

    // Rotate a point around X and Y axes
    function rotateXY(x, y, z, rx, ry) {
      // Rotate around Y
      const x1 = x * Math.cos(ry) - z * Math.sin(ry);
      const z1 = x * Math.sin(ry) + z * Math.cos(ry);
      // Rotate around X
      const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
      const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
      return { x: x1, y: y2, z: z2 };
    }

    // Define cube vertices & edges
    function makeCube(size) {
      const h = size / 2;
      const verts = [
        [-h,-h,-h],[h,-h,-h],[h,h,-h],[-h,h,-h],
        [-h,-h, h],[h,-h, h],[h,h, h],[-h,h, h],
      ];
      const edges = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7],
      ];
      return { verts, edges };
    }

    // Define octahedron vertices & edges
    function makeOctahedron(size) {
      const s = size;
      const verts = [
        [0,-s,0],[s,0,0],[0,0,s],[-s,0,0],[0,0,-s],[0,s,0],
      ];
      const edges = [
        [0,1],[0,2],[0,3],[0,4],
        [5,1],[5,2],[5,3],[5,4],
        [1,2],[2,3],[3,4],[4,1],
      ];
      return { verts, edges };
    }

    // Define icosahedron-like diamond / tetrahedron
    function makeTetrahedron(size) {
      const s = size;
      const verts = [
        [0, s, 0],
        [ s * 0.94, -s * 0.33, 0],
        [-s * 0.47, -s * 0.33,  s * 0.82],
        [-s * 0.47, -s * 0.33, -s * 0.82],
      ];
      const edges = [
        [0,1],[0,2],[0,3],[1,2],[2,3],[3,1],
      ];
      return { verts, edges };
    }

    // Icosahedron
    function makeIcosahedron(size) {
      const t = (1 + Math.sqrt(5)) / 2;
      const s = size / Math.sqrt(1 + t * t);
      const verts = [
        [-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],
        [0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],
        [t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1],
      ].map(([x,y,z]) => [x*s,y*s,z*s]);
      const edges = [
        [0,1],[0,5],[0,7],[0,10],[0,11],
        [1,5],[1,7],[1,8],[1,9],
        [2,3],[2,4],[2,6],[2,10],[2,11],
        [3,4],[3,6],[3,8],[3,9],
        [4,5],[4,9],[4,11],
        [5,9],[5,11],
        [6,7],[6,8],[6,10],
        [7,8],[7,10],
        [8,9],[10,11],
      ];
      return { verts, edges };
    }

    // Torus ring
    function makeTorus(R, r, segs = 10, rings = 14) {
      const verts = [];
      const edges = [];
      for (let i = 0; i < rings; i++) {
        const theta = (i / rings) * Math.PI * 2;
        for (let j = 0; j < segs; j++) {
          const phi = (j / segs) * Math.PI * 2;
          verts.push([
            (R + r * Math.cos(phi)) * Math.cos(theta),
            r * Math.sin(phi),
            (R + r * Math.cos(phi)) * Math.sin(theta),
          ]);
          edges.push([i * segs + j, i * segs + (j + 1) % segs]);
          edges.push([i * segs + j, ((i + 1) % rings) * segs + j]);
        }
      }
      return { verts, edges };
    }

    // Pyramid
    function makePyramid(size) {
      const b = size * 0.65, h = size;
      const verts = [[-b,b*0.5,-b],[b,b*0.5,-b],[b,b*0.5,b],[-b,b*0.5,b],[0,-h,0]];
      const edges = [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]];
      return { verts, edges };
    }

    // Initialise shape instances — 8 shapes, same style as original
    const SHAPES = [
      { ...makeCube(70),          rx: 0.003, ry: 0.005, rz: 0.002, angX: 0.4,  angY: 0.2  },
      { ...makeOctahedron(55),    rx: 0.004, ry: 0.003, rz: 0.003, angX: 1.0,  angY: 0.8  },
      { ...makeTetrahedron(62),   rx: 0.003, ry: 0.006, rz: 0.001, angX: 2.1,  angY: 1.4  },
      { ...makeIcosahedron(58),   rx: 0.002, ry: 0.004, rz: 0.002, angX: 0.7,  angY: 1.9  },
      { ...makeTorus(40,13),      rx: 0.005, ry: 0.003, rz: 0.002, angX: 0.3,  angY: 0.5  },
      { ...makePyramid(55),       rx: 0.003, ry: 0.005, rz: 0.001, angX: 1.6,  angY: 0.9  },
      { ...makeCube(48),          rx: 0.004, ry: 0.003, rz: 0.003, angX: 3.0,  angY: 2.4  },
      { ...makeOctahedron(42),    rx: 0.006, ry: 0.002, rz: 0.004, angX: 0.1,  angY: 2.2  },
    ];

    // Positions spread across the full canvas
    const shapePositions = [
      { fx: 0.12, fy: 0.25 },
      { fx: 0.88, fy: 0.65 },
      { fx: 0.55, fy: 0.12 },
      { fx: 0.80, fy: 0.18 },
      { fx: 0.15, fy: 0.72 },
      { fx: 0.93, fy: 0.40 },
      { fx: 0.42, fy: 0.82 },
      { fx: 0.68, fy: 0.50 },
    ];

    // ── Ripple trails ──
    const ripples = [];

    // ── Beam streaks from cursor movement ──
    const streaks = [];

    let t = 0;
    let prevSpeed = 0;

    function drawShape(shape, pos, alpha) {
      const cx = pos.fx * W;
      const cy = pos.fy * H;
      const projected = shape.verts.map(([x, y, z]) => {
        const rot = rotateXY(x, y, z, shape.angX, shape.angY);
        return project(rot.x, rot.y, rot.z, cx, cy);
      });

      ctx.lineWidth = 0.7;
      shape.edges.forEach(([a, b]) => {
        const pa = projected[a], pb = projected[b];
        // depth-based fade
        const depthAlpha = alpha * (0.5 + 0.5 * ((pa.scale + pb.scale) / 2));
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = `rgba(59,130,246,${depthAlpha.toFixed(3)})`;
        ctx.stroke();
      });

      // small vertex dots
      projected.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,197,253,${(alpha * 0.7).toFixed(3)})`;
        ctx.fill();
      });
    }

    function draw() {
      const m = mouseRef.current;
      const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
      const smoothSpeed = prevSpeed * 0.85 + speed * 0.15;
      prevSpeed = smoothSpeed;

      ctx.clearRect(0, 0, W, H);

      // ── 1. Slow-rotating 3D wireframe shapes ──
      SHAPES.forEach((shape, i) => {
        shape.angX += shape.rx;
        shape.angY += shape.ry;
        drawShape(shape, shapePositions[i], 0.22);
      });

      // ── 2. Grid mesh — distorted by cursor ──
      const W_COLS = COLS + 1, W_ROWS = ROWS + 1;
      nodes.forEach(n => {
        if (m.x > 0) {
          const dx = m.x - n.ox, dy = m.y - n.oy;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const influence = Math.exp(-dist * dist / (2 * 160 * 160));
          // push nodes away from cursor in a wave
          const wave = Math.sin(dist * 0.025 - t * 0.07) * influence;
          n.tx = n.ox - dx * 0.08 * influence + m.vx * 0.12 * influence;
          n.ty = n.oy - dy * 0.08 * influence + m.vy * 0.12 * influence;
          // gentle idle oscillation
          n.tx += Math.sin(t * 0.015 + n.phase) * 3;
          n.ty += Math.cos(t * 0.013 + n.phase * 1.3) * 3;
        } else {
          n.tx = n.ox + Math.sin(t * 0.015 + n.phase) * 3;
          n.ty = n.oy + Math.cos(t * 0.013 + n.phase * 1.3) * 3;
        }
        n.x += (n.tx - n.x) * 0.08;
        n.y += (n.ty - n.y) * 0.08;
      });

      // Draw grid lines
      ctx.lineWidth = 0.4;
      for (let r = 0; r < W_ROWS; r++) {
        for (let c = 0; c < W_COLS; c++) {
          const n = nodes[r * W_COLS + c];
          // horizontal
          if (c < COLS) {
            const nr = nodes[r * W_COLS + c + 1];
            const mdx = (n.x + nr.x) / 2 - (m.x || W/2);
            const mdy = (n.y + nr.y) / 2 - (m.y || H/2);
            const d = Math.sqrt(mdx*mdx + mdy*mdy);
            const proximity = Math.exp(-d * d / (2 * 200 * 200));
            const alpha = 0.06 + proximity * 0.18;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y); ctx.lineTo(nr.x, nr.y);
            ctx.strokeStyle = `rgba(26,86,219,${alpha.toFixed(3)})`;
            ctx.stroke();
          }
          // vertical
          if (r < ROWS) {
            const nb = nodes[(r + 1) * W_COLS + c];
            const mdx = (n.x + nb.x) / 2 - (m.x || W/2);
            const mdy = (n.y + nb.y) / 2 - (m.y || H/2);
            const d = Math.sqrt(mdx*mdx + mdy*mdy);
            const proximity = Math.exp(-d * d / (2 * 200 * 200));
            const alpha = 0.06 + proximity * 0.18;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y); ctx.lineTo(nb.x, nb.y);
            ctx.strokeStyle = `rgba(26,86,219,${alpha.toFixed(3)})`;
            ctx.stroke();
          }
        }
      }

      // ── 3. Cursor halo ──
      if (m.x > 0) {
        const haloR = 100 + smoothSpeed * 3;
        const haloGrd = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, haloR);
        haloGrd.addColorStop(0, "rgba(59,130,246,0.18)");
        haloGrd.addColorStop(0.4, "rgba(26,86,219,0.08)");
        haloGrd.addColorStop(1, "rgba(17,68,160,0)");
        ctx.beginPath();
        ctx.arc(m.x, m.y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = haloGrd;
        ctx.fill();

        // inner sharp dot
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59,130,246,0.6)";
        ctx.fill();

        // ── 4. Ripple rings from fast movement ──
        if (smoothSpeed > 6) {
          ripples.push({ x: m.x, y: m.y, r: 0, maxR: 60 + smoothSpeed * 2, life: 1 });
        }
      }

      // Draw & age ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += (rp.maxR - rp.r) * 0.06;
        rp.life -= 0.035;
        if (rp.life <= 0) { ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59,130,246,${(rp.life * 0.35).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // ── 5. Velocity streaks ──
      const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
      if (spd > 3 && m.x > 0) {
        streaks.push({
          x: m.x, y: m.y,
          dx: -m.vx, dy: -m.vy,
          len: spd * 3.5,
          life: 1,
          width: Math.min(spd * 0.15, 2),
        });
      }
      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i];
        s.life -= 0.07;
        if (s.life <= 0) { streaks.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.dx * (s.len / spd + 1) * s.life, s.y + s.dy * (s.len / spd + 1) * s.life);
        ctx.strokeStyle = `rgba(147,197,253,${(s.life * 0.5).toFixed(3)})`;
        ctx.lineWidth = s.width * s.life;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      t++;
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:0 }}
    />
  );
}

// ─── STYLE HELPERS ───────────────────────────────────────────────────────────
const fld = err => ({
  width:"100%", padding:"12px 14px", fontSize:13, fontFamily:C.sans,
  background: err ? C.errBg : "rgba(255,255,255,0.88)",
  border:`1.5px solid ${err ? C.errBorder : C.border}`,
  borderRadius:7, outline:"none", color:C.textPrimary,
  transition:"border-color 0.15s, box-shadow 0.15s, background 0.15s",
  boxSizing:"border-box", letterSpacing:"0.01em", lineHeight:1.6,
  backdropFilter:"blur(8px)",
});
const onFocus = e => {
  e.target.style.borderColor = C.blue500;
  e.target.style.boxShadow   = `0 0 0 4px rgba(26,86,219,0.12)`;
  e.target.style.background  = "#fff";
};
const onBlur = err => e => {
  e.target.style.borderColor = err ? C.errBorder : C.border;
  e.target.style.boxShadow   = "none";
};

// ─── ATOMS ───────────────────────────────────────────────────────────────────
const Flag = ({ code }) => (
  <img src={`https://flagcdn.com/20x15/${code}.png`} srcSet={`https://flagcdn.com/40x30/${code}.png 2x`}
    width="20" height="15" alt={code}
    style={{ borderRadius:2, flexShrink:0 }}
    onError={e => { e.target.style.display="none"; }} />
);

const FieldErr = ({ msg }) => msg
  ? <p style={{ fontSize:11, color:C.errText, marginTop:5, letterSpacing:"0.01em" }}>{msg}</p>
  : null;

const FL = ({ children, optional }) => (
  <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.14em",
    textTransform:"uppercase", color:C.blue600, marginBottom:7 }}>
    {children}
    {optional && <span style={{ fontWeight:400, textTransform:"none", color:C.textMuted, marginLeft:4 }}>(optional)</span>}
  </label>
);

const Chip = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick} style={{
    padding:"8px 16px", borderRadius:6, fontSize:12,
    fontWeight: active ? 600 : 500, cursor:"pointer", fontFamily:C.sans,
    letterSpacing:"0.01em", transition:"all 0.18s",
    border:`1.5px solid ${active ? C.blue500 : C.border}`,
    background: active ? C.blue500 : "rgba(255,255,255,0.8)",
    color: active ? C.white : C.textSecondary,
    boxShadow: active ? "0 3px 10px rgba(26,86,219,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
  }}>
    {label}
  </button>
);

// glass card
const glassCard = {
  background:"rgba(255,255,255,0.88)",
  backdropFilter:"blur(28px) saturate(1.8)",
  WebkitBackdropFilter:"blur(28px) saturate(1.8)",
  border:`1.5px solid rgba(255,255,255,0.95)`,
  borderRadius:13,
  boxShadow:"0 8px 32px rgba(17,68,160,0.1), 0 1px 6px rgba(17,68,160,0.08)",
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar() {
  return (
    <aside className="hidden lg:flex" style={{
      width:300, flexShrink:0,
      borderRight:`1.5px solid rgba(255,255,255,0.4)`,
      padding:"52px 36px",
      display:"flex", flexDirection:"column", gap:44,
      background:"rgba(10,22,40,0.88)",
      backdropFilter:"blur(28px)",
      position:"relative", zIndex:1,
    }}>
      {/* Top accent line */}
      <div style={{ position:"absolute", top:0, left:36, right:36, height:3, background:C.blue500, borderRadius:"0 0 3px 3px" }} />

      {/* Infopace Logo */}
      <div style={{
        paddingTop:8,
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
      }}>
        <img src="/infopace-logo.jpg" alt="Infopace" style={{
          width:"70%",
          maxWidth:180,
          height:"auto",
          borderRadius:10,
          objectFit:"contain",
          background:"#fff",
          padding:8,
          boxShadow:"0 4px 16px rgba(26,86,219,0.25), 0 1px 4px rgba(0,0,0,0.08)",
        }} />
      </div>

      <div style={{ paddingTop:0 }}>
        <p style={{ fontSize:15, fontWeight:600, letterSpacing:"0.22em", textTransform:"uppercase",
          color:C.blue400, marginBottom:18 }}>
          Market Potential Assessment
        </p>
        <h2 style={{ fontFamily:C.serif, fontSize:28, fontWeight:700, color:C.white,
          lineHeight:1.28, margin:0, letterSpacing:"-0.01em" }}>
          Know your market<br/>before your<br/>competitors do.
        </h2>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.8, marginTop:16 }}>
          Our engine maps your sector, geography, and model — then surfaces a personalised intelligence brief within minutes.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", flexDirection:"column" }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ padding:"16px 0", borderTop:`1px solid rgba(255,255,255,0.1)` }}>
            <div style={{ fontFamily:C.mono, fontSize:22, fontWeight:500, color:C.blue300, letterSpacing:"-0.01em" }}>{s.value}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:4, letterSpacing:"0.06em" }}>{s.label}</div>
          </div>
        ))}
        <div style={{ borderTop:`1px solid rgba(255,255,255,0.1)` }} />
      </div>

      {/* Features */}
      <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(26,86,219,0.3)",
              border:`1px solid rgba(59,130,246,0.5)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke={C.blue300} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>{f}</span>
          </div>
        ))}
      </div>

      <p style={{ marginTop:"auto", fontSize:11, color:"rgba(255,255,255,0.3)", lineHeight:1.7 }}>
        End-to-end encrypted.<br/>Never shared with third parties.
      </p>
    </aside>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function OnboardingForm({ onComplete, user }) {
  const [step, setStep]         = useState(1);
  const [ctry, setCtry]         = useState(COUNTRIES[0]);
  const [showDrop, setShowDrop] = useState(false);
  const [ctryQ, setCtryQ]       = useState("");
  const [vis, setVis]           = useState(true);

  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || "",
    email:"", phone:"", organization:"", role:"", teamSize:"",
    productName:"", businessType:"", sector:"", geography:"",
    problem:"", stage:"", consent:false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setVis(false);
    const timer = setTimeout(() => setVis(true), 70);
    return () => clearTimeout(timer);
  }, [step]);

  const set     = (k, v) => setForm(f => ({ ...f, [k]:v }));
  const clr     = k      => setErrors(e => { const n={...e}; delete n[k]; return n; });
  const phoneOk = ()     => isPhoneValidFor(form.phone, ctry);

  const handlePhone = e => {
    set("phone", e.target.value.replace(/\D/g,"").slice(0, ctry.length));
    clr("phone");
  };
  const pickCtry = c => { setCtry(c); set("phone",""); clr("phone"); setShowDrop(false); setCtryQ(""); };

  function validate(fields) {
    const errs = {};
    fields.forEach(f => {
      if (f==="consent") { if (!form[f]) errs[f]="Please accept to continue."; return; }
      if (!form[f] || form[f].trim?.()==="") errs[f]=`${FIELD_LABELS[f]||f} is required.`;
    });
    if (form.email && !isEmailValid(form.email))    errs.email = "Enter a valid email address.";
    if (form.phone && !phoneOk()) errs.phone = `Invalid for ${ctry.name}. ${ctry.hint}.`;
    if (fields.includes("problem") && form.problem.trim().length < 20) {
  errs.problem = `At least 20 characters required (${form.problem.trim().length}/20).`;
}
    return errs;
  }

  const step1ok = () =>
    STEP1.every(f => form[f] && form[f].trim?.()!=="") && isEmailValid(form.email) && phoneOk();
  const step2ok = () =>
  STEP2.every(f => form[f] && form[f].trim?.()!=="")
  && form.problem.trim().length >= 20
  && form.consent===true;

  function advance() {
    if (step===1) {
      const e = validate(STEP1);
      if (Object.keys(e).length) { setErrors(e); return; }
      setErrors({}); setStep(2);
    } else {
      const e = validate([...STEP2,"consent"]);
      if (Object.keys(e).length) { setErrors(e); return; }
      setErrors({});
      onComplete?.({ ...form, phoneFull:`${ctry.code}${form.phone}`, countryCode:ctry.code });
    }
  }

  const canGo    = step===1 ? step1ok() : step2ok();
  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(ctryQ.toLowerCase()) || c.code.includes(ctryQ)
  );

  const inp = (key, extra={}) => ({
    style:{ ...fld(errors[key]), ...extra },
    value: form[key],
    onChange: e => { set(key, e.target.value); clr(key); },
    onFocus,
    onBlur: onBlur(errors[key]),
  });

  return (
    <div
      style={{ minHeight:"100vh", background:C.surface, fontFamily:C.sans,
        display:"flex", flexDirection:"column", position:"relative" }}
      onClick={() => showDrop && setShowDrop(false)}
    >
      <AnimatedBackground />

      {/* ── Header ── */}
      <header style={{ height:56, borderBottom:`1.5px solid rgba(255,255,255,0.3)`,
        padding:"0 28px", display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:50,
        background:"rgba(10,22,40,0.92)",
        backdropFilter:"blur(24px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <img src="/infopace-logo.jpg" alt="Infopace" style={{ width:32, height:32, borderRadius:7,
            objectFit:"contain", background:"#fff", padding:2,
            boxShadow:"0 2px 8px rgba(26,86,219,0.4)" }} />
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:C.white,
              letterSpacing:"0.12em", textTransform:"uppercase" }}>Infopace Management Pvt Ltd</div>
            <div style={{ fontSize:10, color:C.blue300, letterSpacing:"0.11em",
              textTransform:"uppercase", marginTop:1 }}>Market Potential Assessment</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#34d399",
            boxShadow:"0 0 0 3px rgba(52,211,153,0.2)" }} />
          <span style={{ fontSize:10, color:C.blue200, letterSpacing:"0.12em", textTransform:"uppercase" }}>
            Live analysis
          </span>
        </div>
      </header>

      <main style={{ flex:1, display:"flex", position:"relative", zIndex:1 }}>
        <Sidebar />

        {/* ── Form panel ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"52px 32px" }}>
          <div style={{ maxWidth:580, margin:"0 auto" }}>

            {/* Step indicator */}
            <div style={{ display:"flex", alignItems:"center", marginBottom:32 }}>
              {["Personal details","Venture context"].map((label, i) => {
                const active = step===i+1, done = step>i+1;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center" }}>
                    <button onClick={() => done && setStep(i+1)}
                      style={{ display:"flex", alignItems:"center", gap:9,
                        background:"none", border:"none",
                        cursor:done?"pointer":"default", padding:"6px 0" }}>
                      <div style={{ width:24, height:24, borderRadius:"50%",
                        border:`2px solid ${active ? C.blue500 : done ? "#34d399" : C.border}`,
                        background: active ? C.blue500 : done ? "#34d399" : "rgba(255,255,255,0.6)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        transition:"all 0.22s", flexShrink:0,
                        boxShadow: active ? "0 0 0 4px rgba(26,86,219,0.15)" : "none" }}>
                        {done
                          ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          : <span style={{ fontSize:10, fontWeight:700,
                              color:active?"white":C.textMuted, fontFamily:C.mono }}>{i+1}</span>
                        }
                      </div>
                      <span style={{ fontSize:12, fontWeight: active ? 600 : 400,
                        color:active?C.blue600:done?"#059669":C.textMuted }}>{label}</span>
                    </button>
                    {i===0 && (
                      <div style={{ width:28, height:2, background:step>1?"#34d399":C.border,
                        margin:"0 10px", borderRadius:2, transition:"background 0.35s" }} />
                    )}
                  </div>
                );
              })}
              <span style={{ marginLeft:"auto", fontSize:10, color:C.textMuted,
                fontFamily:C.mono, letterSpacing:"0.06em" }}>{step} / 2</span>
            </div>

            {/* Progress bar */}
            <div style={{ height:2, background:"rgba(17,68,160,0.1)", marginBottom:40,
              overflow:"hidden", borderRadius:2 }}>
              <div style={{ height:"100%", width:step===1?"50%":"100%",
                background:C.blue500, borderRadius:2,
                transition:"width 0.5s cubic-bezier(0.4,0,0.2,1)",
                boxShadow:"0 0 12px rgba(26,86,219,0.4)" }} />
            </div>

            {/* Form card */}
            <div style={{ ...glassCard, padding:"42px 42px 34px",
              opacity:vis?1:0, transform:vis?"none":"translateY(10px)",
              transition:"opacity 0.28s ease, transform 0.28s ease" }}>

              {/* ── STEP 1 ── */}
              {step===1 && (
                <>
                  <div style={{ marginBottom:30 }}>
                    <h1 style={{ fontFamily:C.serif, fontSize:27, fontWeight:700,
                      color:C.blue900, margin:0, letterSpacing:"-0.02em", lineHeight:1.2 }}>
                      Personal details
                    </h1>
                    <p style={{ fontSize:12, color:C.textMuted, marginTop:9, letterSpacing:"0.01em" }}>
                      Stored securely. Never shared.
                    </p>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"22px 20px" }}>

                    <div>
                      <FL>Full name *</FL>
                      <input placeholder="Jane Doe" {...inp("name")} />
                      <FieldErr msg={errors.name} />
                    </div>

                    <div>
                      <FL>Email *</FL>
                      <input type="email" placeholder="jane@company.com"
                        style={fld(errors.email)} value={form.email}
                        onChange={e => { set("email",e.target.value); clr("email"); }}
                        onFocus={onFocus}
                        onBlur={e => {
                          onBlur(errors.email)(e);
                          if (form.email && !isEmailValid(form.email))
                            setErrors(p => ({ ...p, email:"Enter a valid email address." }));
                        }} />
                      <FieldErr msg={errors.email} />
                    </div>

                    <div>
                      <FL>Organization *</FL>
                      <input placeholder="Acme Technologies" {...inp("organization")} />
                      <FieldErr msg={errors.organization} />
                    </div>

                    <div>
                      <FL>Role *</FL>
                      <select style={{ ...fld(errors.role), appearance:"none", cursor:"pointer" }}
                        value={form.role} onChange={e => { set("role",e.target.value); clr("role"); }}
                        onFocus={onFocus} onBlur={onBlur(errors.role)}>
                        <option value="">Select…</option>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                      <FieldErr msg={errors.role} />
                    </div>

                    {/* Phone */}
                    <div style={{ gridColumn:"span 2" }} onClick={e => e.stopPropagation()}>
                      <FL>Phone *</FL>
                      <div style={{ display:"flex",
                        border:`1.5px solid ${errors.phone ? C.errBorder : C.border}`,
                        borderRadius:6, background:errors.phone?"rgba(255,241,242,0.85)":"rgba(255,255,255,0.85)",
                        transition:"border-color 0.15s", backdropFilter:"blur(8px)" }}>
                        <div style={{ position:"relative", flexShrink:0 }}>
                          <button type="button" onClick={() => { setShowDrop(v => !v); setCtryQ(""); }}
                            style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 13px",
                              background:"transparent", border:"none",
                              borderRight:`1.5px solid ${C.border}`, cursor:"pointer", height:"100%" }}>
                            <Flag code={ctry.flag} />
                            <span style={{ fontSize:11, fontWeight:600, color:C.blue700,
                              fontFamily:C.mono }}>{ctry.code}</span>
                            <span style={{ fontSize:8, color:C.textMuted }}>▾</span>
                          </button>
                          {showDrop && (
                            <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:100,
                              background:"rgba(255,255,255,0.97)", backdropFilter:"blur(20px)",
                              border:`1.5px solid ${C.border}`, borderRadius:9,
                              boxShadow:"0 12px 40px rgba(10,22,40,0.12)", width:264, overflow:"hidden" }}>
                              <div style={{ padding:9, borderBottom:`1px solid ${C.border}` }}>
                                <input autoFocus placeholder="Search country…" value={ctryQ}
                                  onChange={e => setCtryQ(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  style={{ width:"100%", padding:"7px 10px", fontSize:12,
                                    border:`1.5px solid ${C.border}`, borderRadius:5, outline:"none",
                                    background:"rgba(240,244,255,0.7)", boxSizing:"border-box",
                                    fontFamily:C.sans, color:C.textPrimary }} />
                              </div>
                              <div style={{ maxHeight:220, overflowY:"auto" }}>
                                {filtered.length===0
                                  ? <div style={{ fontSize:12, color:C.textMuted, padding:14, textAlign:"center" }}>No results</div>
                                  : filtered.map((c, i) => (
                                    <button key={i} type="button" onClick={() => pickCtry(c)}
                                      style={{ width:"100%", display:"flex", alignItems:"center", gap:9,
                                        padding:"9px 13px", border:"none", cursor:"pointer", textAlign:"left",
                                        fontSize:12, background:ctry.name===c.name?C.blue50:"transparent",
                                        color:C.textPrimary, fontFamily:C.sans }}>
                                      <Flag code={c.flag} />
                                      <span style={{ flex:1 }}>{c.name}</span>
                                      <span style={{ color:C.textMuted, fontFamily:C.mono, fontSize:10 }}>{c.code}</span>
                                    </button>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                        </div>
                        <input type="tel" inputMode="numeric" placeholder={ctry.placeholder} value={form.phone}
                          onChange={handlePhone}
                          onBlur={() => { if (form.phone && !phoneOk())
                            setErrors(p => ({ ...p, phone:`Invalid for ${ctry.name}. ${ctry.hint}.` })); }}
                          style={{ flex:1, border:"none", background:"transparent", outline:"none",
                            padding:"10px 13px", fontSize:13, color:C.textPrimary, fontFamily:C.sans }} />
                        <span style={{ padding:"10px 13px", fontSize:10, color:C.textMuted,
                          fontFamily:C.mono, alignSelf:"center", whiteSpace:"nowrap" }}>
                          {form.phone.length}/{ctry.length}
                        </span>
                      </div>
                      {errors.phone
                        ? <p style={{ fontSize:11, color:C.errText, marginTop:5 }}>{errors.phone}</p>
                        : <p style={{ fontSize:11, color:C.textMuted, marginTop:5 }}>{ctry.name}: {ctry.hint}</p>
                      }
                    </div>

                    <div style={{ gridColumn:"span 2" }}>
                      <FL optional>Team size</FL>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        {TEAM_SIZES.map(s => (
                          <Chip key={s} label={s} active={form.teamSize===s}
                            onClick={() => set("teamSize",s)} />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 2 ── */}
              {step===2 && (
                <>
                  <div style={{ marginBottom:30 }}>
                    <h1 style={{ fontFamily:C.serif, fontSize:27, fontWeight:700,
                      color:C.blue900, margin:0, letterSpacing:"-0.02em", lineHeight:1.2 }}>
                      Your venture
                    </h1>
                    <p style={{ fontSize:12, color:C.textMuted, marginTop:9 }}>
                      The analysis is tailored to your exact context.
                    </p>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"22px 20px" }}>

                    <div>
                      <FL>Product / business name *</FL>
                      <input placeholder="e.g. MedSync AI" {...inp("productName")} />
                      <FieldErr msg={errors.productName} />
                    </div>

                    <div>
                      <FL>Industry sector *</FL>
                      <select style={{ ...fld(errors.sector), appearance:"none", cursor:"pointer" }}
                        value={form.sector} onChange={e => { set("sector",e.target.value); clr("sector"); }}
                        onFocus={onFocus} onBlur={onBlur(errors.sector)}>
                        <option value="">Select…</option>
                        {SECTORS.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <FieldErr msg={errors.sector} />
                    </div>

                    <div>
                      <FL>Business type *</FL>
                      <select style={{ ...fld(errors.businessType), appearance:"none", cursor:"pointer" }}
                        value={form.businessType} onChange={e => { set("businessType",e.target.value); clr("businessType"); }}
                        onFocus={onFocus} onBlur={onBlur(errors.businessType)}>
                        <option value="">Select…</option>
                        {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <FieldErr msg={errors.businessType} />
                    </div>

                    <div>
                      <FL>Target geography *</FL>
                      <select style={{ ...fld(errors.geography), appearance:"none", cursor:"pointer" }}
                        value={form.geography} onChange={e => { set("geography",e.target.value); clr("geography"); }}
                        onFocus={onFocus} onBlur={onBlur(errors.geography)}>
                        <option value="">Select…</option>
                        {GEO.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
                      </select>
                      <FieldErr msg={errors.geography} />
                    </div>

                    <div style={{ gridColumn:"span 2" }}>
                      <FL>Stage *</FL>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        {STAGES.map((s, i) => (
                          <Chip key={s} label={s} active={form.stage===String(i+1)}
                            onClick={() => { set("stage",String(i+1)); clr("stage"); }} />
                        ))}
                      </div>
                      <FieldErr msg={errors.stage} />
                    </div>

                    <div style={{ gridColumn:"span 2" }}>
                      <FL>Core problem your product solves *</FL>
                      <p style={{ fontSize:11, color:C.textMuted, fontStyle:"italic",
                        marginBottom:8, lineHeight:1.6 }}>
                        e.g. "Hospital procurement teams spend 3+ hours on manual vendor coordination daily…"
                      </p>
                      <textarea rows={4} placeholder="Describe the problem and your solution approach…"
                        value={form.problem}
                        onChange={e => { set("problem",e.target.value); clr("problem"); }}
                        onFocus={onFocus} onBlur={onBlur(errors.problem)}
                        style={{ ...fld(errors.problem), resize:"none", minHeight:96, lineHeight:1.7 }} />
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
  <span style={{ fontSize:11, color: form.problem.trim().length>=20 ? "#059669" : C.textMuted }}>
    {form.problem.trim().length>=20 ? "✓ Done" : "Minimum 20 characters required"}
  </span>
  <span style={{ fontSize:11, fontFamily:C.mono,
    color: form.problem.trim().length>=20 ? "#059669" : C.textMuted }}>
    {form.problem.trim().length} / 20
  </span>
</div>
                      <FieldErr msg={errors.problem} />

                    </div>

                    <div style={{ gridColumn:"span 2", marginTop:4 }}>
                      <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer",
                        padding:"14px 16px", borderRadius:7, transition:"all 0.18s",
                        background: form.consent ? "rgba(26,86,219,0.05)" : "rgba(240,244,255,0.5)",
                        border:`1.5px solid ${errors.consent ? C.errBorder : form.consent ? "rgba(26,86,219,0.3)" : C.border}` }}>
                        <input type="checkbox" checked={form.consent}
                          onChange={e => { set("consent",e.target.checked); clr("consent"); }}
                          style={{ marginTop:2, width:14, height:14, accentColor:C.blue500,
                            flexShrink:0, cursor:"pointer" }} />
                        <span style={{ fontSize:12, color:C.textSecondary, lineHeight:1.7 }}>
                          I consent to providing my details for this assessment.{" "}
                          <span style={{ color:C.blue700, fontWeight:600 }}>
                            Your information will never be shared with third parties.
                          </span>
                        </span>
                      </label>
                      <FieldErr msg={errors.consent} />
                    </div>

                  </div>
                </>
              )}

              {/* Nav buttons */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                marginTop:38, paddingTop:26, borderTop:`1.5px solid rgba(17,68,160,0.08)` }}>
                <button onClick={() => setStep(1)} style={{
                  padding:"10px 20px", fontSize:12, fontWeight:500, borderRadius:6,
                  border:`1.5px solid ${C.border}`, background:"rgba(255,255,255,0.7)",
                  color:C.textSecondary, cursor:"pointer", fontFamily:C.sans,
                  letterSpacing:"0.01em", transition:"all 0.18s",
                  visibility:step===1?"hidden":"visible",
                }}>
                  ← Back
                </button>
                <button onClick={advance} disabled={!canGo} style={{
                  padding:"11px 28px", fontSize:12, fontWeight:600, borderRadius:6,
                  border:"none",
                  background:canGo ? C.blue500 : "rgba(17,68,160,0.1)",
                  color:canGo ? C.white : C.textMuted,
                  cursor:canGo?"pointer":"not-allowed", fontFamily:C.sans,
                  letterSpacing:"0.06em", transition:"all 0.2s",
                  boxShadow:canGo ? "0 4px 16px rgba(26,86,219,0.35)" : "none",
                  transform:canGo?"translateY(0)":"translateY(0)",
                }}>
                  {step===1 ? "Continue →" : "Begin assessment →"}
                </button>
              </div>

            </div>{/* /card */}

            <p style={{ textAlign:"center", fontSize:10, color:C.textMuted, marginTop:28,
              paddingBottom:44, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Encrypted · Confidential · Never sold
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#F0F4FF;}
        input::placeholder,textarea::placeholder{color:#94a3b8;}
        select option{background:#fff;color:#0A1628;}
        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(17,68,160,0.25);border-radius:4px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(17,68,160,0.4);}
        button:hover:not(:disabled){filter:brightness(1.05);}
        .hidden{display:none!important;}
        @media(min-width:1024px){.hidden.lg\\:flex{display:flex!important;}}
        
        /* Mobile responsive improvements */
        @media(max-width:768px){
          main{flex-direction:column!important;}
          main > aside{display:none!important;}
          main > div{padding:24px 16px!important;}
          main > div > div{max-width:100%!important;}
          h1{font-size:24px!important;margin-bottom:12px!important;}
          div[style*="display:grid"]{gap:16px 14px!important;}
          input,select,textarea{font-size:14px;padding:11px 12px;}
          button{padding:10px 16px;font-size:11px;}
          div[style*="gridColumn:span 2"]{grid-column:span 1!important;}
        }
        @media(max-width:480px){
          main > div{padding:16px 12px!important;}
          h1{font-size:20px!important;}
          div[style*="padding:"]{padding-left:16px!important;padding-right:16px!important;}
        }
      `}</style>
    </div>
  );
}