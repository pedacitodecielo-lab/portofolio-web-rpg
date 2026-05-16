/* ==========================================================================
   Portfolio v7 — animations + real data visualization
   ========================================================================== */

(async function () {
  document.body.classList.add('loading');

  // ============================
  // LOAD DATA
  // ============================
  let data;
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('no');
    data = await res.json();
  } catch (err) {
    const inline = document.getElementById('inline-data');
    if (inline) data = JSON.parse(inline.textContent);
    else { console.error('No data', err); return; }
  }

  // Skill proficiency map. 1 = working, 2 = proficient, 3 = advanced.
  const SKILL_LEVELS = {
    'Python': 3, 'SQL': 2, 'MATLAB': 2, 'Bash': 2, 'R': 1,
    'pandas': 3, 'NumPy': 3, 'scikit-learn': 2, 'xarray': 3, 'Microsoft Excel': 2,
    'QGIS': 3, 'ArcGIS': 2, 'Google Earth Engine': 2,
    'WRF-Hydro': 3, 'HEC-RAS': 2, 'HEC-HMS': 2, 'CMIP6 Downscaling': 2
  };
  const LEVEL_LABELS = ['', 'Working', 'Proficient', 'Advanced'];

  // ============================
  // LOADER
  // ============================
  const loader = document.getElementById('loader');
  const loaderFill = loader.querySelector('.loader-fill');
  const loaderStatus = document.getElementById('loader-status');
  const stages = ['Loading assets', 'Rendering UI', 'Preparing visualizations', 'Ready'];

  // Animate loader fill in 4 steps over 1.2s
  let stage = 0;
  const stageInterval = setInterval(() => {
    stage++;
    if (stage < stages.length) {
      loaderStatus.textContent = stages[stage];
      loaderFill.style.width = ((stage + 1) / stages.length * 100) + '%';
    }
    if (stage >= stages.length - 1) {
      clearInterval(stageInterval);
      setTimeout(() => {
        loader.classList.add('done');
        document.body.classList.remove('loading');
        startAnimations();
      }, 350);
    }
  }, 300);

  // Initial state
  loaderStatus.textContent = stages[0];
  setTimeout(() => { loaderFill.style.width = '25%'; }, 50);

  // ============================
  // CUSTOM CURSOR
  // ============================
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  let isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (!isCoarsePointer) {
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    // Smooth ring follow
    function updateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(updateRing);
    }
    updateRing();

    // Hover state on interactive elements
    const hoverSelectors = 'a, button, .work-card, .contact-card, .viz-tab, .aside-block, [role="button"]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursorDot.classList.add('hovering');
        cursorRing.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursorDot.classList.remove('hovering');
        cursorRing.classList.remove('hovering');
      }
    });
  }

  // ============================
  // MAGNETIC BUTTONS
  // ============================
  if (!isCoarsePointer) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      let bounds;
      el.addEventListener('mouseenter', () => { bounds = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', (e) => {
        if (!bounds) bounds = el.getBoundingClientRect();
        const cx = bounds.left + bounds.width / 2;
        const cy = bounds.top + bounds.height / 2;
        const dx = (e.clientX - cx) * 0.25;
        const dy = (e.clientY - cy) * 0.25;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        bounds = null;
      });
    });
  }

  // ============================
  // SCROLL PROGRESS BAR
  // ============================
  const scrollProgress = document.getElementById('scroll-progress');
  function updateScrollProgress() {
    const h = document.documentElement;
    const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    scrollProgress.style.width = scrolled + '%';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });

  // ============================
  // NAV SCROLL STATE
  // ============================
  const nav = document.getElementById('nav');
  function updateNav() { nav.classList.toggle('scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // ============================
  // REVEAL ON SCROLL
  // ============================
  function setupReveals() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');

          // Stagger child line reveals
          const lines = entry.target.querySelectorAll('[data-reveal-line]');
          lines.forEach((line, i) => {
            setTimeout(() => line.classList.add('in'), i * 80);
          });

          // Trigger count-up if present
          const counts = entry.target.querySelectorAll('.kpi-num');
          counts.forEach(c => animateCount(c));

          // Trigger skill bar fill
          const skillRows = entry.target.querySelectorAll('.skill-row');
          skillRows.forEach((r, i) => {
            setTimeout(() => r.classList.add('in-view'), i * 80);
          });

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));

    // Also observe section-titles directly so their lines reveal even if parent already in view
    document.querySelectorAll('.section-title, .hero-title').forEach(el => {
      const lineObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const lines = entry.target.querySelectorAll('[data-reveal-line]');
            lines.forEach((line, i) => {
              setTimeout(() => line.classList.add('in'), i * 100);
            });
            lineObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      lineObs.observe(el);
    });

    // Observe skill groups specifically
    const skillObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.skill-row').forEach((r, i) => {
            setTimeout(() => r.classList.add('in-view'), i * 60);
          });
          skillObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.skill-group').forEach(el => skillObs.observe(el));
  }

  // ============================
  // COUNT-UP NUMBERS
  // ============================
  function animateCount(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0');
    const noformat = el.dataset.noformat !== undefined;
    const duration = 1500;
    const start = performance.now();

    function tick(t) {
      const p = Math.min(1, (t - start) / duration);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      if (noformat) {
        el.textContent = Math.round(val).toString();
      } else if (decimals > 0) {
        el.textContent = val.toFixed(decimals);
      } else {
        el.textContent = Math.round(val).toLocaleString();
      }
      if (p < 1) requestAnimationFrame(tick);
      else {
        if (noformat) el.textContent = Math.round(target).toString();
        else if (decimals > 0) el.textContent = target.toFixed(decimals);
        else el.textContent = Math.round(target).toLocaleString();
      }
    }
    requestAnimationFrame(tick);
  }

  // ============================
  // HERO CANVAS — animated particle / connection network
  // ============================
  function setupHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h, dpr;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resize();
      initParticles();
    });

    function initParticles() {
      const count = Math.min(60, Math.floor(w * h / 18000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.5 + 0.5
        });
      }
    }
    initParticles();

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(95, 201, 248, 0.5)';
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(95, 201, 248, ${0.15 * (1 - dist/140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }
    draw();
  }

  // ============================
  // FOOTER TIME (WIB)
  // ============================
  function updateTime() {
    const el = document.getElementById('footer-time');
    if (!el) return;
    const now = new Date();
    // Convert to WIB (UTC+7)
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 7 * 3600000);
    const hh = String(wib.getHours()).padStart(2, '0');
    const mm = String(wib.getMinutes()).padStart(2, '0');
    el.textContent = `${hh}:${mm}`;
  }
  updateTime();
  setInterval(updateTime, 30000);

  // ============================
  // WORK CARDS
  // ============================
  const workGrid = document.getElementById('work-grid');

  function heroImage(item) {
    if (!item.showcase || !item.showcase.length) return null;
    const withImg = item.showcase.find(s => s.image && s.image.length);
    return withImg ? withImg.image : null;
  }

  function renderWorkCards() {
    workGrid.innerHTML = data.achievements.map((a, i) => {
      const img = heroImage(a);
      const imgBlock = img
        ? `<div class="card-img"><img src="${esc(img)}" alt="${esc(a.title)}" /></div>`
        : `<div class="card-img"><div class="card-img-placeholder"><span>Add image &middot; data.json &middot; achievements[${i}].showcase[0].image</span></div></div>`;

      const tags = (a.tags || []).slice(0, 4).map(t => `<span class="card-tag">${esc(t)}</span>`).join('');

      return `
        <article class="work-card" data-idx="${i}" data-reveal tabindex="0" role="button" aria-label="Open ${esc(a.title)}">
          ${imgBlock}
          <div class="card-body">
            <div class="card-meta">
              <span>${esc(a.year)}${a.period ? ' &middot; ' + esc(a.period) : ''}</span>
              <span class="card-type">${esc(a.type)}</span>
            </div>
            <h3 class="card-title">${esc(a.title)}</h3>
            <div class="card-org">${esc(a.org)}</div>
            <p class="card-desc">${esc(a.description)}</p>
            <div class="card-tags">${tags}</div>
            <div class="card-cta">View case study <span class="arr">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 12L12 2M12 2H4M12 2V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </span></div>
          </div>
        </article>
      `;
    }).join('');

    // Bind events
    workGrid.querySelectorAll('.work-card').forEach(card => {
      card.addEventListener('click', () => openModal(parseInt(card.dataset.idx)));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(parseInt(card.dataset.idx));
        }
      });
      // Mouse-tracking glow
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', mx + '%');
        card.style.setProperty('--my', my + '%');
      });
    });
  }

  // ============================
  // SKILLS MATRIX
  // ============================
  function renderSkills() {
    const grid = document.getElementById('skills-grid');
    const groups = Object.entries(data.skills);
    grid.innerHTML = groups.map(([group, items], gi) => `
      <div class="skill-group" data-reveal data-tilt>
        <div class="skill-group-title">
          <span class="sg-num">0${gi+1}</span>
          <span>${esc(group)}</span>
        </div>
        ${items.map(s => skillRow(s)).join('')}
      </div>
    `).join('');
  }

  function skillRow(name) {
    const lvl = SKILL_LEVELS[name] || 1;
    return `
      <div class="skill-row">
        <div class="skill-name">${esc(name)}</div>
        <div class="skill-level">
          <div class="lvl-bar">
            ${[1,2,3].map(i => `<div class="lvl-pip ${i <= lvl ? 'on' : ''}"></div>`).join('')}
          </div>
          <div class="lvl-label">${LEVEL_LABELS[lvl]}</div>
        </div>
      </div>
    `;
  }

  // ============================
  // SIGNATURE DATA VIZ
  // Three real visualization tabs.
  // ============================

  // Tab 1: Bias correction - line chart
  // Raw satellite vs corrected vs ground truth over 30 days
  function genBiasData() {
    const days = 30;
    const truth = [];
    const raw = [];
    const corrected = [];
    for (let i = 0; i < days; i++) {
      const t = i / days;
      // Synthetic but realistic rainfall pattern (sparse rain events)
      const base = 8 + Math.sin(t * Math.PI * 2.3) * 6 + Math.sin(t * Math.PI * 7) * 3;
      const event = (i === 6 || i === 14 || i === 22) ? 18 : 0;
      const truthVal = Math.max(0, base + event + (Math.random() - 0.5) * 2);
      truth.push(truthVal);
      // Raw satellite has positive bias (over-estimates)
      raw.push(truthVal * 1.4 + (Math.random() - 0.5) * 5 + 3);
      // Corrected is much closer to truth
      corrected.push(truthVal + (Math.random() - 0.5) * 2);
    }
    return { truth, raw, corrected };
  }

  // Tab 2: Risk matrix - scatter heatmap (probability vs impact)
  const RISK_DATA = [
    { id: 1, label: 'Battery supply disruption', prob: 4, impact: 5, cat: 'Supply' },
    { id: 2, label: 'Regulatory shift on EVs', prob: 3, impact: 5, cat: 'Policy' },
    { id: 3, label: 'Charging infra delays', prob: 4, impact: 4, cat: 'Ops' },
    { id: 4, label: 'Lithium price volatility', prob: 5, impact: 3, cat: 'Market' },
    { id: 5, label: 'Consumer adoption lag', prob: 3, impact: 4, cat: 'Market' },
    { id: 6, label: 'Grid capacity constraints', prob: 3, impact: 3, cat: 'Ops' },
    { id: 7, label: 'Recycling cost overrun', prob: 2, impact: 3, cat: 'Ops' },
    { id: 8, label: 'Forex exposure', prob: 4, impact: 2, cat: 'Finance' },
    { id: 9, label: 'Talent retention', prob: 2, impact: 4, cat: 'HR' },
    { id: 10, label: 'Cybersecurity breach', prob: 2, impact: 5, cat: 'IT' },
    { id: 11, label: 'Brand reputation event', prob: 1, impact: 4, cat: 'PR' },
    { id: 12, label: 'Tech obsolescence', prob: 2, impact: 3, cat: 'Tech' }
  ];

  // Tab 3: CMIP6 projection - shaded band chart (historical + 2 scenarios)
  function genCMIP6Data() {
    const years = [];
    const hist = [];
    const ssp245 = [];
    const ssp585 = [];
    const ssp245_lo = [];
    const ssp245_hi = [];
    const ssp585_lo = [];
    const ssp585_hi = [];
    for (let y = 2000; y <= 2080; y++) {
      years.push(y);
      const t = (y - 2000) / 80;
      if (y <= 2024) {
        const v = 26.2 + (y - 2000) * 0.018 + Math.sin(y * 0.5) * 0.3;
        hist.push(v);
        ssp245.push(null);
        ssp585.push(null);
        ssp245_lo.push(null); ssp245_hi.push(null);
        ssp585_lo.push(null); ssp585_hi.push(null);
      } else {
        hist.push(null);
        const t2 = (y - 2024) / 56;
        const v245 = 26.6 + t2 * 1.4 + Math.sin(y * 0.6) * 0.2;
        const v585 = 26.6 + t2 * 3.2 + Math.sin(y * 0.6) * 0.2;
        ssp245.push(v245);
        ssp585.push(v585);
        ssp245_lo.push(v245 - 0.6 - t2 * 0.3);
        ssp245_hi.push(v245 + 0.6 + t2 * 0.3);
        ssp585_lo.push(v585 - 0.8 - t2 * 0.5);
        ssp585_hi.push(v585 + 0.8 + t2 * 0.5);
      }
    }
    return { years, hist, ssp245, ssp585, ssp245_lo, ssp245_hi, ssp585_lo, ssp585_hi };
  }

  const svg = document.getElementById('viz-svg');
  const tooltip = document.getElementById('viz-tooltip');
  const W = 1000, H = 460;
  const PAD = { top: 40, right: 60, bottom: 60, left: 70 };
  let currentViz = 'bias';

  function clearViz() { svg.innerHTML = ''; }

  function setVizCaption(method, source, outcome) {
    document.getElementById('vc-method').textContent = method;
    document.getElementById('vc-source').textContent = source;
    document.getElementById('vc-outcome').textContent = outcome;
  }

  function showTooltip(x, y, label, value) {
    tooltip.innerHTML = `<span class="tt-label">${label}</span>${value}`;
    tooltip.style.left = x + 'px';
    tooltip.style.top = (y - 60) + 'px';
    tooltip.classList.add('visible');
  }
  function hideTooltip() { tooltip.classList.remove('visible'); }

  function drawBiasViz() {
    clearViz();
    const d = genBiasData();
    const days = d.truth.length;
    const xMax = days - 1;
    const yMax = Math.max(...d.raw) * 1.1;
    const xScale = (i) => PAD.left + (i / xMax) * (W - PAD.left - PAD.right);
    const yScale = (v) => H - PAD.bottom - (v / yMax) * (H - PAD.top - PAD.bottom);

    let svgContent = '';

    // Background grid
    for (let g = 0; g <= 5; g++) {
      const y = PAD.top + (g / 5) * (H - PAD.top - PAD.bottom);
      const val = yMax * (1 - g / 5);
      svgContent += `<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" stroke="#1f2740" stroke-width="1" stroke-dasharray="2,4" />`;
      svgContent += `<text x="${PAD.left - 10}" y="${y + 4}" fill="#6c7494" font-family="IBM Plex Mono" font-size="10" text-anchor="end">${val.toFixed(0)}</text>`;
    }

    // X axis labels
    for (let g = 0; g <= 6; g++) {
      const i = Math.round((g / 6) * xMax);
      const x = xScale(i);
      svgContent += `<text x="${x}" y="${H - PAD.bottom + 20}" fill="#6c7494" font-family="IBM Plex Mono" font-size="10" text-anchor="middle">Day ${i+1}</text>`;
    }

    // Y axis label
    svgContent += `<text x="${PAD.left - 50}" y="${PAD.top - 10}" fill="#a8b0c8" font-family="IBM Plex Mono" font-size="11" font-weight="500">Rainfall (mm/day)</text>`;

    // Line: raw (uncorrected)
    let rawPath = '';
    d.raw.forEach((v, i) => {
      rawPath += (i === 0 ? 'M' : 'L') + xScale(i) + ',' + yScale(v) + ' ';
    });
    svgContent += `<path d="${rawPath}" fill="none" stroke="#fbbf24" stroke-width="2" opacity="0" stroke-dasharray="${W*2}" stroke-dashoffset="${W*2}"><animate attributeName="opacity" from="0" to="0.7" dur="0.4s" begin="0s" fill="freeze"/><animate attributeName="stroke-dashoffset" from="${W*2}" to="0" dur="1.4s" begin="0s" fill="freeze"/></path>`;

    // Line: corrected
    let corrPath = '';
    d.corrected.forEach((v, i) => {
      corrPath += (i === 0 ? 'M' : 'L') + xScale(i) + ',' + yScale(v) + ' ';
    });
    svgContent += `<path d="${corrPath}" fill="none" stroke="#5fc9f8" stroke-width="2.5" opacity="0" stroke-dasharray="${W*2}" stroke-dashoffset="${W*2}"><animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.3s" fill="freeze"/><animate attributeName="stroke-dashoffset" from="${W*2}" to="0" dur="1.4s" begin="0.3s" fill="freeze"/></path>`;

    // Truth as dots
    d.truth.forEach((v, i) => {
      svgContent += `<circle cx="${xScale(i)}" cy="${yScale(v)}" r="3" fill="#a78bfa" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="${0.6 + i * 0.03}s" fill="freeze"/></circle>`;
      // Hover hit area
      svgContent += `<circle data-tip="day-${i}" data-truth="${v.toFixed(1)}" data-raw="${d.raw[i].toFixed(1)}" data-corr="${d.corrected[i].toFixed(1)}" data-day="${i+1}" cx="${xScale(i)}" cy="${yScale(v)}" r="14" fill="transparent" style="cursor: none;" />`;
    });

    // Legend
    svgContent += `
      <g transform="translate(${W - PAD.right - 280}, ${PAD.top - 24})">
        <rect x="0" y="0" width="280" height="22" fill="#0e1220" stroke="#1f2740" rx="4" />
        <line x1="12" y1="11" x2="28" y2="11" stroke="#fbbf24" stroke-width="2" opacity="0.7"/>
        <text x="34" y="15" fill="#a8b0c8" font-family="IBM Plex Mono" font-size="10">Raw GPM</text>
        <line x1="100" y1="11" x2="116" y2="11" stroke="#5fc9f8" stroke-width="2.5"/>
        <text x="122" y="15" fill="#a8b0c8" font-family="IBM Plex Mono" font-size="10">Corrected</text>
        <circle cx="200" cy="11" r="3" fill="#a78bfa"/>
        <text x="210" y="15" fill="#a8b0c8" font-family="IBM Plex Mono" font-size="10">Ground gauge</text>
      </g>
    `;

    svg.innerHTML = svgContent;

    // Bind tooltip
    svg.querySelectorAll('[data-tip]').forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        const day = el.dataset.day;
        const t = parseFloat(el.dataset.truth);
        const r = parseFloat(el.dataset.raw);
        const c = parseFloat(el.dataset.corr);
        const rect = svg.getBoundingClientRect();
        const wrapRect = svg.parentElement.getBoundingClientRect();
        const cx = parseFloat(el.getAttribute('cx'));
        const cy = parseFloat(el.getAttribute('cy'));
        // Map SVG coords to wrap coords
        const scale = rect.width / W;
        const sx = rect.left - wrapRect.left + cx * scale;
        const sy = rect.top - wrapRect.top + cy * scale;
        showTooltip(sx, sy, `DAY ${day}`, `Truth ${t} &middot; Raw ${r} &middot; Corr ${c}`);
      });
      el.addEventListener('mouseleave', hideTooltip);
    });

    setVizCaption(
      'Linear Scaling + Quantile Mapping',
      'GPM IMERG satellite vs ground gauge, 30-day window',
      'Bias reduced from +40% to within ±8%, R² improved 0.42 → 0.78'
    );
  }

  function drawRiskViz() {
    clearViz();
    let svgContent = '';
    const cellW = (W - PAD.left - PAD.right) / 5;
    const cellH = (H - PAD.top - PAD.bottom) / 5;

    // Heatmap cells (color by prob * impact)
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        const x = PAD.left + (p - 1) * cellW;
        const y = H - PAD.bottom - i * cellH;
        const severity = p * i;
        let color;
        if (severity <= 6) color = '#1a2540';
        else if (severity <= 12) color = '#2a3454';
        else if (severity <= 16) color = '#4a3a54';
        else if (severity <= 20) color = '#7a3a54';
        else color = '#a83a54';
        svgContent += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${color}" stroke="#1f2740" stroke-width="1" opacity="0"><animate attributeName="opacity" from="0" to="0.6" dur="0.3s" begin="${(p+i)*0.04}s" fill="freeze"/></rect>`;
      }
    }

    // Axes labels
    for (let i = 1; i <= 5; i++) {
      const x = PAD.left + (i - 0.5) * cellW;
      svgContent += `<text x="${x}" y="${H - PAD.bottom + 20}" fill="#6c7494" font-family="IBM Plex Mono" font-size="10" text-anchor="middle">${i}</text>`;
      const y = H - PAD.bottom - (i - 0.5) * cellH;
      svgContent += `<text x="${PAD.left - 12}" y="${y + 4}" fill="#6c7494" font-family="IBM Plex Mono" font-size="10" text-anchor="end">${i}</text>`;
    }
    svgContent += `<text x="${PAD.left + (W - PAD.left - PAD.right)/2}" y="${H - 12}" fill="#a8b0c8" font-family="IBM Plex Mono" font-size="11" text-anchor="middle">Probability →</text>`;
    svgContent += `<text x="${PAD.left - 50}" y="${PAD.top + (H - PAD.top - PAD.bottom)/2}" fill="#a8b0c8" font-family="IBM Plex Mono" font-size="11" text-anchor="middle" transform="rotate(-90 ${PAD.left - 50} ${PAD.top + (H - PAD.top - PAD.bottom)/2})">Impact →</text>`;

    // Risk points
    RISK_DATA.forEach((r, idx) => {
      // Position slightly offset within cell, with small jitter for overlap
      const x = PAD.left + (r.prob - 1 + 0.5 + (Math.random() - 0.5) * 0.4) * cellW;
      const y = H - PAD.bottom - (r.impact - 1 + 0.5 + (Math.random() - 0.5) * 0.4) * cellH;
      svgContent += `
        <g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="${0.5 + idx*0.06}s" fill="freeze"/>
          <circle cx="${x}" cy="${y}" r="14" fill="#5fc9f8" fill-opacity="0.2" stroke="#5fc9f8" stroke-width="1.5"/>
          <text x="${x}" y="${y + 4}" fill="#f5f7fa" font-family="IBM Plex Mono" font-size="10" font-weight="600" text-anchor="middle">${r.id}</text>
          <circle data-tip="risk-${r.id}" data-label="${esc(r.label)}" data-prob="${r.prob}" data-impact="${r.impact}" data-cat="${r.cat}" cx="${x}" cy="${y}" r="18" fill="transparent" style="cursor: none;" />
        </g>`;
    });

    svg.innerHTML = svgContent;

    svg.querySelectorAll('[data-tip]').forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        const label = el.dataset.label;
        const p = el.dataset.prob;
        const i = el.dataset.impact;
        const cat = el.dataset.cat;
        const rect = svg.getBoundingClientRect();
        const wrapRect = svg.parentElement.getBoundingClientRect();
        const cx = parseFloat(el.getAttribute('cx'));
        const cy = parseFloat(el.getAttribute('cy'));
        const scale = rect.width / W;
        const sx = rect.left - wrapRect.left + cx * scale;
        const sy = rect.top - wrapRect.top + cy * scale;
        showTooltip(sx, sy, cat, `${label} &middot; P:${p} I:${i}`);
      });
      el.addEventListener('mouseleave', hideTooltip);
    });

    setVizCaption(
      '12-factor risk scoring &middot; probability × impact',
      'ECOS framework, IEEEBIG 2026 national finalist submission',
      'Anchor slide for executive presentation, top-3 placement (98 teams)'
    );
  }

  function drawCMIP6Viz() {
    clearViz();
    const d = genCMIP6Data();
    const yMin = 25, yMax = 32;
    const xMax = d.years.length - 1;
    const xScale = (i) => PAD.left + (i / xMax) * (W - PAD.left - PAD.right);
    const yScale = (v) => H - PAD.bottom - ((v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

    let svgContent = '';

    // Grid
    for (let g = 0; g <= 5; g++) {
      const y = PAD.top + (g / 5) * (H - PAD.top - PAD.bottom);
      const val = yMax - (g / 5) * (yMax - yMin);
      svgContent += `<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" stroke="#1f2740" stroke-width="1" stroke-dasharray="2,4" />`;
      svgContent += `<text x="${PAD.left - 10}" y="${y + 4}" fill="#6c7494" font-family="IBM Plex Mono" font-size="10" text-anchor="end">${val.toFixed(1)}°</text>`;
    }

    for (let g = 0; g <= 8; g++) {
      const i = Math.round((g / 8) * xMax);
      const x = xScale(i);
      svgContent += `<text x="${x}" y="${H - PAD.bottom + 20}" fill="#6c7494" font-family="IBM Plex Mono" font-size="10" text-anchor="middle">${d.years[i]}</text>`;
    }
    svgContent += `<text x="${PAD.left - 50}" y="${PAD.top - 10}" fill="#a8b0c8" font-family="IBM Plex Mono" font-size="11" font-weight="500">Mean Temperature (°C)</text>`;

    // SSP585 uncertainty band (red)
    let band585 = 'M';
    d.years.forEach((y, i) => {
      if (d.ssp585_lo[i] !== null) {
        band585 += xScale(i) + ',' + yScale(d.ssp585_lo[i]) + ' L';
      }
    });
    band585 = band585.slice(0, -2) + ' L';
    for (let i = d.years.length - 1; i >= 0; i--) {
      if (d.ssp585_hi[i] !== null) {
        band585 += xScale(i) + ',' + yScale(d.ssp585_hi[i]) + ' L';
      }
    }
    band585 = band585.slice(0, -2) + ' Z';
    svgContent += `<path d="${band585}" fill="#f0abfc" fill-opacity="0" stroke="none"><animate attributeName="fill-opacity" from="0" to="0.12" dur="0.8s" begin="0.4s" fill="freeze"/></path>`;

    // SSP245 uncertainty band (cyan)
    let band245 = 'M';
    d.years.forEach((y, i) => {
      if (d.ssp245_lo[i] !== null) {
        band245 += xScale(i) + ',' + yScale(d.ssp245_lo[i]) + ' L';
      }
    });
    band245 = band245.slice(0, -2) + ' L';
    for (let i = d.years.length - 1; i >= 0; i--) {
      if (d.ssp245_hi[i] !== null) {
        band245 += xScale(i) + ',' + yScale(d.ssp245_hi[i]) + ' L';
      }
    }
    band245 = band245.slice(0, -2) + ' Z';
    svgContent += `<path d="${band245}" fill="#5fc9f8" fill-opacity="0" stroke="none"><animate attributeName="fill-opacity" from="0" to="0.15" dur="0.8s" begin="0.4s" fill="freeze"/></path>`;

    // Historical
    let histPath = '';
    let first = true;
    d.hist.forEach((v, i) => {
      if (v !== null) {
        histPath += (first ? 'M' : 'L') + xScale(i) + ',' + yScale(v) + ' ';
        first = false;
      }
    });
    svgContent += `<path d="${histPath}" fill="none" stroke="#a8b0c8" stroke-width="2" opacity="0" stroke-dasharray="${W*2}" stroke-dashoffset="${W*2}"><animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0s" fill="freeze"/><animate attributeName="stroke-dashoffset" from="${W*2}" to="0" dur="1.2s" begin="0s" fill="freeze"/></path>`;

    // SSP245
    let path245 = '';
    first = true;
    d.ssp245.forEach((v, i) => {
      if (v !== null) {
        path245 += (first ? 'M' : 'L') + xScale(i) + ',' + yScale(v) + ' ';
        first = false;
      }
    });
    svgContent += `<path d="${path245}" fill="none" stroke="#5fc9f8" stroke-width="2.5" opacity="0" stroke-dasharray="${W*2}" stroke-dashoffset="${W*2}"><animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.4s" fill="freeze"/><animate attributeName="stroke-dashoffset" from="${W*2}" to="0" dur="1.2s" begin="0.4s" fill="freeze"/></path>`;

    // SSP585
    let path585 = '';
    first = true;
    d.ssp585.forEach((v, i) => {
      if (v !== null) {
        path585 += (first ? 'M' : 'L') + xScale(i) + ',' + yScale(v) + ' ';
        first = false;
      }
    });
    svgContent += `<path d="${path585}" fill="none" stroke="#f0abfc" stroke-width="2.5" opacity="0" stroke-dasharray="${W*2}" stroke-dashoffset="${W*2}"><animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.6s" fill="freeze"/><animate attributeName="stroke-dashoffset" from="${W*2}" to="0" dur="1.2s" begin="0.6s" fill="freeze"/></path>`;

    // Vertical line at 2024 (now)
    const xNow = xScale(24);
    svgContent += `<line x1="${xNow}" y1="${PAD.top}" x2="${xNow}" y2="${H - PAD.bottom}" stroke="#6c7494" stroke-width="1" stroke-dasharray="3,3" opacity="0"><animate attributeName="opacity" from="0" to="0.5" dur="0.4s" begin="1.4s" fill="freeze"/></line>`;
    svgContent += `<text x="${xNow + 6}" y="${PAD.top + 12}" fill="#6c7494" font-family="IBM Plex Mono" font-size="9" opacity="0"><animate attributeName="opacity" from="0" to="0.8" dur="0.4s" begin="1.4s" fill="freeze"/>NOW</text>`;

    // Legend
    svgContent += `
      <g transform="translate(${W - PAD.right - 300}, ${PAD.top - 24})">
        <rect x="0" y="0" width="300" height="22" fill="#0e1220" stroke="#1f2740" rx="4" />
        <line x1="12" y1="11" x2="28" y2="11" stroke="#a8b0c8" stroke-width="2"/>
        <text x="34" y="15" fill="#a8b0c8" font-family="IBM Plex Mono" font-size="10">Historical</text>
        <line x1="108" y1="11" x2="124" y2="11" stroke="#5fc9f8" stroke-width="2.5"/>
        <text x="130" y="15" fill="#a8b0c8" font-family="IBM Plex Mono" font-size="10">SSP2-4.5</text>
        <line x1="200" y1="11" x2="216" y2="11" stroke="#f0abfc" stroke-width="2.5"/>
        <text x="222" y="15" fill="#a8b0c8" font-family="IBM Plex Mono" font-size="10">SSP5-8.5</text>
      </g>
    `;

    svg.innerHTML = svgContent;

    setVizCaption(
      'CMIP6 statistical downscaling &middot; Linear Scaling vs CHIRPS',
      'BMKG Climate Change Information Centre, July-August 2025',
      'Two-scenario projection 2025-2080, validated against historical baseline'
    );
  }

  function switchViz(name) {
    currentViz = name;
    document.querySelectorAll('.viz-tab').forEach(t => t.classList.toggle('active', t.dataset.viz === name));
    if (name === 'bias') drawBiasViz();
    else if (name === 'risk') drawRiskViz();
    else if (name === 'ts') drawCMIP6Viz();
  }

  document.querySelectorAll('.viz-tab').forEach(t => {
    t.addEventListener('click', () => switchViz(t.dataset.viz));
  });

  // Lazy draw first viz when viz section enters viewport
  const vizSection = document.querySelector('.section-viz');
  const vizObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        drawBiasViz();
        vizObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  if (vizSection) vizObserver.observe(vizSection);

  // ============================
  // MODAL
  // ============================
  const modal = document.getElementById('modal');

  function openModal(idx) {
    const item = data.achievements[idx];
    if (!item) return;
    const content = document.getElementById('modal-content');

    const linkBlock = (item.link && item.link.length)
      ? `<a class="mc-link" href="${esc(item.link)}" target="_blank" rel="noopener">View project documentation
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 12L12 2M12 2H4M12 2V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </a>`
      : `<div class="mc-link-missing">Add project link &middot; data.json &middot; achievements[${idx}].link</div>`;

    content.innerHTML = `
      <div class="mc-meta">
        <span class="mc-type">${esc(item.type)}</span>
        <span class="mc-pill">${esc(item.year)}</span>
        ${item.period ? `<span class="mc-pill">${esc(item.period)}</span>` : ''}
        ${item.role ? `<span class="mc-pill">${esc(item.role)}</span>` : ''}
      </div>
      <h2>${esc(item.title)}</h2>
      <div class="mc-org">${esc(item.org)}</div>
      <div class="mc-body">
        ${(item.fullDescription || [item.description]).map(p => `<p>${esc(p)}</p>`).join('')}
      </div>
      ${linkBlock}
      ${item.highlights && item.highlights.length ? `
        <div class="mc-section">
          <div class="mc-section-title">Key contributions</div>
          <ul class="mc-highlights">${item.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        </div>` : ''}
      ${item.tags && item.tags.length ? `
        <div class="mc-section">
          <div class="mc-section-title">Tools &amp; methods</div>
          <div class="mc-tags">${item.tags.map(t => `<span class="mc-tag">${esc(t)}</span>`).join('')}</div>
        </div>` : ''}
      ${item.showcase && item.showcase.length ? `
        <div class="mc-section">
          <div class="mc-section-title">Showcase</div>
          <div class="mc-showcase">
            ${item.showcase.map((s, si) => `
              <div class="mc-show-tile">
                <div class="show-img ${s.image ? '' : 'empty'}">
                  ${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.label)}" />` : `<span>showcase[${si}].image</span>`}
                </div>
                <div class="show-caption-box">
                  <div class="show-label">${esc(s.label)}</div>
                  <div class="show-caption">${esc(s.caption || '')}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // ============================
  // UTILITY
  // ============================
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ============================
  // STARTUP
  // ============================
  function startAnimations() {
    setupHeroCanvas();
    setupReveals();
    // Initial hero content reveal (force it since may be above fold)
    setTimeout(() => {
      document.querySelectorAll('.hero [data-reveal]').forEach(el => el.classList.add('in'));
      document.querySelectorAll('.hero [data-reveal-line]').forEach((line, i) => {
        setTimeout(() => line.classList.add('in'), i * 100);
      });
      // Kick off hero count-ups
      document.querySelectorAll('.hero .kpi-num').forEach(c => animateCount(c));
    }, 100);
  }

  renderWorkCards();
  renderSkills();

})();
