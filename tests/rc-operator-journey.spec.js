const { test, expect } = require('@playwright/test');
const { gotoReady } = require('./helpers/current-release');

test.use({ serviceWorkers: 'block' });

const PREPARED_WEEK = {
  mon: [['12:00', '23:00']],
  tue: [['12:00', '23:00']],
  wed: [],
  thu: [['12:00', '23:00']],
  fri: [['12:00', '24:00']],
  sat: [['12:00', '24:00']],
  sun: [['12:00', '18:00']]
};

function watchPageErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

test('RC operator journey stays connected from free claim to verified workspace and guest preview', async ({ page }) => {
  const errors = watchPageErrors(page);
  await gotoReady(page);

  const target = await page.evaluate(() => ({ id: Number(DATA[0].id), name: DATA[0].name }));

  // 1) Enter through the real restaurant profile CTA.
  await page.evaluate(id => openDetail(id), target.id);
  const detail = page.locator('#detail[open]');
  await expect(detail).toBeVisible();
  const claimEntry = detail.locator('.onboarding-claim-entry');
  await expect(claimEntry).toBeVisible();
  await expect(claimEntry).toContainText('Drei kurze Schritte, keine Vertragsbindung');
  await claimEntry.locator('[data-claim]').click();

  // 2) Walk the real three-step claim UI, but stop before the backend submission.
  const claim = page.locator('#claimFlow[open]');
  await expect(claim.locator('.onboarding-step-count')).toHaveText('1/3');
  await claim.locator('[data-c-name]').fill('María RC Test');
  await claim.locator('[data-c-email]').fill('maria.rc@example.com');
  await claim.locator('[data-c-authorized]').check();
  await claim.locator('[data-claim-next]').click();

  await expect(claim.locator('.onboarding-step-count')).toHaveText('2/3');
  await expect(claim.locator('[data-p-address]')).not.toHaveValue('');
  await expect(claim).toContainText('HOY hat vorgearbeitet');
  await claim.locator('[data-claim-next]').click();

  await expect(claim.locator('.onboarding-step-count')).toHaveText('3/3');
  await expect(claim.locator('[data-claim-next]')).toHaveText('Kostenlos zur Prüfung senden');
  await expect(claim).toContainText('Es wird kein Abo abgeschlossen');

  // 3) Reproduce the post-submit client state without invoking any backend write.
  await page.evaluate(() => {
    const p = DATA[0];
    document.getElementById('claimFlow')?.close();
    claimDraft = normalizeClaim({
      ...blankClaim(),
      restaurantId: p.id,
      claimed: true,
      verified: false,
      contact: { name: 'María RC Test', email: 'maria.rc@example.com', role: 'Inhaber/in' },
      verification: { status: 'pending', submittedAt: new Date().toISOString() }
    });
    saveClaim();
    const d = document.getElementById('claimFlow');
    d.showModal();
    renderClaimFlow();
  });

  await expect(claim).toContainText('HOY ist jetzt am Zug.');
  await expect(claim).toContainText('Verifizierung läuft');
  await expect(claim).toContainText('Bis dahin musst du nichts weiter einrichten');
  await expect(claim.locator('[data-c-name],[data-p-address],[data-claim-next]')).toHaveCount(0);
  await expect(claim.locator('[data-onboarding-partner]')).toHaveText('Zum Partnerbereich');
  await claim.locator('[data-onboarding-partner]').click();
  await expect.poll(() => page.evaluate(() => state.view)).toBe('partner');
  await expect(page.locator('.operator-command-center')).toHaveCount(0);
  await expect(page.locator('.onboarding-partner-steps')).toBeVisible();
  await expect(page.locator('.onboarding-partner-steps')).toContainText('Kein Abo, keine Zahlung');

  // 4) Move to a verified local client state. This is UI-only: no membership/DB verification is forged or written.
  await page.evaluate(schedule => {
    const p = DATA[0];
    document.getElementById('claimFlow')?.close();
    p.operator_verified = true;
    p.active_plan = 'free';
    p.hours_weekly = schedule;
    p.hours_source_label = 'HOY Research';
    p.hours_checked_at = new Date().toISOString();
    p.operator_hours = null;
    claimDraft = normalizeClaim({
      ...blankClaim(),
      restaurantId: p.id,
      claimed: true,
      verified: true,
      verification: { status: 'verified', verifiedAt: new Date().toISOString() }
    });
    saveClaim();
    sessionStorage.removeItem(`hoy-onboarding-welcome-${p.id}`);
    state.view = 'partner';
    render();
  }, PREPARED_WEEK);

  const partner = page.locator('#view');
  await expect(partner.locator('.onboarding-verified-welcome')).toBeVisible();
  await expect(partner.locator('.operator-command-center')).toBeVisible();
  await expect(partner.locator('.operator-confirmation-290')).toBeVisible();
  await expect(partner.locator('.operator-confirmation-290')).toContainText('Stimmen diese Öffnungszeiten?');
  await partner.locator('.onboarding-verified-welcome [data-onboarding-welcome-dismiss]').click();

  // 5) Hours correction must be reachable from the real partner surface and remain the free structured confirmation flow.
  await partner.locator('[data-hours-correct]').click();
  const hours = page.locator('#operatorHoursConfirmFlow[open]');
  await expect(hours).toBeVisible();
  await expect(hours).toContainText('FREE · DATENBESTÄTIGUNG');
  await expect(hours.locator('[data-confirm-day]')).toHaveCount(7);
  await expect(hours.locator('[data-special-date],[data-live-notice]')).toHaveCount(0);
  await hours.locator('[data-confirm-close]').first().click();

  // 6) Services must open through the real cockpit and expose only the three fail-closed states.
  const servicesModule = partner.locator('.hub-module').filter({ hasText: 'Services' });
  await servicesModule.locator('[data-hub-action="services"]').click();
  const services = page.locator('#operatorServicesFlow[open]');
  await expect(services).toBeVisible();
  await expect(services.locator('.hub-service-row')).toHaveCount(3);
  const serviceContract = await services.locator('.hub-service-row').evaluateAll(rows => rows.map(row => ({
    values: [...row.querySelectorAll('select option')].map(option => option.value),
    selected: row.querySelector('select')?.value || '',
    pressed: [...row.querySelectorAll('.op-choice[aria-pressed="true"]')].length
  })));
  for (const row of serviceContract) {
    expect(row.values).toEqual(['available', 'unavailable', 'unknown']);
    expect(['available', 'unavailable', 'unknown']).toContain(row.selected);
    expect(row.pressed).toBe(1);
  }
  await services.locator('[data-op-close]').first().click();

  // 7) The verified operator must always be able to return to a real guest preview without publishing or paying.
  await partner.locator('.hub-bottom-actions [data-hub-action="preview"]').click();
  const preview = page.locator('#claimFlow[open]');
  await expect(preview).toContainText('GASTANSICHT · FREE');
  await expect(preview.locator('h2')).toContainText(target.name);
  await expect(preview).toContainText('Es wird nichts veröffentlicht und keine Zahlung ausgelöst');
  await expect(preview.locator('[data-owner-preview-live]')).toBeVisible();

  const metrics = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth
  }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.client + 1);
  expect(errors).toEqual([]);
});
