/* HOY 2.19 — conservative now-status: useful in the moment, never more certain than the source */
(function(){
  const TZ='Europe/Madrid';
  const DAYS=['Mo','Di','Mi','Do','Fr','Sa','So'];
  const DAY_INDEX=new Map(DAYS.map((d,i)=>[d,i]));
  const EN_DAY={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6};
  const UNCERTAIN=/(widersprech|bestätigung erforderlich|vor live-anzeige|nicht klar ausgewiesen|nicht belastbar|wochenplan noch nicht vollständig|andere aktuelle profile weichen ab|konkrete saisonzeiten vor besuch prüfen|bis spät|\bca\.|\bab\s+\d{1,2}:\d{2})/i;
  const esc219=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function madridParts(now=new Date()){
    const date=now instanceof Date?now:new Date(now);
    if(!Number.isFinite(date.getTime()))return null;
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ,weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    return {day:EN_DAY[get('weekday')],date:`${get('year')}-${get('month')}-${get('day')}`,minutes:Number(get('hour'))*60+Number(get('minute'))};
  }
  function timeMinutes(value,{end=false}={}){
    const m=String(value||'').match(/^(\d{1,2}):(\d{2})$/);if(!m)return null;
    const h=Number(m[1]),min=Number(m[2]);if(min>59||h>24||(h===24&&min!==0))return null;
    return h===24?(end?1440:0):h*60+min;
  }
  function normalizeIntervals(value){
    if(!Array.isArray(value))return [];
    return value.map(pair=>{
      if(!Array.isArray(pair)||pair.length!==2)return null;
      const start=String(pair[0]||'').trim(),end=String(pair[1]||'').trim();
      return timeMinutes(start)!=null&&timeMinutes(end,{end:true})!=null?{start,end}:null;
    }).filter(Boolean).slice(0,3);
  }
  function expandDayToken(token){
    const cleaned=String(token||'').replace(/\s+/g,'').replace(/[–—]/g,'-');
    const m=cleaned.match(/^(Mo|Di|Mi|Do|Fr|Sa|So)(?:-(Mo|Di|Mi|Do|Fr|Sa|So))?$/);if(!m)return [];
    const a=DAY_INDEX.get(m[1]),b=m[2]?DAY_INDEX.get(m[2]):a;if(a==null||b==null)return [];
    const out=[];let i=a;for(let guard=0;guard<7;guard++){out.push(i);if(i===b)break;i=(i+1)%7}return out;
  }
  function daySelector(segment){
    if(/täglich/i.test(segment))return DAYS.map((_,i)=>i);
    const prefix=String(segment).split(/(?=\d{1,2}:\d{2}|geschlossen)/i)[0];
    const tokens=prefix.match(/(?:Mo|Di|Mi|Do|Fr|Sa|So)(?:\s*[–—-]\s*(?:Mo|Di|Mi|Do|Fr|Sa|So))?/g)||[];
    return [...new Set(tokens.flatMap(expandDayToken))];
  }
  function parseIntervalsFromText(segment){
    const out=[];const re=/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/g;let m;
    while((m=re.exec(segment))){if(timeMinutes(m[1])!=null&&timeMinutes(m[2],{end:true})!=null)out.push({start:m[1],end:m[2]})}
    return out.slice(0,3);
  }
  function parseBaseSchedule(text){
    const raw=String(text||'').trim();if(!raw||UNCERTAIN.test(raw))return null;
    const schedule=Array.from({length:7},()=>null);const explicitClosed=new Set();
    const segments=raw.split('·').map(x=>x.trim()).filter(Boolean);
    for(const seg of segments){
      let days=daySelector(seg);
      const closed=/geschlossen/i.test(seg);
      if(!days.length&&(/\bsonst\b/i.test(seg)||/übrige tage/i.test(seg))&&explicitClosed.size)days=DAYS.map((_,i)=>i).filter(i=>!explicitClosed.has(i));
      if(!days.length)continue;
      if(closed){for(const d of days){schedule[d]=[];explicitClosed.add(d)}continue}
      const intervals=parseIntervalsFromText(seg);if(!intervals.length)continue;
      for(const d of days)schedule[d]=intervals.map(x=>({...x}));
    }
    return schedule.some(x=>Array.isArray(x))?schedule:null;
  }
  function scheduleFromOperator(p,parts){
    const special=p?.operator_special_hours;
    if(special&&String(special.service_date||'')===parts.date){
      if(special.is_closed)return {schedule:Array.from({length:7},(_,i)=>i===parts.day?[]:null),source:'operator-special'};
      const intervals=normalizeIntervals(special.intervals);
      if(intervals.length){const schedule=Array.from({length:7},()=>null);schedule[parts.day]=intervals;return {schedule,source:'operator-special'}}
    }
    const weekly=p?.operator_hours?.weekly_hours;
    if(weekly&&typeof weekly==='object'){
      const schedule=DAYS.map(day=>normalizeIntervals(weekly[{Mo:'mon',Di:'tue',Mi:'wed',Do:'thu',Fr:'fri',Sa:'sat',So:'sun'}[day]]));
      return {schedule,source:'operator'};
    }
    return null;
  }
  function scheduleFromBase(p){const schedule=parseBaseSchedule(p?.hours_text);return schedule?{schedule,source:'base',seasonal:/saisonale abweichungen/i.test(String(p?.hours_text||''))}:null}
  function openWindow(schedule,parts){
    const today=schedule[parts.day];const prev=schedule[(parts.day+6)%7];const now=parts.minutes;
    if(Array.isArray(prev))for(const row of prev){const s=timeMinutes(row.start),e=timeMinutes(row.end,{end:true});if(s==null||e==null)continue;if(e<=s&&now<e)return {state:'open',end:row.end,overnight:true}}
    if(Array.isArray(today))for(const row of today){const s=timeMinutes(row.start),e=timeMinutes(row.end,{end:true});if(s==null||e==null)continue;if(e>s&&now>=s&&now<e)return {state:'open',end:row.end};if(e<=s&&now>=s)return {state:'open',end:row.end,overnight:true}}
    if(Array.isArray(today)){
      const later=today.map(row=>({row,start:timeMinutes(row.start)})).filter(x=>x.start!=null&&x.start>now).sort((a,b)=>a.start-b.start)[0];
      if(later)return {state:'later',start:later.row.start};
      return {state:'closed'};
    }
    return null;
  }
  function resultFor(source,window,extra={}){
    if(!window)return null;const operator=source!=='base';
    if(window.state==='open')return {state:'open',source,operatorConfirmed:operator,tone:'open',label:operator?`Jetzt geöffnet · bis ${window.end}`:`Laut Öffnungszeiten · offen bis ${window.end}`,proof:source==='operator-special'?'Sonderzeit vom Betrieb':source==='operator'?'Vom Betrieb gepflegt':extra.seasonal?'Nicht live bestätigt · saisonale Abweichung möglich':'Nicht live bestätigt'};
    if(window.state==='later')return {state:'later',source,operatorConfirmed:operator,tone:'later',label:operator?`Öffnet heute ${window.start}`:`Laut Öffnungszeiten · öffnet ${window.start}`,proof:source==='operator-special'?'Sonderzeit vom Betrieb':source==='operator'?'Vom Betrieb gepflegt':extra.seasonal?'Nicht live bestätigt · saisonale Abweichung möglich':'Nicht live bestätigt'};
    return {state:'closed',source,operatorConfirmed:operator,tone:'closed',label:operator?'Heute geschlossen':'Laut Öffnungszeiten · heute geschlossen',proof:source==='operator-special'?'Sonderzeit vom Betrieb':source==='operator'?'Vom Betrieb gepflegt':extra.seasonal?'Nicht live bestätigt · saisonale Abweichung möglich':'Nicht live bestätigt'};
  }
  function statusFor(p,now=new Date()){
    const parts=madridParts(now);if(!parts||parts.day==null)return null;
    const operator=scheduleFromOperator(p,parts);if(operator)return resultFor(operator.source,openWindow(operator.schedule,parts));
    const base=scheduleFromBase(p);if(!base)return null;
    return resultFor(base.source,openWindow(base.schedule,parts),base);
  }
  window.hoyNowStatus219For=statusFor;
  window.hoyParseHours219=parseBaseSchedule;

  function markup(status,compact=false){
    if(!status)return '';
    return `<div class="hoy-now-status ${esc219(status.tone)}${status.operatorConfirmed?' confirmed':' base'}${compact?' compact':''}" data-hoy-now-status><span class="hoy-now-dot" aria-hidden="true"></span><div><strong>${esc219(status.label)}</strong>${compact?'':`<small>${esc219(status.proof)}</small>`}</div></div>`;
  }

  const baseListCard219=listCard;
  listCard=function(p){
    const html=baseListCard219(p),status=statusFor(p);if(!status)return html;
    const shell=document.createElement('div');shell.innerHTML=html;const card=shell.firstElementChild;if(!card)return html;
    const copy=card.querySelector('.decision-copy')||card.querySelector('.map-decision-copy');
    const signals=card.querySelector('.decision-signals');
    if(copy&&!card.querySelector('[data-hoy-now-status]'))(signals||copy.lastElementChild)?.insertAdjacentHTML(signals?'beforebegin':'afterend',markup(status,true));
    return card.outerHTML;
  };

  const baseMapView219=mapView;
  mapView=function(){
    const html=baseMapView219();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.querySelectorAll('.map-decision-card[data-map-card]').forEach(card=>{
      const p=DATA.find(x=>Number(x.id)===Number(card.dataset.mapCard)),status=statusFor(p);if(!status||card.querySelector('[data-hoy-now-status]'))return;
      const signals=card.querySelector('.map-decision-signals'),copy=card.querySelector('.map-decision-copy');
      if(signals)signals.insertAdjacentHTML('beforebegin',markup(status,true));else copy?.insertAdjacentHTML('beforeend',markup(status,true));
    });
    return root.outerHTML;
  };

  const baseOpenDetail219=openDetail;
  openDetail=function(id){
    baseOpenDetail219(id);
    const p=DATA.find(x=>Number(x.id)===Number(id)),d=document.getElementById('detail'),status=statusFor(p);if(!p||!d?.open||!status||d.querySelector('.hoy-profile-now-status'))return;
    const identity=d.querySelector('.profile-identity-card');if(!identity)return;
    const wrap=document.createElement('div');wrap.className='hoy-profile-now-status';wrap.innerHTML=markup(status,false);
    const trust=identity.querySelector('.profile-trust-line');(trust||identity.lastElementChild)?.insertAdjacentElement('afterend',wrap);
  };
})();
