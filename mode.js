// Dark and light looks for the customer pages: pure colour functions plus tiny storage helpers. Nothing here touches the DOM when the file loads.
// A dark look is derived from the catalogue's own palette: same hues, fixed dark lightness, then every text/background pair is nudged until it reads.

// Mirrors GALLERY_DEFAULTS.restaurant in gallery.js: keep in sync.
export const LIGHT_GALLERY={gBg:'#efeae0',gTile:'#f8f5ee',gInk:'#17251d',gMuted:'#686658',gAccent:'#8f5d12',gAccentText:'#ffffff',gDark:'#14251c',gDarkText:'#f5f0e2',gLine:'#d8d1c0'};
// Mirrors themeDefaults in the CMS lib/products.mjs (a test checks it): keep in sync.
export const LIGHT_CLASSIC={green:'#1b3326',headerText:'#f5f0e2',cream:'#f5f1e6',ink:'#1c2f25',muted:'#5f6a5c',gold:'#bf9d5e',footer:'#14251c',footerText:'#b4c0b0',card:'#fbf9f2',image:'#ffffff',border:'#d8d2bf',filter:'#ebe5d4',filterText:'#1c2f25',filterActive:'#1b3326',filterActiveText:'#f5f0e2',field:'#ffffff',fieldText:'#1c2f25',button:'#1b3326',buttonText:'#f5f0e2',slateCard:'#365343',slateText:'#f7f2e5',slateField:'#f7f2e5',slateFieldText:'#1b3326',ornateCard:'#d6dcc6',ornateText:'#1b3326',ornateImage:'#ffffff',ornateButton:'#1b3326',ornateButtonText:'#f5f0e2',classicCard:'#ebe4d0',classicText:'#1c2f25',classicImage:'#ffffff',classicButton:'#2d4a39',classicButtonText:'#f5f0e2'};

const HEX=/^#[0-9a-f]{6}$/i;
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export const luminance=hex=>{const [r,g,b]=rgb(hex).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b};
export const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
export const isDarkBg=hex=>luminance(hex)<.18;

function toHsl(hex){
 const [r,g,b]=rgb(hex).map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,d=max-min;let h=0,s=0;
 if(d){s=d/(1-Math.abs(2*l-1));h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360}
 return [h,s,l];
}
function fromHsl(h,s,l){
 const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
 const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
 return '#'+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');
}
// hue of `ref` at lightness `l`, saturation scaled by `sat`
const tint=(ref,l,sat=1)=>{const [h,s]=toHsl(ref);return fromHsl(h,Math.min(1,s*sat),l)};
const lighten=(hex,minL)=>{const [h,s,l]=toHsl(hex);return l>=minL?hex:fromHsl(h,s,minL)};
// moves fg's lightness towards whichever extreme (white or black) contrasts more with bg, until the pair reaches `min`. That extreme always gets there (both reach 4.58:1 at luminance .18)
function fit(fg,bg,min){
 const [h,s,start]=toHsl(fg),step=contrast('#000000',bg)>contrast('#ffffff',bg)?-.02:.02;let l=start;
 for(let i=0;i<60&&contrast(fromHsl(h,s,l),bg)<min;i++)l=Math.max(0,Math.min(1,l+step));
 return fromHsl(h,s,l);
}
const valid=(defaults,theme)=>({...defaults,...Object.fromEntries(Object.entries(theme||{}).filter(([key,value])=>key in defaults&&HEX.test(value)))});

// Galeri: 9 colours. The photo tile (gTile) never changes, so white-background photos and cut-outs stay visible.
export function darkGallery(theme){
 const t=valid(LIGHT_GALLERY,theme);
 const gBg=tint(t.gBg,.08,.5),gAccent=fit(lighten(t.gAccent,.58),gBg,4.5),gDark=tint(t.gDark,.05,.6);
 const accentText=contrast('#14110a',gAccent)>=contrast('#ffffff',gAccent)?'#14110a':'#ffffff';
 return {
  gBg,gTile:t.gTile,
  gInk:fit(tint(t.gInk,.93,.4),gBg,4.5),
  gMuted:fit(tint(t.gMuted,.68,.4),gBg,4.5),
  gAccent,gAccentText:fit(accentText,gAccent,4.5),
  gDark,gDarkText:fit(tint(t.gDarkText,.92,.4),gDark,4.5),
  gLine:tint(t.gLine,.2,.4)
 };
}

// Klasik: every colour. Photo backgrounds (image, ornateImage, classicImage) never change. Buttons and the selected category use the lightened gold with dark text.
export function darkClassic(theme){
 const t=valid(LIGHT_CLASSIC,theme);
 const page=tint(t.cream,.09,.55),card=tint(t.card,.13,.5),green=tint(t.green,.12,.8),footer=tint(t.footer,.06,.8);
 const gold=fit(lighten(t.gold,.6),page,3),onGold=fit(tint(t.ink,.1,.5),gold,4.5);
 const light=(ref,l,bg)=>fit(tint(ref,l,.4),bg,4.5);
 const filter=tint(t.filter,.17,.5),field=tint(t.field,.16,.5),slateCard=tint(t.slateCard,.24,.6),ornateCard=tint(t.ornateCard,.17,.45),classicCard=tint(t.classicCard,.17,.45);
 return {
  green,headerText:light(t.headerText,.94,green),
  cream:page,ink:fit(light(t.ink,.93,page),card,4.5),muted:fit(light(t.muted,.68,page),card,4.5),gold,
  footer,footerText:light(t.footerText,.72,footer),
  card,image:t.image,border:tint(t.border,.25,.4),
  filter,filterText:light(t.filterText,.88,filter),filterActive:gold,filterActiveText:onGold,
  field,fieldText:light(t.fieldText,.92,field),button:gold,buttonText:onGold,
  slateCard,slateText:light(t.slateText,.95,slateCard),slateField:t.slateField,slateFieldText:fit(t.slateFieldText,t.slateField,4.5),
  ornateCard,ornateText:light(t.ornateText,.92,ornateCard),ornateImage:t.ornateImage,ornateButton:gold,ornateButtonText:onGold,
  classicCard,classicText:light(t.classicText,.92,classicCard),classicImage:t.classicImage,classicButton:gold,classicButtonText:onGold
 };
}

// Which looks a page has. `own` is the palette the page really uses (Galeri passes its skin-aware palette); otherwise the catalogue's saved theme over the defaults.
// A light page gets a generated dark look. A dark Galeri page keeps its own look and gets the light defaults. A dark Klasik page has no toggle.
export function lookFor(catalog,layout,own){
 const gallery=layout==='gallery',mine=valid(gallery?LIGHT_GALLERY:LIGHT_CLASSIC,own||catalog?.theme);
 if(!isDarkBg(gallery?mine.gBg:mine.cream))return {base:'light',toggle:true,themes:{light:mine,dark:gallery?darkGallery(mine):darkClassic(mine)}};
 if(gallery)return {base:'dark',toggle:true,themes:{light:LIGHT_GALLERY,dark:mine}};
 return {base:'dark',toggle:false,themes:{light:mine,dark:mine}};
}

// The visitor's choice, kept in the browser. Storage can be blocked (private windows): every access is guarded.
const CHOICES=['dark','light'];
export const readChoice=key=>{try{const value=localStorage.getItem(key);return CHOICES.includes(value)?value:null}catch{return null}};
export const saveChoice=(key,value)=>{if(!CHOICES.includes(value))return;try{localStorage.setItem(key,value)}catch{}};

// ---- The page's light/dark button (browser only; nothing runs at load) ----
export const MODE_KEY='reka-color-mode';
// The look to show: the visitor's saved choice, otherwise the catalogue's own look. A page without a toggle (dark Klasik palette) always shows its own look.
// The browser's own dark-mode setting is never used.
export const currentLook=look=>look.toggle?readChoice(MODE_KEY)||look.base:look.base;
export function applyLook(dark){
 const root=document.documentElement;root.dataset.look=dark?'dark':'light';root.style.colorScheme=dark?'dark':'light';
}
const MOON='<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',SUN='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
export function modeButton({dark,onToggle}){
 const button=document.createElement('button');button.type='button';button.className='mode-btn';button.title=button.ariaLabel='Pamja e errët';
 const paint=()=>{button.setAttribute('aria-pressed',String(dark));button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(dark?SUN:MOON)+'</svg>'};
 button.onclick=()=>{dark=!dark;paint();onToggle(dark)};paint();
 return button;
}
