// Share links: a saved, named set of products the owner can send to customers. The address ?l=<code> opens the catalogue as usual, scrolls to those products and
// rings them. Pure (no DOM, no imports): the pages, the CMS tab and the server all use this one file (npm run sync copies it to reka-cms/public/ and reka-cms/lib/).
//
// On a catalogue (all optional):  links: [{id, name, products:[product id]}]
// id is the code in the address (a-z, 0-9, hyphen); it is made from the name once and never changes when the link is renamed. The published catalogue.json only
// carries [{id, products}] (publicLinks): names are for the owner and stay in the draft.
export const LINK_LIMITS=Object.freeze({links:100,name:60,code:40,products:200});
const CODE=/^[a-z0-9-]{1,40}$/,BAD='Share links are not valid.';
const fold=text=>String(text).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const listOf=links=>Array.isArray(links)?links:[];
const idsOf=link=>Array.isArray(link?.products)?link.products:[];

// A plain code from a name: no accents, a-z 0-9 and single hyphens, at most 40 characters; "link" when nothing is left; a clash gets -2, -3, ...
export function codeFromName(name,taken=[]){
 const base=fold(name).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,LINK_LIMITS.code).replace(/-+$/,'')||'link';
 if(!taken.includes(base))return base;
 for(let n=2;;n++){const tail='-'+n,code=base.slice(0,LINK_LIMITS.code-tail.length).replace(/-+$/,'')+tail;if(!taken.includes(code))return code}
}

// '' when the links are fine (or there are none), else a message. Product ids may point at products that no longer exist: the pages skip them.
export function linksProblem(links){
 if(links===undefined)return '';
 if(!Array.isArray(links)||links.length>LINK_LIMITS.links)return BAD;
 const seen=new Set();
 for(const link of links){
  if(!plain(link)||typeof link.id!=='string'||!CODE.test(link.id)||seen.has(link.id))return BAD;
  seen.add(link.id);
  if(typeof link.name!=='string'||!link.name.trim()||link.name.length>LINK_LIMITS.name)return BAD;
  const products=link.products;
  if(!Array.isArray(products)||products.length>LINK_LIMITS.products||products.some(id=>typeof id!=='string'||!id)||new Set(products).size!==products.length)return BAD;
 }
 return '';
}

// The code in the page address (?l=), lower case; empty outside a browser.
export const linkedCode=()=>typeof location==='undefined'?'':(new URLSearchParams(location.search).get('l')||'').trim().toLowerCase();
// The address to send: the catalogue's address (any query or hash dropped) plus ?l=<code>.
export const shareLink=(base,code)=>String(base).split(/[?#]/)[0]+'?l='+encodeURIComponent(code);

// The products of a link that are on the page, in the order of `products`. Unknown code, no links or broken data: none.
export function linkedProducts(catalog,code,products){
 const wanted=String(code||'').toLowerCase();if(!wanted)return [];
 const ids=new Set(idsOf(listOf(catalog?.links).find(link=>plain(link)&&link.id===wanted)));
 return products.filter(product=>ids.has(product.id));
}

// Deleting a product takes it out of every link. undefined stays undefined, so a catalogue that never had links does not gain a key.
export const withoutProduct=(links,id)=>Array.isArray(links)?links.map(link=>({...link,products:idsOf(link).filter(item=>item!==id)})):undefined;
// What is published: no names, and only the products that are published.
export function publicLinks(links,publishedIds){
 const live=new Set(publishedIds);
 return listOf(links).map(link=>({id:link.id,products:idsOf(link).filter(id=>live.has(id))}));
}
// Create (no id) or update (id) a link. Products are de-duplicated and cut to the ones that still exist; a renamed link keeps its code.
export function upsertLink(links,{id,name,products},existingIds){
 const list=listOf(links),live=new Set(existingIds);
 const link={id:id??codeFromName(name,list.map(item=>item.id)),name:String(name).trim(),products:[...new Set(products)].filter(item=>live.has(item))};
 const at=list.findIndex(item=>item.id===link.id);
 return {link,links:at<0?[...list,link]:list.map((item,index)=>index===at?link:item)};
}
export const removeLink=(links,id)=>listOf(links).filter(link=>link.id!==id);

// The products the picker offers (hidden ones too), highest priority first; every word of the search must be in the name or category, accents ignored.
export function pickable(products,{query='',category=''}={}){
 const words=fold(query).trim().split(/\s+/).filter(Boolean);
 return products.filter(product=>(!category||product.category===category)&&words.every(word=>fold(product.name+' '+product.category).includes(word)))
  .sort((a,b)=>(b.priority||0)-(a.priority||0));
}

// Where to scroll so the chosen cards sit in the middle of the visible area. rects: {top,bottom} of each card in page coordinates; offset: height of the sticky bars.
// The first card in page order and every card within one screen of it are centred together; a card taller than the screen goes just under the bars.
export function focusY(rects,{viewport,offset}){
 if(!rects.length)return 0;
 const sorted=[...rects].sort((a,b)=>a.top-b.top),first=sorted[0],available=viewport-offset;
 let bottom=first.bottom;
 for(const rect of sorted.slice(1))if(rect.bottom-first.top<=available)bottom=Math.max(bottom,rect.bottom);
 const span=bottom-first.top;
 return Math.max(0,Math.round(span>available?first.top-offset-12:first.top-offset-(available-span)/2));
}
