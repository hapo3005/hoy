const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers:'block' });

test('legacy review step cannot bypass missing contact or authorization', async ({ page }) => {
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    openClaimFlow(DATA[0].id,1);
    claimDraft.contact={name:'',email:'',role:'Inhaber/in'};
    claimDraft.verified=false;
    claimDraft.step=6;
    saveClaim();renderClaimFlow();
  });
  const button=page.locator('#claimFlow [data-claim-next]');
  await expect(page.locator('#claimFlow .onboarding-step-count')).toHaveText('3/3');
  await expect(button).toHaveText('Kontakt vervollständigen');
  await button.click();
  await expect(page.locator('#claimFlow .onboarding-step-count')).toHaveText('1/3');
  expect(await page.evaluate(()=>claimDraft.step)).toBe(1);
});

test('legacy review step routes back to core data when address is missing', async ({ page }) => {
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    openClaimFlow(DATA[0].id,1);
    claimDraft.contact={name:'María Beispiel',email:'maria@example.com',role:'Inhaber/in'};
    claimDraft.verified=true;
    claimDraft.profile={...(claimDraft.profile||{}),address:''};
    claimDraft.step=6;
    saveClaim();renderClaimFlow();
  });
  const button=page.locator('#claimFlow [data-claim-next]');
  await expect(button).toHaveText('Kerndaten vervollständigen');
  await button.click();
  await expect(page.locator('#claimFlow .onboarding-step-count')).toHaveText('2/3');
});
