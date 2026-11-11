// Product card shared by the public catalog and the CMS preview, so what you see in the CMS is what customers get.
import {element,imageURL} from './theme.js';
import {BRANDS,waHref as brandWaHref,orderURL as brandOrderURL,pageLink} from './brand.js';
import {priceOf,formatPrice} from './price.js';
import {customCardVars} from './customcard.js';
import {cleanSize,initialSelection,propertiesOf,selectedOf,pickOption,photoOf,photoPaths,orderParts,hasPopupChoices} from './properties.js';
export {cleanSize,initialSelection};   // the size/selection rules live in properties.js (shared with the server and the CMS)

export const PHONE=BRANDS.reka.phone;
const GENERIC_NOTE=/^sipas katalogut$/i;
const ORDER_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20.5 8H7M10 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>';

// Category order on the page: the catalogue's own list first (skipping categories with no visible product), then the rest in product order.
export const categoryNames=(catalog,products)=>{const present=new Set(products.map(product=>product.category)),listed=[...new Set((catalog?.categories||[]).filter(name=>present.has(name)))];return [...listed,...[...present].filter(name=>!listed.includes(name))]};
export const noteOf=product=>GENERIC_NOTE.test(product.note||'')?'':(product.note||'');
// The business is Reka unless a profile is passed (brand.js has the profiles).
export const waHref=(text,profile=BRANDS.reka)=>brandWaHref(profile,text);
export const cardStyleName=style=>({slate:'slate',ornate:'ornate',classic:'classic',custom:'custom',standard:'slate',compact:'slate',poster:'slate',minimal:'classic'})[style]||'slate';
export const orderDetail=(product,selection)=>[product.name,noteOf(product),selection.variant,selection.color,...orderParts(product,selection)].filter(Boolean).join(' · ');
export const orderURL=(product,selection,profile=BRANDS.reka)=>brandOrderURL(profile,orderDetail(product,selection),pageLink(product));

// Discounts. The price row of a card or popup: the price alone, or the old price struck through next to the discounted one.
// "prefix" is the design's class prefix (price, g-price, m-price); the percent badge is separate (saleBadge) because it sits on the photo.
export function priceBlock(product,prefix='price'){
 const info=priceOf(product);if(!info)return null;
 const row=element('span','',prefix),hidden=text=>element('span',text,prefix+'-vh');
 if(info.sale===null){row.append(element('b',formatPrice(info.price),prefix+'-now'));return row}
 row.append(hidden('Çmimi i mëparshëm: '),element('s',formatPrice(info.price),prefix+'-old'),' ',hidden('Çmimi me zbritje: '),element('b',formatPrice(info.sale),prefix+'-now'));
 return row;
}
// "-15%" (rounded up, see price.js), or null when the product has no discount.
export function saleBadge(product,cls='sale-badge'){
 const info=priceOf(product);if(!info||info.sale===null)return null;
 const badge=element('span','-'+info.percent+'%',cls);badge.setAttribute('aria-label','Zbritje '+info.percent+'%');return badge;
}

// Fades the right edge of a chip row only when it actually scrolls.
const fits=new ResizeObserver(entries=>{for(const {target} of entries)target.classList.toggle('is-scroll',target.scrollWidth>target.clientWidth+1)});

// One row of chips for a property (key: "variants" | "colors" | "p:<name>"; see properties.js).
function options(label,values,selection,key,fallback,onChange,{compact=false}={}){
 const box=element('div','','opt'),list=element('div','','chips');
 if(!compact)box.append(element('span',label,'opt-label'));
 box.append(list);
 if(!values.length){list.append(element('span',fallback,'chip static'));return box}
 list.setAttribute('role','radiogroup');list.setAttribute('aria-label',label);
 for(const value of values){
  const chip=element('button',value,'chip');chip.type='button';chip.setAttribute('role','radio');chip.setAttribute('aria-checked',String(value===selectedOf(selection,key)));
  chip.onclick=()=>{pickOption(selection,key,value);for(const item of list.children)item.setAttribute('aria-checked',String(item===chip));onChange?.()};
  list.append(chip);
 }
 fits.observe(list);return box;
}

// Card (compact): one quiet row of size chips, so every card stays the same height and easy to scan.
// Sheet (full): labelled sizes + colors + every custom property.
export function buildOptions(product,selection,onChange,{compact=false}={}){
 const box=element('div','','card-options');
 box.append(options('Përmasa',product.variants.map(cleanSize),selection,'variants','Standard',onChange,{compact}));
 if(!compact){for(const item of propertiesOf(product).filter(property=>property.key!=='variants'))box.append(options(item.name,item.values,selection,item.key,'',onChange))}
 return box;
}

// Makes the browser fetch every option photo of a product (when its popup opens), so a click on a chip swaps the photo without a pause.
export function preloadPhotos(product){for(const path of new Set(photoPaths(product)))new Image().src=imageURL(path)}

const subtitle=product=>[noteOf(product),product.colors.length?product.colors.length+' ngjyra':''].filter(Boolean).join(' · ');

export function createCard(product,{style='slate',selection=initialSelection(product),eager=false,onOpen,onSelect,brand=BRANDS.reka,custom}={}){
 if(style==='custom'&&!custom)style='slate';   // a custom card without (valid) settings is the Hark card
 const card=element('article','','card '+style),picture=element('div','','product-image'),image=element('img'),body=element('div','','card-body');
 let shown=imageURL(photoOf(product,selection));   // the photo of the selected option, else the main photo (properties.js)
 card.dataset.title=product.name.length>20?'long':'normal';
 if(style==='custom'){const {vars,data}=customCardVars(custom);for(const [name,value] of Object.entries(vars))card.style.setProperty(name,value);for(const [name,value] of Object.entries(data))card.setAttribute('data-'+name,value)}
 image.src=shown;image.alt=product.name;image.decoding='async';
 image.loading=eager?'eager':'lazy';
 const ready=()=>{image.classList.add('loaded');picture.classList.add('ready')};
 image.onload=ready;image.onerror=()=>{const main=imageURL(product.image);if(shown!==main){shown=main;image.src=main}else picture.classList.add('ready')};   // an option photo that cannot load shows the main photo
 const showPhoto=()=>{const next=imageURL(photoOf(product,selection));if(next!==shown){shown=next;image.src=next}};
 if(image.complete&&image.naturalWidth)ready();
 picture.append(image);
 const badge=saleBadge(product);if(badge)picture.append(badge);
 const title=element('h3',product.name);title.title=product.name;
 const choices=hasPopupChoices(product);   // a colour or a custom property to choose: the order button opens the popup, where it is chosen
 const order=element('a','','order'),label=element('span',choices&&onOpen?(product.colors.length?'Zgjidh ngjyrën':'Zgjidh opsionet'):'Porosit');
 order.innerHTML=ORDER_ICON;order.append(label);order.target='_blank';order.rel='noopener';
 const update=()=>{order.href=orderURL(product,selection,brand);order.setAttribute('aria-label','Porosit '+orderDetail(product,selection)+' në WhatsApp')};
 // Image and title open the full view; products with colors send the order button there too, since the color is picked in the full view.
 if(onOpen){
  picture.classList.add('is-link');picture.tabIndex=0;picture.setAttribute('role','button');picture.setAttribute('aria-label','Shiko detajet: '+product.name);
  picture.onclick=()=>onOpen(product);picture.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpen(product)}};
  title.classList.add('is-link');title.onclick=()=>onOpen(product);
  if(choices)order.onclick=event=>{event.preventDefault();onOpen(product)};
 }
 const price=priceBlock(product);
 body.append(title,element('p',subtitle(product),'card-note'),...(price?[price]:[]),buildOptions(product,selection,()=>{update();showPhoto();onSelect?.()},{compact:true}),order);
 update();card.append(picture,body);return card;
}
