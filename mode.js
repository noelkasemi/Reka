// Dark and light looks for the customer pages: pure colour functions plus tiny storage helpers. Nothing here touches the DOM when the file loads.
// A dark look is derived from the catalogue's own palette: same hues, fixed dark lightness, then every text/background pair is nudged until it reads.

// Mirrors GALLERY_DEFAULTS.restaurant in gallery.js: keep in sync.
export const LIGHT_GALLERY={gBg:'#efeae0',gTile:'#f8f5ee',gInk:'#17251d',gMuted:'#686658',gAccent:'#8f5d12',gAccentText:'#ffffff',gDark:'#14251c',gDarkText:'#f5f0e2',gLine:'#d8d1c0'};

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
// moves fg's lightness away from bg until the pair reaches `min` contrast
function fit(fg,bg,min){
 const [h,s,start]=toHsl(fg),step=luminance(bg)<.5?.02:-.02;let l=start;
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

// The visitor's choice, kept in the browser. Storage can be blocked (private windows): every access is guarded.
const CHOICES=['dark','light'];
export const readChoice=key=>{try{const value=localStorage.getItem(key);return CHOICES.includes(value)?value:null}catch{return null}};
export const saveChoice=(key,value)=>{if(!CHOICES.includes(value))return;try{localStorage.setItem(key,value)}catch{}};
