import { anchorAt, assemblyMode, frameAssembly, interpolatedProgress } from './explosion.mjs';

/** @typedef {{name: string, emissiveFactor: number[], emissiveStrength: number,
 * setEmissiveFactor(color: number[]): void, setEmissiveStrength(strength: number): void,
 * pbrMetallicRoughness: {baseColorFactor: number[], setBaseColorFactor(color: number[]): void}}} Material */
/** @typedef {HTMLElement & {
 * availableAnimations: string[], duration: number, currentTime: number,
 * model: {materials: Material[]}, play(options: {repetitions: number}): void, pause(): void,
 * dismissPoster(): void, jumpCameraToGoal(): void,
 * getCameraOrbit(): {theta: number, phi: number, radius: number},
 * materialFromPoint(x: number, y: number): Material | null,
 * updateHotspot(value: {name: string, position: string, normal: string}): void,
 * queryHotspot(name: string): {facingCamera: boolean, canvasPosition: {x: number, y: number}} | null
 * }} ModelViewer */

const toMeters = (coordinates) => coordinates.map((value) => `${value.toFixed(5)}m`).join(' ');
const overviewAngles = [169, 77];
const modeLabels = {
  assembled: 'Perangkat utuh', exploding: 'Membongkar…', exploded: 'Susunan terurai',
  focusing: 'Inspeksi komponen', reassembling: 'Menyusun kembali…',
};

/** @param {HTMLElement} explorer @param {MediaQueryList} reducedMotion */
export function activateExplorer(explorer, reducedMotion) {
  const viewport = explorer.querySelector('.viewport');
  const poster = viewport.querySelector('img');
  const posterMarkers = /** @type {HTMLElement} */ (explorer.querySelector('[data-markers]'));
  const controls = /** @type {HTMLElement} */ (explorer.querySelector('[data-controls]'));
  const cameraTools = /** @type {HTMLElement} */ (explorer.querySelector('[data-camera-tools]'));
  const assemblyControls = /** @type {HTMLElement} */ (explorer.querySelector('[data-assembly-controls]'));
  const load = /** @type {HTMLButtonElement} */ (explorer.querySelector('[data-load]'));
  const explode = /** @type {HTMLButtonElement} */ (explorer.querySelector('[data-explode]'));
  const assembled = /** @type {HTMLButtonElement} */ (explorer.querySelector('[data-assembled]'));
  const overview = /** @type {HTMLButtonElement} */ (explorer.querySelector('[data-overview]'));
  const range = /** @type {HTMLInputElement} */ (explorer.querySelector('#explosion-progress'));
  const percentage = explorer.querySelector('[data-progress-label]');
  const status = explorer.querySelector('[data-viewer-status]');
  const modeLabel = explorer.querySelector('[data-mode-label]');
  const views = [...explorer.querySelector('.view-options').querySelectorAll('button')];
  const bounds = JSON.parse(explorer.dataset.bounds);
  const parts = new Map([...explorer.querySelectorAll('details')].map((details) => [
    details.dataset.component, {
      id: details.dataset.component, index: Number(details.dataset.part), details,
      summary: details.querySelector('summary'), name: details.querySelector('summary').children[1].textContent,
      ...JSON.parse(details.dataset.geometry),
    },
  ]));

  const state = {
    progress: 0, selectedComponent: /** @type {string | null} */ (null),
    cameraPreset: views[0].dataset.view, goal: /** @type {number | null} */ (null),
  };
  let staticView = views[0];
  /** @type {ModelViewer | undefined} */
  let viewer;
  let canExplode = false;
  let loading = false;
  let inView = true;
  let runtime;
  let motionFrame = 0;
  let markerTimer = 0;
  let markerNodes = new Map();
  /** @type {{material: Material, component: string, base: number[], emissive: number[], strength: number}[]} */
  let materials = [];

  function warmRuntime() {
    runtime ??= import(new URL(explorer.dataset.runtime, document.baseURI).href).catch((error) => {
      runtime = undefined;
      throw error;
    });
    return runtime;
  }

  function updateButtons() {
    const mode = assemblyMode(state.progress, state.selectedComponent, state.goal);
    explorer.dataset.mode = mode;
    explorer.dataset.selectedComponent = state.selectedComponent ?? '';
    modeLabel.textContent = modeLabels[mode];
    const progress = Math.round(state.progress * 100);
    range.value = String(progress);
    percentage.textContent = `${progress}%`;
    range.setAttribute('aria-valuetext', `${progress} persen`);
    explode.querySelector('span').textContent = state.goal === 1 || (state.goal === null && state.progress > 0) ?
      'Susun Kembali' : 'Bongkar Perangkat';
    assembled.disabled = state.progress === 0 && state.goal === null && !state.selectedComponent;
    overview.hidden = !state.selectedComponent;
    for (const button of views) button.setAttribute('aria-pressed', String(button.dataset.view === state.cameraPreset));
  }

  function showPoster() {
    poster.src = staticView.dataset.image;
    poster.alt = staticView.dataset.alt;
    posterMarkers.hidden = Boolean(viewer) || staticView.dataset.view !== 'front';
  }

  function syncSelection() {
    for (const part of parts.values()) {
      const selected = state.selectedComponent === part.id;
      part.details.open = selected;
      markerNodes.get(part.id)?.setAttribute('aria-pressed', String(selected));
      posterMarkers.querySelector(`[data-marker="${part.index}"]`)?.setAttribute('aria-pressed', String(selected));
    }
    for (const entry of materials) {
      const active = entry.component === state.selectedComponent;
      const dimmed = state.selectedComponent && !active;
      const color = entry.base.map((channel, index) => dimmed && index < 3 ? channel * .58 + .07 : channel);
      entry.material.pbrMetallicRoughness.setBaseColorFactor(color);
      entry.material.setEmissiveFactor(active ? [.075, .29, .62] : (dimmed ? entry.emissive.map((v) => v * .58) : entry.emissive));
      entry.material.setEmissiveStrength(active ? .43 : entry.strength);
    }
    updateButtons();
    scheduleMarkers();
  }

  function markerVisibility() {
    markerTimer = 0;
    if (!viewer || !inView) return;
    const rect = viewer.getBoundingClientRect();
    // Prioritize a selected hotspot, then hide overlapping or occluded targets.
    const order = [...markerNodes.keys()].sort((a, b) =>
      Number(b === state.selectedComponent) - Number(a === state.selectedComponent));
    const placed = [];
    for (const id of order) {
      const button = markerNodes.get(id);
      const part = parts.get(id);
      const hotspot = viewer.queryHotspot(button.slot);
      let show = Boolean(hotspot?.facingCamera) && (!part.internal || state.progress >= .58);
      if (show && hotspot) {
        const { x, y } = hotspot.canvasPosition;
        show = x > 23 && x < rect.width - 23 && y > 23 && y < rect.height - 23 &&
          placed.every((point) => Math.hypot(x - point.x, y - point.y) >= 45);
        if (show && canExplode) {
          const picked = viewer.materialFromPoint(rect.left + x, rect.top + y);
          show = !picked || picked.name.startsWith(`${id}__`);
        }
        if (show) placed.push({ x, y });
      }
      button.hidden = !show;
    }
  }

  function scheduleMarkers() {
    if (viewer && inView && !markerTimer) markerTimer = window.setTimeout(markerVisibility, 75);
  }

  function applyProgress(value) {
    state.progress = Math.max(0, Math.min(1, value));
    if (canExplode && viewer) {
      // Sampling one tick before the end also keeps repeated reverse scrubs
      // away from the animation mixer's terminal "finished" state.
      viewer.currentTime = Math.min(viewer.duration * state.progress, viewer.duration - .00001);
      for (const [id, button] of markerNodes) {
        const part = parts.get(id);
        viewer.updateHotspot({
          name: button.slot, position: toMeters(anchorAt(state.progress, part)), normal: toMeters(part.normal),
        });
      }
      const shadow = state.progress === 0 ? '.18' : '0';
      if (viewer.getAttribute('shadow-intensity') !== shadow) viewer.setAttribute('shadow-intensity', shadow);
    }
    updateButtons();
    scheduleMarkers();
  }

  /** @param {string} orbit @param {number[] | null} center @param {number} fov */
  function aim(orbit, center, fov = 38) {
    if (!viewer) return;
    viewer.setAttribute('camera-target', center ? toMeters(center) : 'auto auto auto');
    viewer.setAttribute('camera-orbit', orbit);
    viewer.setAttribute('field-of-view', `${fov}deg`);
    if (reducedMotion.matches || !inView) viewer.jumpCameraToGoal();
    scheduleMarkers();
  }

  /** @param {string} [preset] */
  function overviewCamera(preset = '') {
    const spread = state.progress > 0 || state.goal === 1;
    const chosen = views.find((button) => button.dataset.view === preset);
    state.cameraPreset = chosen?.dataset.view ?? (spread ? 'overview' : views[0].dataset.view);
    if (!viewer) { updateButtons(); return; }
    const measure = spread ? bounds.exploded : bounds.assembled;
    const wide = frameAssembly(measure.center, measure.size, viewport.clientWidth / viewport.clientHeight);
    const angles = chosen?.dataset.orbit.split(' ').slice(0, 2).join(' ') ??
      (spread ? overviewAngles.map((angle) => `${angle}deg`).join(' ') : '-22deg 76deg');
    aim(`${angles} ${canExplode ? wide.radius.toFixed(4) + 'm' : 'auto'}`, canExplode ? wide.center : null, wide.fov);
    updateButtons();
  }

  function focusCamera() {
    const selected = parts.get(state.selectedComponent);
    if (!viewer || !canExplode || !selected) return;
    const size = state.progress ? bounds.exploded.size : bounds.assembled.size;
    const frame = frameAssembly(bounds.assembled.center, size, viewport.clientWidth / viewport.clientHeight);
    const radius = frame.radius * (state.progress ? .56 : .78);
    state.cameraPreset = 'focus';
    const anchor = anchorAt(state.progress, selected);
    aim(`${selected.orbit[0]}deg ${selected.orbit[1]}deg ${radius.toFixed(4)}m`, anchor, frame.fov);
    updateButtons();
  }

  function stopMotion() {
    cancelAnimationFrame(motionFrame);
    motionFrame = 0;
    state.goal = null;
  }

  /** @param {number} goal */
  function completeMotion(goal) {
    stopMotion();
    applyProgress(goal);
    if (state.selectedComponent) focusCamera();
    else if (goal === 0) overviewCamera('front');
    const name = parts.get(state.selectedComponent)?.name;
    status.textContent = name ? `Inspeksi ${name}.` : goal === 0 ? 'Perangkat kembali utuh.' :
      'Susunan terurai. Pilih komponen pada model atau daftar.';
  }

  /** @param {number} goal @param {boolean} [instant] */
  function animateTo(goal, instant = false) {
    if (!canExplode || !viewer) return;
    stopMotion();
    const from = state.progress;
    state.goal = goal;
    if (goal === 0) {
      state.selectedComponent = null;
      syncSelection();
    }
    if (goal === 1 && (from === 0 || state.cameraPreset === 'focus')) overviewCamera();
    if (Math.abs(goal - from) < .001 || reducedMotion.matches || instant || !inView) {
      completeMotion(goal);
      return;
    }
    const started = performance.now();
    const duration = 900 * Math.abs(goal - from) + 140;
    const tick = (now) => {
      const fraction = (now - started) / duration;
      if (fraction >= 1) completeMotion(goal);
      else {
        applyProgress(interpolatedProgress(from, goal, fraction));
        motionFrame = requestAnimationFrame(tick);
      }
    };
    motionFrame = requestAnimationFrame(tick);
    updateButtons();
  }

  /** @param {string | null} id @param {boolean} [moveFocus] */
  function select(id, moveFocus = false) {
    state.selectedComponent = id;
    syncSelection();
    const part = parts.get(id);
    if (moveFocus && part) part.summary.focus({ preventScroll: true });
    if (!viewer || !canExplode) return;
    if (!part) {
      overviewCamera();
      status.textContent = 'Pilih komponen pada model atau daftar.';
    } else if (part.internal && (state.progress < 1 || state.goal === 0)) {
      animateTo(1);
    } else if (!motionFrame) {
      focusCamera();
      status.textContent = `Inspeksi ${part.name}.`;
    }
  }

  for (const [id, part] of parts) {
    part.summary.addEventListener('click', (event) => {
      event.preventDefault();
      select(state.selectedComponent === id ? null : id);
    });
    posterMarkers.querySelector(`[data-marker="${part.index}"]`)?.addEventListener('click', () => select(id, true));
  }

  for (const button of views) {
    button.addEventListener('click', () => {
      staticView = button;
      showPoster();
      overviewCamera(button.dataset.view);
    });
  }

  for (const button of cameraTools.querySelector('.zoom-controls').querySelectorAll('button')) {
    button.addEventListener('click', () => {
      if (!viewer) return;
      const orbit = viewer.getCameraOrbit();
      const next = orbit.radius * (button.dataset.zoom === 'in' ? .82 : 1.22);
      viewer.setAttribute('camera-orbit', `${orbit.theta}rad ${orbit.phi}rad ${next.toFixed(4)}m`);
      if (reducedMotion.matches) viewer.jumpCameraToGoal();
    });
  }
  cameraTools.querySelector('[data-reset]').addEventListener('click', () => overviewCamera());
  explode.addEventListener('click', () => animateTo(state.goal === 1 || (!motionFrame && state.progress > 0) ? 0 : 1));
  assembled.addEventListener('click', () => {
    if (document.activeElement === assembled) explode.focus({ preventScroll: true });
    animateTo(0, true);
  });
  overview.addEventListener('click', () => {
    if (document.activeElement === overview) explode.focus({ preventScroll: true });
    select(null);
  });
  range.addEventListener('input', () => {
    const value = Number(range.value) / 100;
    const opening = state.progress === 0 && value > 0;
    stopMotion();
    if (state.selectedComponent) {
      state.selectedComponent = null;
      syncSelection();
    }
    applyProgress(value);
    if (opening || value === 0 || state.cameraPreset === 'focus') overviewCamera();
  });

  function usePoster(message = '') {
    stopMotion();
    clearTimeout(markerTimer);
    markerTimer = 0;
    viewer?.remove();
    viewer = undefined;
    markerNodes.clear();
    materials = [];
    canExplode = false;
    state.progress = 0;
    state.cameraPreset = staticView.dataset.view;
    cameraTools.hidden = assemblyControls.hidden = true;
    poster.hidden = false;
    load.querySelector('span').textContent = 'Buka model 3D';
    status.textContent = message;
    showPoster();
    syncSelection();
  }

  /** @param {ModelViewer} element */
  function addModelMarkers(element) {
    markerNodes = new Map();
    for (const part of parts.values()) {
      if (!canExplode && part.internal) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'marker model-marker';
      const number = document.createElement('span');
      number.textContent = String(part.index + 1);
      number.setAttribute('aria-hidden', 'true');
      button.append(number);
      button.slot = `hotspot-${part.index}`;
      button.dataset.marker = String(part.index);
      button.dataset.component = part.id;
      button.dataset.position = toMeters(part.anchor);
      button.dataset.normal = toMeters(part.normal);
      button.setAttribute('aria-label', `${part.index + 1}. ${part.name}`);
      button.addEventListener('click', () => select(part.id, true));
      button.hidden = true;
      element.append(button);
      markerNodes.set(part.id, button);
    }
  }

  /** @param {ModelViewer} element @param {string} url */
  function waitForModel(element, url) {
    return new Promise((resolve, reject) => {
      const listeners = new AbortController();
      const finish = (error) => {
        listeners.abort();
        clearTimeout(timeout);
        if (error) reject(error);
        else resolve(true);
      };
      const timeout = window.setTimeout(() => finish(new Error('Model timeout')), 15000);
      element.addEventListener('load', () => finish(null), { signal: listeners.signal });
      element.addEventListener('error', () => finish(new Error('Model unavailable')), { signal: listeners.signal });
      element.setAttribute('src', url);
    });
  }

  load.addEventListener('click', async () => {
    if (loading) return;
    if (viewer) { usePoster(); return; }
    loading = true;
    load.disabled = true;
    status.textContent = 'Menyiapkan model 3D…';
    /** @type {ModelViewer | undefined} */
    let element;
    try {
      if (!explorer.dataset.model) throw new Error('Model unavailable');
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) throw new Error('WebGL unavailable');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      await warmRuntime();
      await customElements.whenDefined('model-viewer');
      element = /** @type {ModelViewer} */ (document.createElement('model-viewer'));
      for (const [key, value] of Object.entries({
        alt: explorer.dataset.modelLabel, 'camera-controls': '', 'disable-pan': '',
        'disable-tap': '', 'touch-action': 'pan-y', 'interaction-prompt': 'none',
        'environment-image': 'neutral', 'shadow-intensity': '.18', exposure: '1',
        'min-camera-orbit': 'auto 22deg 0.08m', 'max-camera-orbit': 'auto 151deg 1.35m',
        reveal: 'manual', loading: 'eager', 'camera-orbit': staticView.dataset.orbit,
        'animation-name': explorer.dataset.animation, 'animation-crossfade-duration': '0',
      })) element.setAttribute(key, value);
      viewport.append(element);
      await waitForModel(element, explorer.dataset.model);
      viewer = element;
      canExplode = element.availableAnimations.includes(explorer.dataset.animation);
      if (canExplode) {
        element.play({ repetitions: 1 });
        element.pause();
        canExplode = element.duration > 0;
      }
      materials = canExplode ? element.model.materials.map((material) => ({
        material, component: material.name.split('__')[0],
        base: Array.from(material.pbrMetallicRoughness.baseColorFactor),
        emissive: Array.from(material.emissiveFactor),
        strength: material.emissiveStrength,
      })) : [];
      addModelMarkers(element);
      cameraTools.hidden = false;
      assemblyControls.hidden = !canExplode;
      poster.hidden = true;
      posterMarkers.hidden = true;
      element.dismissPoster();
      element.addEventListener('camera-change', scheduleMarkers);
      element.addEventListener('error', () => usePoster('Model 3D terhenti. Tampilan gambar tetap tersedia.'), { once: true });
      let down;
      element.addEventListener('pointerdown', (event) => { down = [event.clientX, event.clientY]; });
      element.addEventListener('pointercancel', () => { down = undefined; });
      element.addEventListener('click', (event) => {
        if (!canExplode || !down || event.target instanceof HTMLButtonElement) return;
        const distance = Math.hypot(event.clientX - down[0], event.clientY - down[1]);
        down = undefined;
        if (distance > 6) return;
        const material = element.materialFromPoint(event.clientX, event.clientY);
        const id = material?.name.split('__')[0];
        if (parts.has(id)) select(id);
      });
      applyProgress(0);
      overviewCamera(staticView.dataset.view);
      if (canExplode && parts.get(state.selectedComponent)?.internal) animateTo(1);
      else if (canExplode && state.selectedComponent) focusCamera();
      syncSelection();
      load.querySelector('span').textContent = 'Kembali ke gambar';
      status.textContent = canExplode ? 'Seret untuk memutar. Pilih Bongkar Perangkat untuk melihat susunan.' :
        'Model ini mendukung rotasi dan zoom. Tampilan terurai menunggu aset dengan komponen animasi.';
    } catch {
      element?.remove();
      usePoster('Model 3D tidak tersedia di sesi ini. Pilih sudut pada tampilan gambar.');
    } finally {
      load.disabled = false;
      loading = false;
      if (document.activeElement === document.body) load.focus({ preventScroll: true });
    }
  });

  if ('IntersectionObserver' in window) {
    const preload = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || !explorer.dataset.model) return;
      preload.disconnect();
      warmRuntime().catch(() => {});
    }, { rootMargin: '180px' });
    preload.observe(viewport);
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) scheduleMarkers();
      else if (state.goal !== null) completeMotion(state.goal);
    }).observe(viewport);
  }
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    if (state.goal !== null) completeMotion(state.goal);
    viewer?.jumpCameraToGoal();
  });
  controls.hidden = false;
  usePoster();
}
