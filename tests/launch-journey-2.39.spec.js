const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

function watchPageErrors(page){
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  return errors;
}

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&cloud.status==='online'&&window.hoyMenuLanguageIntegrityState==='ready',{timeout:30000});
}

test('launch journey has no dead end from HOY LIVE through discover, profile, menu and map',async({page})=>{
  const errors=watchPageErrors(page);
  await ready(page);

  // Home / HOY LIVE must render a real decision surface even when no event is active.
  await expect(page.locator('#bottom [data-btm="home"]')).toBeVisible();
  await expect(page.locator('[data-live239-root]')).toBeVisible();
  await expect(page.locator('[data-live239-root]')).toContainText(/HOY LIVE/i);

  // Home -> Discover.
  await page.locator('#bottom [data-btm="discover"]').click();
  await expect.poll(()=>page.evaluate(()=>state.view)).toBe('discover');
  const search=page.locator('#q');
  await expect(search).toBeVisible();
  await expect(page.locator('.list-card[data-open]').first()).toBeVisible({timeout:20000});

  // Discover -> a launch-quality profile with a localized menu.
  await search.fill('Agua Salá');
  const card=page.locator('.list-card[data-open="16"]');
  await expect(card).toBeVisible();
  await card.click();

  const dialog=page.locator('#detail[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/continuous-profile/);
  await expect(dialog.locator('.detail-primary-bar')).toBeVisible();
  const route=dialog.locator('.detail-primary-bar a.external-route');
  await expect(route).toBeVisible();
  await expect(route).toHaveAttribute('href',/google\.com\/maps/i);

  // Profile -> Menu. The user must get useful content, not an empty tab/dead end.
  const menuLink=dialog.locator('.profile-premium-nav a[href="#profile-menu"]');
  await expect(menuLink).toBeVisible();
  await menuLink.click();
  const menu=dialog.locator('#profile-menu');
  await expect(menu).toBeVisible();
  await expect(menu.locator('[data-menu-item]').first()).toBeVisible();
  await expect(menu).toContainText(/Position|Speisekarte|Auswahl/i);

  // Profile -> HOY map.
  const mapButton=dialog.locator('[data-profile-map]');
  await expect(mapButton).toBeVisible();
  await mapButton.click();
  await expect(page.locator('#detail[open]')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>state.view)).toBe('map');
  const mapCard=page.locator('.map-decision-card[data-map-card="16"]');
  await expect(mapCard).toBeVisible();
  await expect(mapCard).toHaveClass(/active/,{timeout:5000});

  // Map -> Profile -> back to list. Every exit remains actionable.
  await mapCard.locator('[data-map-profile="16"]').click();
  await expect(page.locator('#detail[open]')).toBeVisible();
  await expect(page.locator('#detail[open] .detail-primary-bar')).toBeVisible();
  await page.locator('#detail[open] [data-close]').click();
  await expect(page.locator('#detail[open]')).toHaveCount(0);

  const listButton=page.locator('[data-map-list]').first();
  await expect(listButton).toBeVisible();
  await listButton.click();
  await expect.poll(()=>page.evaluate(()=>state.view)).toBe('discover');
  await expect(page.locator('.list-card[data-open="16"]')).toBeVisible();

  expect(errors).toEqual([]);
});

test('an empty discover search always offers a recoverable path',async({page})=>{
  const errors=watchPageErrors(page);
  await ready(page);
  await page.locator('#bottom [data-btm="discover"]').click();

  const search=page.locator('#q');
  await search.fill('zzzz-no-real-hoy-venue-zzzz');
  const empty=page.locator('.empty');
  await expect(empty).toBeVisible();
  await expect(empty).toContainText(/Hier passt gerade nichts|anderen Suchbegriff/i);

  const reset=empty.locator('[data-consumer-reset],[data-decision-reset],[data-reset-to-discover]').first();
  await expect(reset).toBeVisible();
  await expect(reset).toContainText(/zurücksetzen/i);
  await reset.click();

  await expect.poll(()=>page.evaluate(()=>({query:state.query,service:state.service,moment:state.moment,decision:state.decision}))).toEqual({query:'',service:'all',moment:'all',decision:'all'});
  await expect(page.locator('.list-card[data-open]').first()).toBeVisible({timeout:10000});
  expect(errors).toEqual([]);
});
