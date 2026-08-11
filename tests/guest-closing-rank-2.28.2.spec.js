const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>=1);
}

test('closing soon is visibly downgraded against an otherwise equal venue',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const ref=new Date('2026-08-11T19:15:00Z'); // 21:15 Europe/Madrid
    const seed=DATA[0];
    const soon={...seed,name:'A Soon'};
    const later={...seed,name:'Z Later'};
    window.hoyBestCurrentFor=()=>null;
    window.hoyNowStatus219For=p=>p.name==='A Soon'
      ?{state:'open',tone:'open',label:'Jetzt geöffnet · bis 22:00',source:'operator'}
      :{state:'open',tone:'open',label:'Jetzt geöffnet · bis 01:00',source:'operator'};
    const ranked=window.hoyDecision280Rank([soon,later],ref);
    return {
      first:ranked[0].name,
      soon:window.hoyDecision280For(soon,ref),
      later:window.hoyDecision280For(later,ref)
    };
  });
  expect(result.first).toBe('Z Later');
  expect(result.soon.closingMinutes).toBe(45);
  expect(result.soon.title).toBe('Nur noch kurz geöffnet');
  expect(result.soon.reasons.some(x=>x.label==='Schließt bald · 22:00')).toBeTruthy();
  expect(result.later.score).toBeGreaterThan(result.soon.score);
});

test('equal scores use usable closing time before alphabetical order',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const ref=new Date('2026-08-11T19:15:00Z'); // 21:15 Europe/Madrid
    const seed=DATA[0];
    const earlier={...seed,name:'A Earlier'};
    const later={...seed,name:'Z Later'};
    window.hoyBestCurrentFor=()=>null;
    window.hoyNowStatus219For=p=>p.name==='A Earlier'
      ?{state:'open',tone:'open',label:'Jetzt geöffnet · bis 00:30',source:'operator'}
      :{state:'open',tone:'open',label:'Jetzt geöffnet · bis 01:00',source:'operator'};
    const a=window.hoyDecision280For(earlier,ref);
    const b=window.hoyDecision280For(later,ref);
    const ranked=window.hoyDecision280Rank([earlier,later],ref);
    return {first:ranked[0].name,aScore:a.score,bScore:b.score,aClose:a.closingMinutes,bClose:b.closingMinutes};
  });
  expect(result.aScore).toBe(result.bScore);
  expect(result.aClose).toBe(195);
  expect(result.bClose).toBe(225);
  expect(result.first).toBe('Z Later');
});
