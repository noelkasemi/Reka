// Product card shared by the public catalog and the CMS preview, so what you see in the CMS is what customers get.
import {element,imageURL} from './theme.js';

export const PHONE='355694050377';
const GENERIC_NOTE=/^sipas katalogut$/i;
const ORDER_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20.5 8H7M10 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>';

export const cleanSize=value=>String(value).replace(/^[Øø]\s*/,'').trim();
export const noteOf=product=>GENERIC_NOTE.test(product.note||'')?'':(product.note||'');
export const waHref=text=>'https://wa.me/'+PHONE+'?text='+encodeURIComponent(text);
export const cardStyleName=style=>({slate:'slate',ornate:'ornate',classic:'classic',standard:'slate',compact:'slate',poster:'slate',minimal:'classic'})[style]||'slate';
export const initialSelection=product=>({variant:cleanSize(product.variants[0]||''),color:product.colors[0]||''});
export const orderDetail=(product,selection)=>[product.name,noteOf(product),selection.variant,selection.color].filter(Boolean).join(' · ');
export const orderURL=(product,selection)=>waHref('Përshëndetje Reka Horeca! Dëshiroj të porosis: '+orderDetail(product,selection)+'. Faleminderit!');

// Fades the right edge of a chip row only when it actually scrolls.
const fits=new ResizeObserver(entries=>{for(const {target} of entries)target.classList.toggle('is-scroll',target.scrollWidth>target.clientWidth+1)});

function options(label,values,selection,key,fallback,onChange){
 const box=element('div','','opt'),list=element('div','','chips');
 box.append(element('span',label,'opt-label'),list);
 if(!values.length){list.append(element('span',fallback,'chip static'));return box}
 list.setAttribute('role','radiogroup');list.setAttribute('aria-label',label);
 for(const value of values){
  const chip=element('button',value,'chip');chip.type='button';chip.setAttribute('role','radio');chip.setAttribute('aria-checked',String(value===selection[key]));
  chip.onclick=()=>{selection[key]=value;for(const item of list.children)item.setAttribute('aria-checked',String(item===chip));onChange?.()};
  list.append(chip);
 }
 fits.observe(list);return box;
}

// Two rows (size + colors/blurb) so every card keeps the same height. The sheet passes sheet=true: it already shows the full description.
export function buildOptions(product,selection,onChange,{sheet=false}={}){
 const box=element('div','','card-options');
 box.append(options('Përmasa',product.variants.map(cleanSize),selection,'variant','Standard',onChange));
 if(product.colors.length)box.append(options('Ngjyra',product.colors,selection,'color','',onChange));
 else if(!sheet)box.append(blurb(product));
 return box;
}

function blurb(product){
 const box=element('div','','opt'),text=product.description.trim();
 box.append(element('span',text?'Rreth produktit':'Detaje','opt-label'),element('p',text||'Pyesni në WhatsApp për këtë produkt.','opt-text'));
 return box;
}

export function createCard(product,{style='slate',selection=initialSelection(product),eager=false,onOpen,onSelect}={}){
 const card=element('article','','card '+style),picture=element('div','','product-image'),image=element('img'),body=element('div','','card-body');
 card.dataset.title=product.name.length>26?'long':'normal';
 image.src=imageURL(product.image);image.alt=product.name;image.decoding='async';
 image.loading=eager?'eager':'lazy';
 const ready=()=>{image.classList.add('loaded');picture.classList.add('ready')};
 image.onload=ready;image.onerror=()=>picture.classList.add('ready');
 if(image.complete&&image.naturalWidth)ready();
 picture.append(image);
 if(onOpen){
  const more=element('button','+','quick');more.type='button';more.setAttribute('aria-label','Shiko detajet: '+product.name);
  more.onclick=()=>onOpen(product);picture.append(more);
 }
 const title=element('h3',product.name);title.title=product.name;
 const order=element('a','','order');order.innerHTML=ORDER_ICON+'<span>Porosit</span>';order.target='_blank';order.rel='noopener';
 const update=()=>{order.href=orderURL(product,selection);order.setAttribute('aria-label','Porosit '+orderDetail(product,selection)+' në WhatsApp')};
 body.append(title,element('p',noteOf(product),'card-note'),buildOptions(product,selection,()=>{update();onSelect?.()}),order);
 update();card.append(picture,body);return card;
}
