/* HOY Accessible v1
 * Cross-HOY accessibility layer for Gastro profiles.
 * Critical rule: unknown/stale/unverified is never converted to a confirmed yes/no.
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
    'access.hearing_loop': { label: 'Induktive Höranlage', short: 'Höranlage' },
    'access.entrance_door_width_cm': { label: 'Lichte Türbreite', short: 'Türbreite' },
    'access.entrance_threshold_cm': { label: 'Schwellenhöhe', short: 'Schwelle' },
    'access.entrance_steps_count': { label: 'Stufenanzahl', short: 'Stufen' }
  });
  const ALLOWED_IMPORTANCE = new Set(['must', 'prefer', 'ignore']);
  const ALLOWED_COMPARATORS = new Set(['equals', 'gte', 'lte']);
  const CONFIRMED_LEVELS = new Set(['hoy_verified', 'business_confirmed', 'community_confirmed']);
  const MATCH_ORDER = Object.freeze({ match: 3, confirmation_required: 2, unconfigured: 1, no_match: 0 });
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

  function factIsConfirmed(fact, now = new Date()) {
    if (!fact || factIsStale(fact, now)) return false;
    if ((fact.review_state || 'clean') !== 'clean') return false;
    return CONFIRMED_LEVELS.has(fact.verification_level);
  }

  function verificationLabel(level) {
    return ({
      hoy_verified: 'HOY Verified',
      business_confirmed: 'Vom Betrieb bestätigt',
      community_confirmed: 'Community bestätigt',
      external_unverified: 'Unverifizierte externe Angabe'
    })[level] || 'Noch nicht verifiziert';
  }

  function statusCopy(status) {
    return ({
      yes: ['✓', 'Vorhanden', 'yes'],
      no: ['×', 'Nicht vorhanden', 'no'],
      partial: ['~', 'Teilweise', 'partial'],
      unknown: ['?', 'Noch nicht bestätigt', 'unknown'],
      not_applicable: ['–', 'Nicht relevant', 'na'],
      temporarily_unavailable: ['!', 'Derzeit nicht verfügbar', 'temporary']
    })[normalizeStatus(status)] || ['?', 'Noch nicht bestätigt', 'unknown'];
  }

  function normalizeRequirement(value) {
    if (typeof value === 'string') {
      return { importance: ALLOWED_IMPORTANCE.has(value) ? value : 'ignore' };
    }
    const importance = ALLOWED_IMPORTANCE.has(value?.importance) ? value.importance : 'ignore';
    const comparator = ALLOWED_COMPARATORS.has(value?.comparator) ? value.comparator : null;
    return {
      importance,
      comparator,
      targetValue: value?.targetValue ?? null
    };
  }

  function getPreferences() {
    try {
      const raw = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
      const clean = {};
      for (const key of CORE_KEYS) {
        const requirement = normalizeRequirement(raw?.[key]);
        clean[key] = requirement.importance;
      }
      return clean;
    } catch (_) {
      return Object.fromEntries(CORE_KEYS.map(key => [key, 'ignore']));
    }
  }

  function setPreferences(next) {
    const clean = {};
    for (const key of CORE_KEYS) {
      clean[key] = normalizeRequirement(next?.[key]).importance;
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

  function compareValue(actual, comparator, target) {
    if (comparator === 'gte') return actual >= target;
    if (comparator === 'lte') return actual <= target;
    return actual === target;
  }

  function evaluateRequirement(fact, rawRequirement, now = new Date()) {
    const requirement = normalizeRequirement(rawRequirement);
    if (requirement.importance === 'ignore') return 'ignored';
    if (!fact || !factIsConfirmed(fact, now)) return 'unresolved';

    const status = normalizeStatus(fact.status);
    if (status === 'unknown' || status === 'partial') return 'unresolved';
    if (status === 'no' || status === 'not_applicable' || status === 'temporarily_unavailable') return 'blocked';

    if (requirement.comparator) {
      if (fact.value_number === null || fact.value_number === undefined || requirement.targetValue === null || requirement.targetValue === undefined) {
        return 'unresolved';
      }
      const actual = Number(fact.value_number);
      const target = Number(requirement.targetValue);
      if (!Number.isFinite(actual) || !Number.isFinite(target)) return 'unresolved';
      return compareValue(actual, requirement.comparator, target) ? 'matched' : 'blocked';
    }

    if (requirement.targetValue !== null && requirement.targetValue !== undefined) {
      const actual = fact.value_text ?? fact.status;
      return compareValue(actual, 'equals', requirement.targetValue) ? 'matched' : 'blocked';
    }

    return status === 'yes' ? 'matched' : 'unresolved';
  }

  function evaluateFacts(facts, prefs = getPreferences(), now = new Date()) {
    const entries = Object.entries(prefs || {}).map(([key, value]) => [key, normalizeRequirement(value)]);
    const required = entries.filter(([, requirement]) => requirement.importance === 'must');
    const preferred = entries.filter(([, requirement]) => requirement.importance === 'prefer');
    if (!required.length && !preferred.length) {
      return {
        state: 'unconfigured', missing: [], blockers: [], matched: [],
        preferMatched: [], preferMissing: [], preferBlocked: []
      };
    }

    const byKey = factsByKey(facts);
    const missing = [];
    const blockers = [];
    const matched = [];
    const preferMatched = [];
    const preferMissing = [];
    const preferBlocked = [];

    for (const [key, requirement] of required) {
      const outcome = evaluateRequirement(byKey.get(key), requirement, now);
      if (outcome === 'matched') matched.push(key);
      else if (outcome === 'blocked') blockers.push(key);
      else missing.push(key);
    }

    for (const [key, requirement] of preferred) {
      const outcome = evaluateRequirement(byKey.get(key), requirement, now);
      if (outcome === 'matched') preferMatched.push(key);
      else if (outcome === 'blocked') preferBlocked.push(key);
      else preferMissing.push(key);
    }

    const matchState = blockers.length
      ? 'no_match'
      : missing.length
        ? 'confirmation_required'
        : required.length
          ? 'match'
          : 'unconfigured';

    return {
      state: matchState,
      missing,
      blockers,
      matched,
      preferMatched,
      preferMissing,
      preferBlocked
    };
  }

  function compareEvaluations(a, b) {
    const matchDelta = (MATCH_ORDER[b?.state] ?? -1) - (MATCH_ORDER[a?.state] ?? -1);
    if (matchDelta) return matchDelta;
    const preferDelta = (b?.preferMatched?.length || 0) - (a?.preferMatched?.length || 0);
    if (preferDelta) return preferDelta;
    const preferBlockDelta = (a?.preferBlocked?.length || 0) - (b?.preferBlocked?.length || 0);
    if (preferBlockDelta) return preferBlockDelta;
    return (a?.preferMissing?.length || 0) - (b?.preferMissing?.length || 0);
  }

  function evaluateRestaurant(restaurantId, prefs = getPreferences(), now = new Date()) {
    return evaluateFacts(factsForRestaurant(restaurantId), prefs, now);
  }

  function rankRestaurants(restaurants, prefs = getPreferences(), now = new Date()) {
    return (restaurants || [])
      .map((restaurant, index) => ({ restaurant, index, evaluation: evaluateRestaurant(restaurant.id, prefs, now) }))
      .sort((a, b) => compareEvaluations(a.evaluation, b.evaluation) || a.index - b.index)
      .map(item => item.restaurant);
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
    const preferCopy = result.preferMatched?.length
      ? ` · ${result.preferMatched.length} Wunsch${result.preferMatched.length === 1 ? '' : 'e'} zusätzlich erfüllt`
      : '';
    if (result.state === 'match') {
      return `<div class="hoya-match hoya-match--yes"><strong>✓ Passt zu deinen Anforderungen</strong><span>Alle MUSS-Kriterien sind aktuell bestätigt${esc(preferCopy)}.</span></div>`;
    }
    if (result.state === 'no_match') {
      const labels = result.blockers.map(k => FEATURE_META[k]?.short || k).join(', ');
      return `<div class="hoya-match hoya-match--no"><strong>× Passt aktuell nicht</strong><span>Bestätigter Hinderungsgrund: ${esc(labels)}.</span></div>`;
    }
    if (result.state === 'confirmation_required') {
      const labels = result.missing.map(k => FEATURE_META[k]?.short || k).join(', ');
      return `<div class="hoya-match hoya-match--unknown"><strong>? Bestätigung erforderlich</strong><span>Noch offen, veraltet oder nicht ausreichend verifiziert: ${esc(labels)}.</span></div>`;
    }
    return `<div class="hoya-match hoya-match--setup"><strong>Für dich prüfen</strong><span>Lege fest, was für deinen Besuch zwingend oder wünschenswert ist.</span></div>`;
  }

  function factRow(key, fact) {
    const meta = FEATURE_META[key] || { label: key };
    const stale = fact ? factIsStale(fact) : false;
    const confirmed = fact ? factIsConfirmed(fact) : false;
    const effectiveStatus = fact?.status || 'unknown';
    const [symbol, label, cls] = statusCopy(effectiveStatus);
    const date = fact?.checked_at ? formatDate(fact.checked_at) : '';
    const trustNote = fact && !confirmed && normalizeStatus(effectiveStatus) !== 'unknown' ? ' · Bestätigung erforderlich' : '';
    return `<div class="hoya-fact hoya-fact--${cls}${stale ? ' is-stale' : ''}">
      <span class="hoya-fact__icon" aria-hidden="true">${symbol}</span>
      <span class="hoya-fact__copy"><strong>${esc(meta.label)}</strong><small>${stale ? 'Angabe veraltet · ' : ''}${esc(label)}${esc(trustNote)}${date ? ` · geprüft ${esc(date)}` : ''}</small></span>
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

  function stripLegacyGuestAccessibility(html) {
    return String(html || '').replace(/<div class="access-card-line">[\s\S]*?<\/div>/g, '');
  }

  function removeLegacyGuestPanel(container) {
    container?.querySelectorAll?.('[data-accessibility-panel]').forEach(node => node.remove());
  }

  function injectAccessiblePanel(d, p) {
    if (!d || !p) return false;
    removeLegacyGuestPanel(d);
    if (d.querySelector('[data-hoya-panel]')) return true;

    const flow = d.querySelector('.profile-continuous-flow');
    const about = flow?.querySelector('#profile-about');
    if (about) {
      about.insertAdjacentHTML('afterend', accessibilityPanel(p));
      wirePanel(d, p);
      return true;
    }

    const content = d.querySelector('[data-tab-content]');
    if (content) {
      content.insertAdjacentHTML('beforeend', accessibilityPanel(p));
      wirePanel(d, p);
      return true;
    }
    return false;
  }

  // 2.43 remains the operator confirmation workflow, but 2.46 is the canonical guest surface.
  // Strip the older generic card badge so unverified research cannot be mistaken for a confirmed match.
  if (typeof card === 'function') {
    const legacyCard = card;
    card = function hoyAccessibleCard(p) {
      return stripLegacyGuestAccessibility(legacyCard(p));
    };
  }
  if (typeof listCard === 'function') {
    const legacyListCard = listCard;
    listCard = function hoyAccessibleListCard(p) {
      return stripLegacyGuestAccessibility(legacyListCard(p));
    };
  }

  const originalSetDetailTab = typeof setDetailTab === 'function' ? setDetailTab : null;
  if (originalSetDetailTab) {
    setDetailTab = function hoyAccessibleDetailTab(d, p, tab) {
      originalSetDetailTab(d, p, tab);
      if (tab === 'overview') injectAccessiblePanel(d, p);
    };
  }

  // 2.43 wraps openDetail after the legacy tab call so its panel survives the continuous-profile
  // transformation. Wrap that final function once more: keep its operator mechanics, remove the
  // legacy guest panel, and inject the Trust-aware 2.46 panel into the final profile DOM.
  const originalOpenDetail = typeof openDetail === 'function' ? openDetail : null;
  if (originalOpenDetail) {
    openDetail = function hoyAccessibleOpenDetail(id) {
      const result = originalOpenDetail(id);
      const p = typeof DATA !== 'undefined' ? DATA.find(x => Number(x.id) === Number(id)) : null;
      if (p) injectAccessiblePanel(document.getElementById('detail'), p);
      return result;
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
    evaluateRequirement,
    evaluateFacts,
    evaluateRestaurant,
    compareEvaluations,
    rankRestaurants,
    factIsStale,
    factIsConfirmed,
    openPreferences
  });
})();