// Product card shared by the public catalog and the CMS preview, so what you see in the CMS is what customers get.
import {element,imageURL} from './theme.js';
import {BRANDS,waHref as brandWaHref,orderURL as brandOrderURL,pageLink} from './brand.js';

export const PHONE=BRANDS.reka.phone;
const GENERIC_NOTE=/^sipas katalogut$/i;
const ORDER_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20.5 8H7M10 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>';

// Category order on the page: the catalogue's own list first (skipping categories with no visible product), then the rest in product order.
export const categoryNames=(catalog,products)=>{const present=new Set(products.map(product=>product.category)),listed=[...new Set((catalog?.categories||[]).filter(name=>present.has(name)))];return [...listed,...[...present].filter(name=>!listed.includes(name))]};
export const cleanSize=value=>String(value).replace(/^[Øø]\s*/,'').trim();
export const noteOf=product=>GENERIC_NOTE.test(product.note||'')?'':(product.note||'');
// The business is Reka unless a profile is passed (brand.js has the profiles).
export const waHref=(text,profile=BRANDS.reka)=>brandWaHref(profile,text);
export const cardStyleName=style=>({slate:'slate',ornate:'ornate',classic:'classic',standard:'slate',compact:'slate',poster:'slate',minimal:'classic'})[style]||'slate';
export const initialSelection=product=>({variant:cleanSize(product.variants[0]||''),color:product.colors[0]||''});
export const orderDetail=(product,selection)=>[product.name,noteOf(product),selection.variant,selection.color].filter(Boolean).join(' · ');
export const orderURL=(product,selection,profile=BRANDS.reka)=>brandOrderURL(profile,orderDetail(product,selection),pageLink(product));

// Fades the right edge of a chip row only when it actually scrolls.
const fits=new ResizeObserver(entries=>{for(const {target} of entries)target.classList.toggle('is-scroll',target.scrollWidth>target.clientWidth+1)});

function options(label,values,selection,key,fallback,onChange,{compact=false}={}){
 const box=element('div','','opt'),list=element('div','','chips');
 if(!compact)box.append(element('span',label,'opt-label'));
 box.append(list);
 if(!values.length){list.append(element('span',fallback,'chip static'));return box}
 list.setAttribute('role','radiogroup');list.setAttribute('aria-label',label);
 for(const value of values){
  const chip=element('button',value,'chip');chip.type='button';chip.setAttribute('role','radio');chip.setAttribute('aria-checked',String(value===selection[key]));
  chip.onclick=()=>{selection[key]=value;for(const item of list.children)item.setAttribute('aria-checked',String(item===chip));onChange?.()};
  list.append(chip);
 }
 fits.observe(list);return box;
}

// Card (compact): one quiet row of size chips, so every card stays the same height and easy to scan.
// Sheet (full): labelled sizes + colors.
export function buildOptions(product,selection,onChange,{compact=false}={}){
 const box=element('div','','card-options');
 box.append(options('Përmasa',product.variants.map(cleanSize),selection,'variant','Standard',onChange,{compact}));
 if(!compact&&product.colors.length)box.append(options('Ngjyra',product.colors,selection,'color','',onChange));
 return box;
}

const subtitle=product=>[noteOf(product),product.colors.length?product.colors.length+' ngjyra':''].filter(Boolean).join(' · ');

export function createCard(product,{style='slate',selection=initialSelection(product),eager=false,onOpen,onSelect,brand=BRANDS.reka}={}){
 const card=element('article','','card '+style),picture=element('div','','product-image'),image=element('img'),body=element('div','','card-body');
 card.dataset.title=product.name.length>20?'long':'normal';
 image.src=imageURL(product.image);image.alt=product.name;image.decoding='async';
 image.loading=eager?'eager':'lazy';
 const ready=()=>{image.classList.add('loaded');picture.classList.add('ready')};
 image.onload=ready;image.onerror=()=>picture.classList.add('ready');
 if(image.complete&&image.naturalWidth)ready();
 picture.append(image);
 const title=element('h3',product.name);title.title=product.name;
 const order=element('a','','order'),label=element('span',product.colors.length&&onOpen?'Zgjidh ngjyrën':'Porosit');
 order.innerHTML=ORDER_ICON;order.append(label);order.target='_blank';order.rel='noopener';
 const update=()=>{order.href=orderURL(product,selection,brand);order.setAttribute('aria-label','Porosit '+orderDetail(product,selection)+' në WhatsApp')};
 // Image and title open the full view; products with colors send the order button there too, since the color is picked in the full view.
 if(onOpen){
  picture.classList.add('is-link');picture.tabIndex=0;picture.setAttribute('role','button');picture.setAttribute('aria-label','Shiko detajet: '+product.name);
  picture.onclick=()=>onOpen(product);picture.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpen(product)}};
  title.classList.add('is-link');title.onclick=()=>onOpen(product);
  if(product.colors.length)order.onclick=event=>{event.preventDefault();onOpen(product)};
 }
 body.append(title,element('p',subtitle(product),'card-note'),buildOptions(product,selection,()=>{update();onSelect?.()},{compact:true}),order);
 update();card.append(picture,body);return card;
}
