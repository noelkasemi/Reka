// "Martini" page design: everything that needs no DOM (so Node tests can import it). The page itself is martini.js.
// Business details are fixed in this design on purpose: the CMS has no fields for them.
import {contrast,luminance,fit,lighten} from './mode.js';
import {BRANDS,MARTINI,waHref as brandWaHref,orderURL as brandOrderURL,listURL as brandListURL,generalURL as brandGeneralURL,pageLink} from './brand.js';
import {cleanSize,orderParts,propertyText} from './properties.js';

// The fixed details and the message wording live in brand.js (shared with the other designs and the CMS); this file re-exports what the Martini design uses.
export {MARTINI};

// Same nine colours as the Galeri design, so the CMS colour editor, validation and the generated dark look work unchanged.
export const MARTINI_KEYS=['gBg','gTile','gInk','gMuted','gAccent','gAccentText','gDark','gDarkText','gLine'];
// Mirrored as LIGHT_MARTINI in mode.js (a test checks it): keep in sync.
export const MARTINI_DEFAULTS={gBg:'#F1E8D6',gTile:'#FFFFFF',gInk:'#1B2B22',gMuted:'#5E5B4A',gAccent:'#3BA67E',gAccentText:'#0B2419',gDark:'#15382B',gDarkText:'#F4EDE0',gLine:'#D8CCB2'};
export const MARTINI_PRESETS=[
 {name:'Kraft & Leaf',note:'Kraft i ngrohtë me gjelbër. Pamja e Martini&K.',theme:MARTINI_DEFAULTS},
 {name:'Natë & Mint',note:'E errët me gjelbër mint.',theme:{gBg:'#0F1F18',gTile:'#FFFFFF',gInk:'#EDE6D3',gMuted:'#AEB5A5',gAccent:'#4CC596',gAccentText:'#06180F',gDark:'#0A1612',gDarkText:'#F1EBDA',gLine:'#26402F'}}
];
export const MARTINI_TEXTS=BRANDS.martini.texts;

const HEX=/^#[0-9a-f]{6}$/i;
export const martiniTheme=theme=>({...MARTINI_DEFAULTS,...Object.fromEntries(MARTINI_KEYS.filter(key=>HEX.test(theme?.[key])).map(key=>[key,theme[key]]))});
export const martiniTexts=catalog=>({...MARTINI_TEXTS,...Object.fromEntries(['title','intro'].filter(key=>typeof catalog?.texts?.[key]==='string'&&catalog.texts[key].trim()).map(key=>[key,catalog.texts[key].trim()]))});

// ---- palette -> page colours ----
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const mix=(a,b,t)=>{const [x,y]=[rgb(a),rgb(b)];return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const worst=(color,backgrounds)=>Math.min(...backgrounds.map(bg=>contrast(color,bg)));
// `color` itself when it already reads on every background, else the nearest lightness that does, else black or white (whichever reads better).
function readableOn(color,backgrounds,min=4.5){
 if(worst(color,backgrounds)>=min)return color;
 let result=color;for(const bg of backgrounds)result=fit(result,bg,min);
 if(worst(result,backgrounds)>=min)return result;
 return worst('#000000',backgrounds)>=worst('#ffffff',backgrounds)?'#000000':'#ffffff';
}
// The page's CSS variables (without the leading --) from the nine palette colours.
export function martiniTokens(theme){
 const t=martiniTheme(theme),dark=luminance(t.gBg)<.18;
 const paper=t.gBg,paper2=dark?mix(paper,t.gInk,.06):mix(paper,t.gInk,.08),surface=dark?mix(paper,t.gInk,.1):mix(paper,'#ffffff',.55);
 const forest=t.gDark;
 return {
  paper,'paper-2':paper2,surface,tile:t.gTile,forest,ink:t.gInk,muted:t.gMuted,line:t.gLine,
  mint:t.gAccent,'on-mint':readableOn(t.gAccentText,[t.gAccent]),
  'mint-deep':readableOn(t.gAccent,[paper,surface,paper2]),'mint-light':readableOn(lighten(t.gAccent,.62),[forest]),
  'on-forest':t.gDarkText,'on-forest-2':readableOn(mix(t.gDarkText,forest,.25),[forest])
 };
}

// ---- products ----
// Hero picks: products starred in the CMS first, topped up with the others, at most n.
export const spotlightOf=(products,n=5)=>[...products.filter(product=>product.featured),...products.filter(product=>!product.featured)].slice(0,n);
export const fold=text=>String(text??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const haystack=product=>fold([product.name,product.category,product.description,product.note,...(product.variants||[]),...(product.colors||[]),propertyText(product)].filter(Boolean).join(' '));
// Visible products in the category whose text contains every word of the query (plain substring, never a RegExp); highest priority first, otherwise catalogue order.
export function searchProducts(products,{query,category}){
 const words=fold(query).split(/\s+/).filter(Boolean);
 return products.map((product,index)=>[product,index]).filter(([product])=>product.visible!==false&&(!category||product.category===category)&&words.every(word=>haystack(product).includes(word)))
  .sort((x,y)=>(y[0].priority||0)-(x[0].priority||0)||x[1]-y[1]).map(([product])=>product);
}
// Same rule as card.js: the catalogue's own category order first (skipping categories without a product), then the rest in product order.
export const categoryNames=(catalog,products)=>{const present=new Set(products.map(product=>product.category)),listed=[...new Set((catalog?.categories||[]).filter(name=>present.has(name)))];return [...listed,...[...present].filter(name=>!listed.includes(name))]};
export const groupByCategory=(products,names)=>names.map(name=>[name,products.filter(product=>product.category===name)]).filter(([,items])=>items.length);
// "Label: value" lines of a description are spec rows (that is how Martini's Kapaciteti/Dimensionet/Paketimi live in the plain description field); the rest is text.
export function splitDescription(text){
 const rows=[],rest=[];
 for(const raw of String(text||'').split(/\r?\n/)){const line=raw.trim();if(!line)continue;const match=line.match(/^([^:]{2,24}):\s*(\S.*)$/);if(match)rows.push([match[1].trim(),match[2].trim()]);else rest.push(line)}
 return {rows,text:rest.join(' ')};
}

// ---- WhatsApp messages ----
const GENERIC_NOTE=/^sipas katalogut$/i;
export {cleanSize};   // one definition for every design (properties.js)
export const noteOf=product=>GENERIC_NOTE.test(product.note||'')?'':(product.note||'');
export const waHref=text=>brandWaHref(BRANDS.martini,text);
export const orderLine=(product,selection)=>[product.name,noteOf(product),cleanSize(selection?.variant||''),selection?.color,...orderParts(product,selection)].filter(Boolean).join(' · ');
export const orderURL=(product,selection)=>brandOrderURL(BRANDS.martini,orderLine(product,selection),pageLink(product));
export const listURL=items=>brandListURL(BRANDS.martini,items.map(({product,selection})=>({text:orderLine(product,selection),link:pageLink(product)})));
export const generalURL=()=>brandGeneralURL(BRANDS.martini);

// ---- saved list (Lista ime): the browser's storage may be blocked or hold junk, so reading never throws ----
export function readList(storage,key,validIds){
 try{
  const data=JSON.parse(storage.getItem(key)||'[]'),seen=new Set();
  if(!Array.isArray(data))return [];
  return data.filter(item=>item&&typeof item==='object'&&validIds.has(item.id)&&!seen.has(item.id)&&seen.add(item.id)).map(item=>({id:item.id,variant:String(item.variant??''),color:String(item.color??''),
   ...(item.props&&typeof item.props==='object'&&!Array.isArray(item.props)?{props:Object.fromEntries(Object.entries(item.props).filter(([,value])=>typeof value==='string'))}:{}),   // custom properties (properties.js); old items have none
   ...(Array.isArray(item.recent)?{recent:item.recent.filter(key=>typeof key==='string')}:{})}));
 }catch{return []}
}
export function saveList(storage,key,items){try{storage.setItem(key,JSON.stringify(items))}catch{}}

// An untouched palette follows the design: when every palette key still equals `fromStock` (compared ignoring hex case), the `toStock` palette is applied; a customised one is kept.
export const swapStock=(theme,fromStock,toStock)=>Object.keys(fromStock).every(key=>String(theme[key]).toLowerCase()===String(fromStock[key]).toLowerCase())?{...theme,...toStock}:theme;
