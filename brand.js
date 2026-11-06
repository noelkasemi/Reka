// The two businesses a catalogue can belong to, as fixed profiles. Pure data and string helpers (no DOM, no imports), so the pages,
// the CMS and the server can all use the same file (npm run sync copies it to reka-cms/public/ and reka-cms/lib/).
// Reka's values are exactly what the live pages said before profiles existed: golden tests pin them.

// Martini&K's fixed details (also used by the Martini design's hero, counters and footer).
export const MARTINI=Object.freeze({
 name:'Martini&K',phone:'355692034304',phoneLabel:'+355 69 20 34 304',email:'info@martini.al',address:'5040 Rruga Dardania Kashar, Tiranë',
 facebook:'https://www.facebook.com/MartiniK-102694901456834',instagram:'https://www.instagram.com/martinipack/',linkedin:'https://www.linkedin.com/company/martini-k-shpk/about/',
 since:'Est. 2007 · Tiranë',stamps:Object.freeze(['Organic','Biodegradable','Eco-friendly']),
 stats:Object.freeze([{to:300,suffix:'+',label:'klientë të kënaqur'},{to:100,suffix:'+',label:'produkte të ndryshme'},{to:2007,suffix:'',label:'që nga viti'}].map(Object.freeze)),
 tagline:'Power of Nature',blurb:'Kompania #1 e paketimeve dhe produkteve një përdorimshe. Shpërndajmë produkte në të gjithë vendin që nga viti 2007.'
});

// The Martini&K cube + MK mark (24x26 box scaled by the page's own CSS). The loader embeds the same path data (a test checks it).
export const MARK_SVG='<svg class="m-mark" viewBox="0 0 48 52" aria-hidden="true"><path d="M24 2 44 13.5v25L24 50 4 38.5v-25z" stroke-width="3"/><path d="M12.5 35V18l6.5 8.5L25.5 18v17M31 18v17M38.5 18 31 26.5l7.5 8.5" stroke-width="3.2"/></svg>';

const deepFreeze=value=>{for(const inner of Object.values(value))if(inner&&typeof inner==='object')deepFreeze(inner);return Object.freeze(value)};

export const BRANDS=deepFreeze({
 reka:{
  id:'reka',name:'Reka Horeca',greeting:'Përshëndetje Reka Horeca!',generalMessage:'Përshëndetje Reka Horeca! Dua informacion për produktet.',
  eyebrow:'Katalogu Reka Horeca',phone:'355694050377',phoneLabel:'+355 69 40 50 377',email:'',address:'',facebook:'',instagram:'',linkedin:'',
  footerLine:'Zgjidhni produktin në katalog dhe porositni direkt në WhatsApp.',copyright:'© Reka Horeca',
  noscript:'Aktivizoni JavaScript për të parë katalogun, ose telefononi +355 69 40 50 377.',
  documentTitle:'Reka Horeca — Katalogu i produkteve',
  description:'Katalogu Reka Horeca: pajisje profesionale për restorante dhe bare. Zgjidhni produktin dhe përmasën, pastaj porositni në WhatsApp.',
  ogDescription:'Pajisje profesionale për restorante dhe bare. Porositni direkt në WhatsApp.',
  themeColor:'#102f25',logo:{kind:'img',src:'assets/logo.png',alt:'Reka Horeca',width:460,height:68},texts:null
 },
 martini:{
  id:'martini',name:MARTINI.name,greeting:'Përshëndetje Martini&K!',generalMessage:'Përshëndetje Martini&K! Kam një pyetje për produktet tuaja.',
  eyebrow:'Katalogu Martini&K',phone:MARTINI.phone,phoneLabel:MARTINI.phoneLabel,email:MARTINI.email,address:MARTINI.address,
  facebook:MARTINI.facebook,instagram:MARTINI.instagram,linkedin:MARTINI.linkedin,
  footerLine:MARTINI.blurb,copyright:'© Martini&K Shpk',
  noscript:'Aktivizoni JavaScript për të parë katalogun, ose telefononi '+MARTINI.phoneLabel+'.',
  documentTitle:'Martini&K — Katalogu i produkteve',
  description:'Katalogu Martini&K: paketime dhe produkte një përdorimshe për restorante, kafene dhe furra. Zgjidhni produktin dhe porositni direkt në WhatsApp.',
  ogDescription:'Paketime dhe produkte një përdorimshe për Horeca. Porositni direkt në WhatsApp.',
  themeColor:'#15382B',logo:{kind:'mark'},
  texts:{title:'Gjithçka fillon me produktet tona',intro:'Paketime dhe produkte një përdorimshe për restorante, kafene, furra dhe dërgesa. Zgjidhni produktin dhe porositni direkt në WhatsApp.'}
 }
});

// An explicit valid `brand` wins; a catalogue made with the Martini design before profiles existed (no `brand`) counts as Martini; everything else is Reka.
export const brandOf=catalog=>{const brand=catalog?.brand;if(brand==='reka'||brand==='martini')return brand;return catalog?.layout==='martini'?'martini':'reka'};
export const profileOf=catalog=>BRANDS[brandOf(catalog)];

// The page designs each business may use (Klasik = 'classic', Galeri = 'gallery'). The Martini design belongs to Martini&K only.
export const DESIGNS=Object.freeze({reka:Object.freeze(['classic','gallery']),martini:Object.freeze(['martini','classic','gallery'])});
export const defaultDesign=brand=>brand==='martini'?'martini':'gallery';

export const waHref=(profile,text)=>'https://wa.me/'+profile.phone+'?text='+encodeURIComponent(text);
export const generalURL=profile=>waHref(profile,profile.generalMessage);
export const orderURL=(profile,detail)=>waHref(profile,profile.greeting+' Dëshiroj të porosis: '+detail+'. Faleminderit!');
export const listURL=(profile,lines)=>waHref(profile,profile.greeting+' Dëshiroj të porosis:\n'+lines.map(line=>'• '+line).join('\n')+'\nFaleminderit!');

// The tab title. Reka keeps each design's own wording (and "<name> — Reka Horeca" for a named catalogue); Martini is always its own title.
export function documentTitle(profile,{design,mode,name}={}){
 if(profile.id==='martini')return profile.documentTitle;
 if(name)return name+' — '+profile.name;
 if(mode==='bars'&&design==='classic')return profile.name+' — Katalogu Bars i produkteve';
 if(mode==='bars'&&design==='gallery')return profile.name+' — Katalogu Bars';
 return profile.documentTitle;
}
// The logo as markup for the headers and footers: Reka's image exactly as the pages had it; Martini's mark and wordmark (styled by .m-mark / .m-word).
const esc=text=>String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const logoMarkup=profile=>{const logo=profile.logo;return logo.kind==='mark'?MARK_SVG+'<span class="m-word">MARTINI<span>&amp;</span>K</span>':'<img src="'+esc(logo.src)+'" alt="'+esc(logo.alt)+'" width="'+logo.width+'" height="'+logo.height+'">'};
// The Klasik hero headline.
export const heroTitle=(profile,mode)=>profile.texts?profile.texts.title:(mode==='bars'?'Pajisje profesionale për barin tuaj':'Pajisje profesionale për kuzhinën tuaj');
