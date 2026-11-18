const stations = [
  // x, airflow, signal, ribbon width
  [-40, 207, 207, 68], [55, 190, 190, 63], [155, 128, 128, 56], [260, 115, 115, 46],
  [370, 161, 161, 51], [476, 199, 199, 53], [565, 189, 189, 39], [652, 152, 152, 24],
  [718, 134, 134, 12], [782, 130, 130, 5], [824, 132, 132, 7], [855, 134, 118, 8],
  [880, 136, 145, 8], [904, 139, 173, 9], [932, 142, 72, 12], [956, 145, 196, 11],
  [982, 147, 120, 10], [1012, 148, 151, 10], [1040, 148, 139, 12], [1084, 145, 154, 15],
  [1140, 138, 113, 22], [1204, 128, 151, 32], [1271, 124, 129, 44], [1360, 112, 127, 56],
];

const lanes = [-1, -.86, -.7, -.54, -.37, -.19, 0, .19, .37, .54, .7, .86, 1];
const restingMix = .23;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const position = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;

function pathFor(lane, mix = restingMix, pointerX = 0, pointerY = 0) {
  const points = stations.map(([x, air, signal, spread]) => {
    const reach = clamp(1 - Math.abs(x - pointerX) / 490);
    const gate = clamp(Math.abs(x - 782) / 125);
    const bend = pointerY * reach ** 2 * gate;
    return [x, air + (signal - air) * mix + lane * spread + bend * (1 + lane * .17)];
  });
  let d = `M ${position(points[0][0], points[0][1])}`;
  for (let i = 1; i < points.length; i += 1) {
    const [lastX, lastY] = points[i - 2] ?? points[0];
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const [nextX, nextY] = points[i + 1] ?? points[i];
    const handle = (x1 - x0) / 3;
    const incoming = (y1 - lastY) / (x1 - lastX);
    const outgoing = (nextY - y0) / (nextX - x0);
    d += ` C ${position(x0 + handle, y0 + incoming * handle)} ${position(x1 - handle, y1 - outgoing * handle)} ${position(x1, y1)}`;
  }
  return d;
}

export function renderBreath() {
  const ribbon = lanes.map((lane, index) => {
    const style = lane === 0 ? 'breath-core' : 'breath-line';
    const detail = index % 2 && lane !== 0 ? ' breath-detail' : '';
    return `<path data-lane="${lane}" class="${style}${detail}" d="${pathFor(lane)}"/>`;
  }).join('');
  return `<svg id="breath-art" class="breath-art" viewBox="0 0 1320 274" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="breath-ink"><stop stop-color="#6aaee2" stop-opacity=".08"/><stop offset=".19" stop-color="#4c9bd6" stop-opacity=".65"/><stop offset=".59" stop-color="#2464ad"/><stop offset=".81" stop-color="#2589cf"/><stop offset="1" stop-color="#78c0ec" stop-opacity=".26"/></linearGradient>
      <radialGradient id="breath-field"><stop stop-color="#a5d9fb" stop-opacity=".68"/><stop offset="1" stop-color="#cce8fb" stop-opacity="0"/></radialGradient>
      <pattern id="breath-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" stroke="#4d91c1" stroke-opacity=".10"/></pattern>
    </defs>
    <ellipse cx="786" cy="130" rx="570" ry="135" fill="url(#breath-field)"/>
    <rect x="622" y="26" width="698" height="211" fill="url(#breath-grid)"/>
    <path d="M0 130H1320 M782 16V249" stroke="#4286bb" stroke-opacity=".32" stroke-dasharray="2 7"/>
    <g class="breath-gate">
      <rect x="747" y="55" width="70" height="150" rx="35" fill="#f4fbff" fill-opacity=".57" stroke="#559ad0" stroke-opacity=".48"/>
      <rect x="764" y="78" width="36" height="104" rx="18" stroke="#559ad0" stroke-opacity=".52"/>
      <path d="M770 44h24m-24 172h24m-62-86h8m84 0h8" stroke="#2464ad" stroke-opacity=".74"/>
    </g>
    <g stroke="url(#breath-ink)" vector-effect="non-scaling-stroke">${ribbon}
    <path class="breath-particles" data-lane="0.79" d="${pathFor(.79)}"/></g>
    <circle cx="782" cy="130" r="5.5" fill="#1b58a4" stroke="#ecf8ff" stroke-width="2"/>
    <circle data-breath-pulse cx="782" cy="130" r="9" stroke="#2464ad" stroke-width="1.5" opacity="0"/>
  </svg>`;
}

/** @param {HTMLElement} figure @param {MediaQueryList} reducedMotion */
export function activateBreath(figure, reducedMotion) {
  const trigger = figure.querySelector('button');
  const stage = figure.querySelector('[data-breath-stage]');
  const pulse = figure.querySelector('[data-breath-pulse]');
  const status = figure.querySelector('[data-breath-status]');
  const art = figure.querySelector('svg');
  if (!trigger || !stage || !pulse || !status || !art || typeof requestAnimationFrame !== 'function') return;

  const paths = [...art.querySelectorAll('path[data-lane]')].map((path) => ({
    path, lane: Number(path.getAttribute('data-lane')), detail: path.classList.contains('breath-detail'),
  }));
  const compact = matchMedia('(max-width: 660px)');
  let frame = 0;
  let visible = true;
  let signal = false;
  let scrollMix = 0;
  let readScroll = true;
  let lastTime = 0;
  let pulseStart = -Infinity;
  let pointerX = 0;
  let pointerGoal = 0;
  let pointerTarget = 0;
  let bend = 0;
  let mix = restingMix;
  const hero = figure.closest('.hero');

  function draw() {
    for (const { path, lane, detail } of paths) {
      if (!detail || !compact.matches) path.setAttribute('d', pathFor(lane, mix, pointerX, bend));
    }
  }

  function schedule(continuing = false) {
    if (!frame && visible && !reducedMotion.matches) {
      if (!continuing) lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    frame = 0;
    if (readScroll && hero) {
      const bounds = hero.getBoundingClientRect();
      scrollMix = .45 * clamp(-bounds.top / (bounds.height * .66));
      readScroll = false;
    }
    const target = signal ? 1 : restingMix + scrollMix;
    const previousMix = mix;
    const previousBend = bend;
    const previousX = pointerX;
    const smoothing = 1 - Math.exp(-Math.max(0, now - lastTime) / 135);
    lastTime = now;
    pointerX += (pointerGoal - pointerX) * smoothing;
    bend += (pointerTarget - bend) * smoothing;
    mix += (target - mix) * smoothing;
    const anchorMoving = Math.abs(pointerGoal - pointerX) > 1 && Math.abs(bend) > .25;
    const changing = anchorMoving || Math.abs(pointerTarget - bend) > .25 || Math.abs(target - mix) > .003;
    if (!changing) {
      bend = pointerTarget;
      pointerX = pointerGoal;
      mix = target;
    }
    if (mix !== previousMix || bend !== previousBend || (bend !== 0 && pointerX !== previousX)) draw();
    const progress = clamp((now - pulseStart) / 980);
    pulse.setAttribute('r', String(10 + 72 * (1 - (1 - progress) ** 2)));
    pulse.setAttribute('opacity', String(.62 * (1 - progress) ** 2));
    if (changing || progress < 1) schedule(true);
  }

  const resetMotion = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    pointerTarget = bend = 0;
    pulseStart = -Infinity;
    pulse.setAttribute('opacity', '0');
  };

  trigger.hidden = false;
  trigger.addEventListener('click', () => {
    signal = !signal;
    trigger.setAttribute('aria-pressed', String(signal));
    status.textContent = signal ? 'Pola sinyal konseptual ditampilkan.' : 'Aliran napas konseptual ditampilkan.';
    if (reducedMotion.matches) {
      mix = signal ? 1 : restingMix;
      draw();
      return;
    }
    pulseStart = performance.now();
    schedule();
  });

  trigger.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || reducedMotion.matches) return;
    const bounds = stage.getBoundingClientRect();
    pointerGoal = clamp((event.clientX - bounds.left) / bounds.width) * 1320;
    pointerTarget = clamp((event.clientY - bounds.top) / bounds.height - .5, -.5, .5) * 74;
    schedule();
  }, { passive: true });
  trigger.addEventListener('pointerleave', () => { pointerTarget = 0; schedule(); });
  window.addEventListener('scroll', () => {
    readScroll = true;
    schedule();
  }, { passive: true });
  compact.addEventListener('change', draw);
  reducedMotion.addEventListener('change', () => {
    resetMotion();
    mix = signal ? 1 : restingMix;
    draw();
    readScroll = true;
    schedule();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        draw();
        readScroll = true;
        schedule();
      } else {
        resetMotion();
      }
    }).observe(figure);
  }
}
