/* HOY Accessible v1
 * Cross-HOY accessibility layer for Gastro profiles.
 * Critical rule: unknown/stale is never converted to "no".
 */
(() => {
  'use strict';

  const PREF_KEY = 'hoy-accessibility-preferences-v1';
  const CORE_KEYS = [
    'access.step_free',
    'access.wheelchair_seating',
    'access.toilet',
    'access.parking'
  ];
  const FEATURE_META = Object.freeze({
    'access.step_free': { label: 'Stufenfreier Zugang', short: 'Stufenlos' },
    'access.wheelchair_seating': { label: 'Geeigneter Sitzplatz', short: 'Sitzplatz' },
    'access.toilet': { label: 'Barrierefreies WC', short: 'WC' },
    'access.parking': { label: 'Barrierefreier Parkplatz', short: 'Parkplatz' },
    'access.hearing_loop': { label: 'Induktive Höranlage', short: 'Höranlage' }
  });
  const ALLOWED_IMPORTANCE = new Set(['must', 'prefer', 'ignore']);
  const state = {
    ready: false,
    source: 'none',
    byRestaurant: new Map(),
    lastError: ''
  };

  function safeDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function addDays(value, days) {
    const d = safeDate(value);
    if (!d) return null;
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString();
  }

  function normalizeStatus(value) {
    const status = String(value || 'unknown').toLowerCase();
    return ['yes', 'no', 'partial', 'unknown', 'not_applicable', 'temporarily_unavailable'].includes(status)
      ? status
      : 'unknown';
  }

  function factIsStale(fact, now = new Date()) {
    const staleAt = safeDate(fact?.stale_after);
    return !!(staleAt && staleAt.getTime() < now.getTime());
  }

  function verificationLabel(level) {
    return ({
      hoy_verified: 'HOY Verified',
      business_confirmed: 'Vom Betrieb bestätigt',
      community_confirmed: 'Community bestätigt',
      external_unverified: 'Öffentliche Quellenprüfung'
    })[level] || 'Noch nicht verifiziert';
  }

  function statusCopy(status) {
    return ({
      yes: ['✓', 'Bestätigt', 'yes'],
      no: ['×', 'Nicht vorhanden', 'no'],
      partial: ['~', 'Teilweise', 'partial'],
      unknown: ['?', 'Noch nicht bestätigt', 'unknown'],
      not_applicable: ['–', 'Nicht relevant', 'na'],
      temporarily_unavailable: ['!', 'Derzeit nicht verfügbar', 'temporary']
    })[normalizeStatus(status)] || ['?', 'Noch nicht bestätigt', 'unknown'];
  }

  function getPreferences() {
    try {
      const raw = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
      const clean = {};
      for (const key of CORE_KEYS) {
        const importance = ALLOWED_IMPORTANCE.has(raw?.[key]) ? raw[key] : 'ignore';
        clean[key] = importance;
      }
      return clean;
    } catch (_) {
      return Object.fromEntries(CORE_KEYS.map(key => [key, 'ignore']));
    }
  }

  function setPreferences(next) {
    const clean = {};
    for (const key of CORE_KEYS) {
      clean[key] = ALLOWED_IMPORTANCE.has(next?.[key]) ? next[key] : 'ignore';
    }
    localStorage.setItem(PREF_KEY, JSON.stringify(clean));
    return clean;
  }

  function factsForRestaurant(restaurantId) {
    return state.byRestaurant.get(Number(restaurantId)) || [];
  }

  function factsByKey(facts) {
    return new Map((facts || []).map(f => [f.feature_key, f]));
  }

  function evaluateFacts(facts, prefs = getPreferences(), now = new Date()) {
    const required = CORE_KEYS.filter(key => prefs?.[key] === 'must');
    if (!required.length) return { state: 'unconfigured', missing: [], blockers: [], matched: [] };

    const byKey = factsByKey(facts);
    const missing = [];
    const blockers = [];
    const matched = [];

    for (const key of required) {
      const fact = byKey.get(key);
      if (!fact || factIsStale(fact, now)) {
        missing.push(key);
        continue;
      }

      const status = normalizeStatus(fact.status);
      if (status === 'yes') matched.push(key);
      else if (status === 'no' || status === 'not_applicable' || status === 'temporarily_unavailable') blockers.push(key);
      else missing.push(key); // unknown and partial require confirmation; never infer a negative.
    }

    if (blockers.length) return { state: 'no_match', missing, blockers, matched };
    if (missing.length) return { state: 'confirmation_required', missing, blockers, matched };
    return { state: 'match', missing, blockers, matched };
  }

  function evaluateRestaurant(restaurantId) {
    return evaluateFacts(factsForRestaurant(restaurantId));
  }

  function normalizedFact(row) {
    return {
      restaurant_id: Number(row.restaurant_id),
      feature_key: row.feature_key,
      status: normalizeStatus(row.status),
      value_number: row.value_number ?? null,
      value_text: row.value_text ?? null,
      unit: row.unit || null,
      source_type: row.source_type || 'unknown',
      verification_level: row.verification_level || 'external_unverified',
      source_url: row.source_url || null,
      checked_at: row.checked_at || null,
      stale_after: row.stale_after || null,
      review_state: row.review_state || 'clean',
      legacy_class: row.legacy_class || null
    };
  }

  function legacyFacts(row) {
    const checked = row.checked_at || null;
    const verification = row.verification_source === 'operator'
      ? 'business_confirmed'
      : row.verification_source === 'onsite'
        ? 'hoy_verified'
        : 'external_unverified';
    const common = {
      restaurant_id: Number(row.restaurant_id),
      source_type: row.evidence_type || 'legacy_public_research',
      verification_level: verification,
      source_url: row.source_url || null,
      checked_at: checked,
      stale_after: addDays(checked, verification === 'hoy_verified' ? 365 : 180),
      review_state: 'clean',
      legacy_class: row.overall_status || null
    };
    return [
      { ...common, feature_key: 'access.step_free', status: normalizeStatus(row.wheelchair_entrance_state) },
      { ...common, feature_key: 'access.wheelchair_seating', status: normalizeStatus(row.wheelchair_seating_state) },
      { ...common, feature_key: 'access.toilet', status: normalizeStatus(row.wheelchair_toilet_state) },
      { ...common, feature_key: 'access.parking', status: normalizeStatus(row.accessible_parking_state) }
    ];
  }

  function indexFacts(rows) {
    const grouped = new Map();
    for (const raw of rows || []) {
      const fact = normalizedFact(raw);
      if (!Number.isFinite(fact.restaurant_id) || !fact.feature_key) continue;
      if (!grouped.has(fact.restaurant_id)) grouped.set(fact.restaurant_id, []);
      grouped.get(fact.restaurant_id).push(fact);
    }
    state.byRestaurant = grouped;
  }

  async function loadAccessibilityFacts() {
    if (!sb) {
      state.ready = true;
      state.source = 'offline';
      return;
    }

    const normalized = await sb
      .from('restaurant_accessibility_facts')
      .select('restaurant_id,feature_key,status,value_number,value_text,unit,source_type,verification_level,source_url,checked_at,stale_after,review_state,legacy_class')
      .eq('is_current', true);

    if (!normalized.error) {
      indexFacts(normalized.data || []);
      state.source = 'normalized';
      state.ready = true;
      return;
    }

    const legacy = await sb
      .from('restaurant_accessibility')
      .select('restaurant_id,wheelchair_entrance_state,wheelchair_seating_state,wheelchair_toilet_state,accessible_parking_state,overall_status,verification_source,source_url,evidence_type,checked_at');

    if (legacy.error) {
      state.lastError = legacy.error.message || normalized.error.message || 'Accessibility data unavailable';
      state.source = 'unavailable';
      state.ready = true;
      return;
    }

    const facts = (legacy.data || []).flatMap(legacyFacts);
    indexFacts(facts);
    state.source = 'legacy';
    state.ready = true;
  }

  function formatDate(value) {
    const d = safeDate(value);
    if (!d) return '';
    try {
      return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    } catch (_) {
      return String(value).slice(0, 10);
    }
  }

  function matchSummary(result) {
    if (result.state === 'match') {
      return `<div class="hoya-match hoya-match--yes"><strong>✓ Passt zu deinen Anforderungen</strong><span>Alle MUSS-Kriterien sind aktuell bestätigt.</span></div>`;
    }
    if (result.state === 'no_match') {
      const labels = result.blockers.map(k => FEATURE_META[k]?.short || k).join(', ');
      return `<div class="hoya-match hoya-match--no"><strong>× Passt aktuell nicht</strong><span>Bestätigter Hinderungsgrund: ${esc(labels)}.</span></div>`;
    }
    if (result.state === 'confirmation_required') {
      const labels = result.missing.map(k => FEATURE_META[k]?.short || k).join(', ');
      return `<div class="hoya-match hoya-match--unknown"><strong>? Bestätigung erforderlich</strong><span>Noch offen oder veraltet: ${esc(labels)}.</span></div>`;
    }
    return `<div class="hoya-match hoya-match--setup"><strong>Für dich prüfen</strong><span>Lege fest, was für deinen Besuch zwingend oder wünschenswert ist.</span></div>`;
  }

  function factRow(key, fact) {
    const meta = FEATURE_META[key] || { label: key };
    const stale = fact ? factIsStale(fact) : false;
    const effectiveStatus = fact?.status || 'unknown';
    const [symbol, label, cls] = statusCopy(effectiveStatus);
    const date = fact?.checked_at ? formatDate(fact.checked_at) : '';
    return `<div class="hoya-fact hoya-fact--${cls}${stale ? ' is-stale' : ''}">
      <span class="hoya-fact__icon" aria-hidden="true">${symbol}</span>
      <span class="hoya-fact__copy"><strong>${esc(meta.label)}</strong><small>${stale ? 'Angabe veraltet · ' : ''}${esc(label)}${date ? ` · geprüft ${esc(date)}` : ''}</small></span>
    </div>`;
  }

  function accessibilityPanel(p) {
    const facts = factsForRestaurant(p.id);
    const byKey = factsByKey(facts);
    const result = evaluateFacts(facts);
    const known = facts.filter(f => normalizeStatus(f.status) !== 'unknown');
    const newest = facts.map(f => safeDate(f.checked_at)).filter(Boolean).sort((a, b) => b - a)[0];
    const bestVerification = known.find(f => f.verification_level === 'hoy_verified')
      || known.find(f => f.verification_level === 'business_confirmed')
      || known.find(f => f.verification_level === 'community_confirmed')
      || known[0]
      || facts[0];

    return `<section class="hoya-panel" data-hoya-panel aria-labelledby="hoya-title-${Number(p.id)}">
      <div class="hoya-head">
        <div>
          <div class="eyebrow">HOY ACCESSIBLE</div>
          <h3 id="hoya-title-${Number(p.id)}">Barrierefreiheit für dich</h3>
          <p>Konkrete Merkmale statt eines pauschalen ♿-Labels.</p>
        </div>
        <button type="button" class="hoya-settings" data-hoya-settings aria-label="Eigene Accessibility-Anforderungen festlegen">Anforderungen</button>
      </div>
      ${matchSummary(result)}
      <div class="hoya-facts">${CORE_KEYS.map(key => factRow(key, byKey.get(key))).join('')}</div>
      <div class="hoya-trust">
        <strong>${esc(verificationLabel(bestVerification?.verification_level))}</strong>
        <span>${newest ? `Stand ${esc(formatDate(newest))}` : 'Noch keine belastbare Prüfung'}</span>
      </div>
      <p class="hoya-disclaimer">„Noch nicht bestätigt“ bedeutet nicht „nicht barrierefrei“. HOY zeigt nur belegte Eigenschaften und offene Punkte.</p>
    </section>`;
  }

  function ensurePreferencesDialog() {
    let d = document.getElementById('accessibilityPreferences');
    if (d) return d;
    d = document.createElement('dialog');
    d.id = 'accessibilityPreferences';
    d.className = 'hoya-dialog';
    d.setAttribute('aria-labelledby', 'hoya-prefs-title');
    document.body.appendChild(d);
    return d;
  }

  function openPreferences(onSaved) {
    const d = ensurePreferencesDialog();
    const prefs = getPreferences();
    const option = (value, label, current) => `<option value="${value}" ${current === value ? 'selected' : ''}>${label}</option>`;
    d.innerHTML = `<form method="dialog" class="hoya-dialog__body">
      <div class="hoya-dialog__head">
        <div><div class="eyebrow">HOY ACCESSIBLE</div><h2 id="hoya-prefs-title">Was brauchst du?</h2></div>
        <button value="cancel" class="round" aria-label="Schließen">×</button>
      </div>
      <p>HOY muss nicht wissen, warum du etwas brauchst. Lege nur fest, was für deinen Besuch wichtig ist.</p>
      <div class="hoya-pref-list">
        ${CORE_KEYS.map(key => `<label class="hoya-pref"><span>${esc(FEATURE_META[key].label)}</span><select data-hoya-pref="${esc(key)}">${option('must', 'MUSS', prefs[key])}${option('prefer', 'WÄRE GUT', prefs[key])}${option('ignore', 'NICHT WICHTIG', prefs[key])}</select></label>`).join('')}
      </div>
      <div class="hoya-dialog__actions"><button value="cancel" class="light">Abbrechen</button><button type="button" class="dark" data-hoya-save>Speichern</button></div>
    </form>`;
    d.querySelector('[data-hoya-save]').addEventListener('click', () => {
      const next = {};
      d.querySelectorAll('[data-hoya-pref]').forEach(select => { next[select.dataset.hoyaPref] = select.value; });
      setPreferences(next);
      d.close();
      if (typeof onSaved === 'function') onSaved();
    });
    d.showModal();
    setTimeout(() => d.querySelector('select')?.focus(), 0);
  }

  function wirePanel(container, p) {
    container.querySelector('[data-hoya-settings]')?.addEventListener('click', () => {
      openPreferences(() => {
        if (typeof setDetailTab === 'function') setDetailTab(document.getElementById('detail'), p, 'overview');
      });
    });
  }

  const originalSetDetailTab = typeof setDetailTab === 'function' ? setDetailTab : null;
  if (originalSetDetailTab) {
    setDetailTab = function hoyAccessibleDetailTab(d, p, tab) {
      originalSetDetailTab(d, p, tab);
      if (tab !== 'overview') return;
      const content = d?.querySelector?.('[data-tab-content]');
      if (!content || content.querySelector('[data-hoya-panel]')) return;
      content.insertAdjacentHTML('beforeend', accessibilityPanel(p));
      wirePanel(content, p);
    };
  }

  const originalInitCloud = typeof initCloud === 'function' ? initCloud : null;
  if (originalInitCloud) {
    initCloud = async function hoyAccessibleInitCloud() {
      await originalInitCloud();
      try {
        await loadAccessibilityFacts();
      } catch (error) {
        state.lastError = error?.message || String(error);
        state.ready = true;
        state.source = 'unavailable';
      }
      if (typeof render === 'function') render();
    };
  }

  function ensureStylesheet() {
    if (document.querySelector('link[data-hoya-accessible-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './accessibility-2.46.css?v=2.46.0';
    link.dataset.hoyaAccessibleCss = 'true';
    document.head.appendChild(link);
  }

  async function bootAfterExistingCloud(attempt = 0) {
    ensureStylesheet();
    if (state.ready) return;
    if (typeof sb !== 'undefined' && sb && typeof cloud !== 'undefined' && cloud.status !== 'connecting') {
      await loadAccessibilityFacts();
      if (typeof render === 'function') render();
      return;
    }
    if (attempt < 60) setTimeout(() => { void bootAfterExistingCloud(attempt + 1); }, 100);
    else {
      state.ready = true;
      state.source = 'unavailable';
      state.lastError = 'Cloud initialization timeout';
    }
  }

  setTimeout(() => { void bootAfterExistingCloud(); }, 0);

  window.HOYAccessible = Object.freeze({
    state,
    load: loadAccessibilityFacts,
    getPreferences,
    setPreferences,
    factsForRestaurant,
    evaluateFacts,
    evaluateRestaurant,
    factIsStale,
    openPreferences
  });
})();
