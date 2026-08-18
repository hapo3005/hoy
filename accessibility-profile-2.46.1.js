/* HOY Accessible 2.46.1 — final profile integration.
 * Replaces the legacy 2.43 profile disclosure after the premium continuous-profile transform.
 * Operator verification, badges and legacy fallback remain owned by accessibility-2.43.js.
 */
(() => {
  'use strict';
  if (window.__hoyAccessibleProfile2461) return;
  window.__hoyAccessibleProfile2461 = true;

  const api = window.HOYAccessible;
  if (!api) return;

  const FEATURES = [
    ['access.step_free', 'Stufenfreier Zugang'],
    ['access.wheelchair_seating', 'Geeigneter Sitzplatz'],
    ['access.toilet', 'Barrierefreies WC'],
    ['access.parking', 'Barrierefreier Parkplatz']
  ];
  const SHORT = new Map(FEATURES.map(([key, label]) => [key, label]));

  function safeDate(value) {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
    } catch (_) {
      return String(value).slice(0, 10);
    }
  }

  function verificationLabel(level) {
    return ({
      hoy_verified: 'HOY Verified',
      business_confirmed: 'Vom Betrieb bestätigt',
      community_confirmed: 'Community bestätigt',
      external_unverified: 'Unverifizierte externe Angabe'
    })[level] || 'Noch nicht verifiziert';
  }

  function statusMeta(fact) {
    if (!fact) return { symbol: '?', label: 'Noch nicht bestätigt', cls: 'unknown', confirmed: false };
    const status = String(fact.status || 'unknown').toLowerCase();
    const stale = api.factIsStale(fact);
    const confirmed = api.factIsConfirmed(fact);
    const base = ({
      yes: ['✓', 'Vorhanden', 'yes'],
      no: ['×', 'Nicht vorhanden', 'no'],
      partial: ['~', 'Teilweise', 'partial'],
      unknown: ['?', 'Noch nicht bestätigt', 'unknown'],
      not_applicable: ['–', 'Nicht relevant', 'na'],
      temporarily_unavailable: ['!', 'Derzeit nicht verfügbar', 'temporary']
    })[status] || ['?', 'Noch nicht bestätigt', 'unknown'];
    return { symbol: base[0], label: base[1], cls: base[2], stale, confirmed };
  }

  function factRow(key, label, fact) {
    const meta = statusMeta(fact);
    const checked = safeDate(fact?.checked_at);
    const trust = fact && !meta.confirmed && String(fact.status || 'unknown') !== 'unknown' ? ' · Bestätigung erforderlich' : '';
    return `<div class="hoya-fact hoya-fact--${meta.cls}${meta.stale ? ' is-stale' : ''}">
      <span class="hoya-fact__icon" aria-hidden="true">${meta.symbol}</span>
      <span class="hoya-fact__copy"><strong>${esc(label)}</strong><small>${meta.stale ? 'Angabe veraltet · ' : ''}${esc(meta.label)}${esc(trust)}${checked ? ` · geprüft ${esc(checked)}` : ''}</small></span>
    </div>`;
  }

  function matchSummary(result) {
    if (result.state === 'match') {
      const extra = result.preferMatched?.length ? ` · ${result.preferMatched.length} Wunsch${result.preferMatched.length === 1 ? '' : 'e'} zusätzlich erfüllt` : '';
      return `<div class="hoya-match hoya-match--yes"><strong>✓ Passt zu deinen Anforderungen</strong><span>Alle MUSS-Kriterien sind aktuell bestätigt${esc(extra)}.</span></div>`;
    }
    if (result.state === 'no_match') {
      const labels = (result.blockers || []).map(key => SHORT.get(key) || key).join(', ');
      return `<div class="hoya-match hoya-match--no"><strong>× Passt aktuell nicht</strong><span>Bestätigter Hinderungsgrund: ${esc(labels)}.</span></div>`;
    }
    if (result.state === 'confirmation_required') {
      const labels = (result.missing || []).map(key => SHORT.get(key) || key).join(', ');
      return `<div class="hoya-match hoya-match--unknown"><strong>? Bestätigung erforderlich</strong><span>Noch offen, veraltet oder nicht ausreichend verifiziert: ${esc(labels)}.</span></div>`;
    }
    return `<div class="hoya-match hoya-match--setup"><strong>Für dich prüfen</strong><span>Lege fest, was für deinen Besuch zwingend oder wünschenswert ist.</span></div>`;
  }

  function panelHTML(p) {
    const facts = api.factsForRestaurant(p.id);
    const byKey = new Map(facts.map(fact => [fact.feature_key, fact]));
    const evaluation = api.evaluateRestaurant(p.id);
    const known = facts.filter(fact => String(fact.status || 'unknown') !== 'unknown');
    const best = known.find(fact => fact.verification_level === 'hoy_verified')
      || known.find(fact => fact.verification_level === 'business_confirmed')
      || known.find(fact => fact.verification_level === 'community_confirmed')
      || known[0]
      || facts[0];
    const newest = facts
      .map(fact => fact.checked_at ? new Date(fact.checked_at) : null)
      .filter(date => date && !Number.isNaN(date.getTime()))
      .sort((a, b) => b - a)[0];

    return `<section class="hoya-panel" data-hoya-panel data-accessibility-panel aria-labelledby="hoya-title-${Number(p.id)}">
      <div class="hoya-head">
        <div>
          <div class="eyebrow">HOY ACCESSIBLE</div>
          <h3 id="hoya-title-${Number(p.id)}">Barrierefreiheit für dich</h3>
          <p>Konkrete Merkmale statt eines pauschalen ♿-Labels.</p>
        </div>
        <button type="button" class="hoya-settings" data-hoya-settings aria-label="Eigene Accessibility-Anforderungen festlegen">Anforderungen</button>
      </div>
      ${matchSummary(evaluation)}
      <div class="hoya-facts">${FEATURES.map(([key, label]) => factRow(key, label, byKey.get(key))).join('')}</div>
      <div class="hoya-trust">
        <strong>${esc(verificationLabel(best?.verification_level))}</strong>
        <span>${newest ? `Stand ${esc(safeDate(newest))}` : 'Noch keine belastbare Prüfung'}</span>
      </div>
      <p class="hoya-disclaimer">„Noch nicht bestätigt“ bedeutet nicht „nicht barrierefrei“. HOY zeigt nur belegte Eigenschaften und offene Punkte.</p>
    </section>`;
  }

  function wirePanel(root, p) {
    root?.querySelector('[data-hoya-settings]')?.addEventListener('click', () => {
      api.openPreferences(() => mount(document.getElementById('detail'), p));
    });
  }

  function mount(d, p) {
    if (!d || !p) return false;
    const html = panelHTML(p);
    const current = d.querySelector('[data-hoya-panel]');
    if (current) current.outerHTML = html;
    else {
      const legacy = d.querySelector('[data-accessibility-panel]');
      if (legacy) legacy.outerHTML = html;
      else {
        const about = d.querySelector('.profile-continuous-flow #profile-about');
        if (about) about.insertAdjacentHTML('afterend', html);
        else {
          const content = d.querySelector('[data-tab-content]');
          if (!content) return false;
          content.insertAdjacentHTML('beforeend', html);
        }
      }
    }
    wirePanel(d, p);
    return true;
  }

  const baseOpenDetail = typeof openDetail === 'function' ? openDetail : null;
  if (baseOpenDetail) {
    openDetail = function hoyAccessibleFinalProfile(id) {
      const result = baseOpenDetail(id);
      const p = (DATA || []).find(row => Number(row.id) === Number(id));
      if (p) mount(document.getElementById('detail'), p);
      return result;
    };
  }

  window.HOYAccessibleProfile = Object.freeze({ mount, panelHTML });
})();
