const HERO="https://commons.wikimedia.org/wiki/Special:FilePath/La_Manga_y_el_Mar_Menor.jpg?width=1600"; const HERO2=HERO;
function commonsFile(name,width=960){return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(name)}?width=${width}`}
const MEDIA_SOURCES={
  la_manga:{
    kind:"regional", src:HERO, position:"50% 42%",
    label:"Umgebungsbild · La Manga",
    source:"https://commons.wikimedia.org/wiki/File:La_Manga_y_el_Mar_Menor.jpg",
    author:"Alesper33", license:"CC BY-SA 4.0",
    license_url:"https://creativecommons.org/licenses/by-sa/4.0/",
    note:"Freies Regionalbild; zeigt nicht das Restaurant."
  },
  la_manga_beach:{
    kind:"regional", src:commonsFile("Beach at La Manga.jpg",960), position:"50% 48%",
    label:"Umgebungsbild · La Manga Strand",
    source:"https://commons.wikimedia.org/wiki/File:Beach_at_La_Manga.jpg",
    author:"Felipe Ortega", license:"CC BY-SA 2.0",
    license_url:"https://creativecommons.org/licenses/by-sa/2.0/",
    note:"Freies Strandbild aus La Manga; zeigt nicht das Restaurant."
  },
  ciervo:{
    kind:"local_area", src:commonsFile("Isla del Ciervo0655.jpg",960), position:"50% 48%",
    label:"Umgebungsbild · Isla del Ciervo",
    source:"https://commons.wikimedia.org/wiki/File:Isla_del_Ciervo0655.jpg",
    author:"Nanosanchez", license:"CC BY-SA 3.0",
    license_url:"https://creativecommons.org/licenses/by-sa/3.0/",
    note:"Freies lokales Umgebungsbild der Isla del Ciervo; zeigt nicht das Restaurant."
  },
  cavanna:{
    kind:"local_area", src:commonsFile("Hotel Cavanna (20200726 101301).jpg",960), position:"50% 42%",
    label:"Umgebungsbild · Cavanna",
    source:"https://commons.wikimedia.org/wiki/File:Hotel_Cavanna_(20200726_101301).jpg",
    author:"P4K1T0", license:"CC0 1.0",
    license_url:"https://creativecommons.org/publicdomain/zero/1.0/",
    note:"Freies lokales Orientierungsbild am Cavanna; zeigt nicht das Restaurant."
  },
  estacio:{
    kind:"local_area", src:commonsFile("Faro de El Estacio (9540662594).jpg",960), position:"50% 50%",
    label:"Umgebungsbild · El Estacio",
    source:"https://commons.wikimedia.org/wiki/File:Faro_de_El_Estacio_(9540662594).jpg",
    author:"Aureliano", license:"CC BY-SA 2.0",
    license_url:"https://creativecommons.org/licenses/by-sa/2.0/",
    note:"Freies lokales Umgebungsbild des Faro de El Estacio; zeigt nicht das Restaurant."
  },
  playa_chica:{
    kind:"local_area", src:commonsFile("® MAR MENOR LA MANGA PLAYA CHICA CHIRINGUITO - panoramio (1).jpg",960), position:"50% 50%",
    label:"Umgebungsbild · Playa Chica (2009)",
    source:"https://commons.wikimedia.org/wiki/File:%C2%AE_MAR_MENOR_LA_MANGA_PLAYA_CHICA_CHIRINGUITO_-_panoramio_(1).jpg",
    author:"Concepcion AMAT ORTA…", license:"CC BY 3.0",
    license_url:"https://creativecommons.org/licenses/by/3.0/",
    note:"Historisches freies Foto eines Chiringuito-Umfelds an Playa Chica (2009). Es belegt nicht die Identität des heutigen Betriebs."
  },
  club_dos_mares:{
    kind:"venue", src:commonsFile("Club Náutico Dos Mares (20230508 125734).jpg",960), position:"50% 48%",
    label:"Freies Objektfoto · Club Náutico",
    source:"https://commons.wikimedia.org/wiki/File:Club_N%C3%A1utico_Dos_Mares_(20230508_125734).jpg",
    author:"P4K1T0", license:"CC0 1.0",
    license_url:"https://creativecommons.org/publicdomain/zero/1.0/",
    note:"Freies Foto des Club-Náutico-Dos-Mares-Komplexes; kein Foto eines konkreten Gerichts oder Innenraums."
  },
  cabo_harbor:{
    kind:"local_area", src:commonsFile("Cabo de Palos1.jpg",960), position:"50% 50%",
    label:"Umgebungsbild · Hafen Cabo de Palos",
    source:"https://commons.wikimedia.org/wiki/File:Cabo_de_Palos1.jpg",
    author:"Nanosanchez", license:"Public Domain",
    license_url:"https://creativecommons.org/publicdomain/mark/1.0/",
    note:"Freies Hafenbild von Cabo de Palos; zeigt nicht das Restaurant."
  },
  cabo_lighthouse:{
    kind:"local_area", src:commonsFile("Faro de Cabo de Palos.jpg",960), position:"50% 42%",
    label:"Umgebungsbild · Faro de Cabo de Palos",
    source:"https://commons.wikimedia.org/wiki/File:Faro_de_Cabo_de_Palos.jpg",
    author:"Jotoni", license:"CC BY-SA 3.0",
    license_url:"https://creativecommons.org/licenses/by-sa/3.0/",
    note:"Freies lokales Umgebungsbild des Faro de Cabo de Palos; zeigt nicht das Restaurant."
  },
  cabo_levante:{
    kind:"local_area", src:commonsFile("Cabo de Palos - Flickr - IHQ.jpg",960), position:"50% 48%",
    label:"Umgebungsbild · Playa de Levante",
    source:"https://commons.wikimedia.org/wiki/File:Cabo_de_Palos_-_Flickr_-_IHQ.jpg",
    author:"I HQ", license:"CC BY-SA 2.0",
    license_url:"https://creativecommons.org/licenses/by-sa/2.0/",
    note:"Freies Foto der Playa de Levante in Cabo de Palos; zeigt nicht den Betrieb."
  },
  cala_reona:{
    kind:"local_area", src:commonsFile("Cala Reona, Cabo de Palos, Murcia, España, 2022-07-15, DD 19.jpg",960), position:"50% 50%",
    label:"Umgebungsbild · Cala Reona",
    source:"https://commons.wikimedia.org/wiki/File:Cala_Reona,_Cabo_de_Palos,_Murcia,_Espa%C3%B1a,_2022-07-15,_DD_19.jpg",
    author:"Diego Delso", license:"CC BY-SA 4.0",
    license_url:"https://creativecommons.org/licenses/by-sa/4.0/",
    note:"Freies Standortbild der Cala Reona; zeigt nicht den Beach Club selbst.",
    inline_credit:"Diego Delso · delso.photo · CC BY-SA 4.0"
  }
};

const PROFILE_MEDIA={
  1:"la_manga_beach", 2:"ciervo", 3:"la_manga_beach", 4:"la_manga_beach", 5:"cavanna", 6:"la_manga_beach",
  7:"estacio", 8:"estacio", 9:"la_manga", 10:"club_dos_mares", 11:"playa_chica", 12:"ciervo",
  13:"cabo_lighthouse", 14:"cabo_harbor", 15:"cabo_harbor", 16:"cabo_lighthouse", 17:"cabo_harbor",
  18:"cabo_harbor", 19:"cabo_harbor", 20:"cabo_harbor", 21:"cabo_levante", 22:"cala_reona"
};
function mediaFor(p){
  if(typeof claimDraft!=='undefined' && claimDraft && hasLocalVerifiedClaim(p) && claimDraft.ownerHero){
    return {kind:"operator",src:claimDraft.ownerHero,position:"50% 50%",label:"Betreiberbild · Rechte bestätigt",source:"",author:"Betreiber",license:"HOY-Nutzungsfreigabe",license_url:"",note:"Vom Betreiber für das HOY-Profil hochgeladen und zur Nutzung bestätigt."};
  }
  return MEDIA_SOURCES[PROFILE_MEDIA[p.id]|| (p.area.includes("Cabo")?"cabo_harbor":"la_manga")]
}
function mediaMarkup(p,cls="media-photo"){
  const m=mediaFor(p);
  const inline=m.inline_credit?`<span class="media-attrib">${esc(m.inline_credit)}</span>`:"";
  return `<img class="${cls}" src="${m.src}" alt="${m.kind==="operator"?"Vom Betreiber freigegebenes Restaurantfoto":m.kind==="venue"?"Freies Foto des Standorts":"Freies Umgebungsbild"}" style="object-position:${m.position||'50% 50%'}" loading="lazy" onerror="imgError(this)"><span class="media-shade"></span><span class="media-badge">${esc(m.label)}</span>${inline}`;
}
function imgError(el){
  el.onerror=null; el.src=HERO;
  const badge=el.parentElement && el.parentElement.querySelector(".media-badge");
  if(badge) badge.textContent="Regionales Fallbackbild · La Manga";
  const attrib=el.parentElement && el.parentElement.querySelector(".media-attrib"); if(attrib) attrib.remove();
}
function mediaCredit(p){
  const m=mediaFor(p);
  if(m.kind==="operator") return `<div class="media-credit">${esc(m.note)} · ${esc(m.license)}.</div>`;
  return `<div class="media-credit">${esc(m.note)} Quelle: <a href="${m.source}" target="_blank" rel="noopener">Wikimedia Commons</a> · ${esc(m.author)} · <a href="${m.license_url}" target="_blank" rel="noopener">${esc(m.license)}</a>.</div>`;
}
