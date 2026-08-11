const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});

async function ready(page){await page.goto('./',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>=2)}

test('HOY NOW never promotes unknown hours as an open-now recommendation',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{
    const uncertain=Number(DATA[0].id),open=Number(DATA[1].id);
    window.hoyNowStatus219For=p=>Number(p?.id)===open?{state:'open',tone:'open',label:'Jetzt geöffnet · bis 23:00',source:'operator'}:null;
    window.hoyBestCurrentFor=()=>null;
    state.view='home';state.moment='all';state.query='';state.service='all';state.decision='all';render();
    window.__decisionTrustIds={uncertain,open};
  });
  const ids=await page.locator('[data-decision280-home] [data-decision280-open]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.decision280Open)));
  const expected=await page.evaluate(()=>window.__decisionTrustIds);
  expect(ids).toContain(expected.open);
  expect(ids).not.toContain(expected.uncertain);
});

test('unknown hours stay explicit on ordinary discover results',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{
    window.hoyNowStatus219For=()=>null;
    window.hoyBestCurrentFor=()=>null;
    state.view='discover';state.moment='all';state.query='';state.service='all';state.decision='all';render();
  });
  const first=page.locator('[data-journey-results] .decision280-card-verdict').first();
  await expect(first).toContainText('Öffnungszeiten bitte prüfen');
  await expect(first).not.toContainText('Passt jetzt');
});
