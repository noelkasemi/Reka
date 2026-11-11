// "Galeri" page design: an alternative to the classic catalog layout. Same catalog.json (products, sizes, colors, featured, order),
// so everything the CMS edits keeps working. Restaurants get the light "Atelier" skin, bars the dark "Nocturne" skin; the palette is editable.
import {element,imageURL,sharedSlug} from './theme.js';
import {applyLook,currentLook,lookFor,modeButton,saveChoice,MODE_KEY} from './mode.js';
import {categoryNames,cleanSize,noteOf,initialSelection,orderDetail,orderURL,preloadPhotos,priceBlock,saleBadge} from './card.js';
import {propertiesOf,selectedOf,pickOption,photoOf,restoreSelection,propertyText,orderParts} from './properties.js';
import {BRANDS,profileOf,documentTitle,generalURL,listURL,logoMarkup,pageLink,linkedProductId} from './brand.js';

export const GALLERY_KEYS=['gBg','gTile','gInk','gMuted','gAccent','gAccentText','gDark','gDarkText','gLine'];
export const GALLERY_DEFAULTS={
 restaurant:{gBg:'#efeae0',gTile:'#f8f5ee',gInk:'#17251d',gMuted:'#686658',gAccent:'#8f5d12',gAccentText:'#ffffff',gDark:'#14251c',gDarkText:'#f5f0e2',gLine:'#d8d1c0'},
 bars:{gBg:'#0e1514',gTile:'#eceee8',gInk:'#f0eee6',gMuted:'#97a39e',gAccent:'#e2a65a',gAccentText:'#1b1407',gDark:'#070b0a',gDarkText:'#f0eee6',gLine:'#26312e'}
};
export const GALLERY_TEXTS={
 restaurant:{title:'Pajisje profesionale për kuzhinën tuaj',intro:'Zgjidhni produktin dhe përmasën, pastaj porositni direkt në WhatsApp.'},
 bars:{title:'Pajisje profesionale për barin tuaj',intro:'Mjete për bar, koktejle dhe servirje. Zgjidhni produktin dhe porositni direkt në WhatsApp.'}
};
const HEX=/^#[0-9a-f]{6}$/i;
const norm=value=>String(value||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const skinOf=mode=>mode==='bars'?'bars':'restaurant';
// First restaurant defaults (before the contrast fix) that were saved into catalogs without being chosen by hand: treated as unset.
const OLD_DEFAULTS={gAccent:'#a9701f',gMuted:'#6c6a5e'};
export const galleryTheme=(theme,mode)=>({...GALLERY_DEFAULTS[skinOf(mode)],...Object.fromEntries(GALLERY_KEYS.filter(key=>HEX.test(theme?.[key])&&theme[key].toLowerCase()!==OLD_DEFAULTS[key]).map(key=>[key,theme[key]]))});
export const galleryTexts=(catalog,mode,brand=BRANDS.reka)=>({...(brand.texts||GALLERY_TEXTS[skinOf(mode)]),...Object.fromEntries(['title','intro'].filter(key=>typeof catalog?.texts?.[key]==='string'&&catalog.texts[key].trim()).map(key=>[key,catalog.texts[key].trim()]))});
const luminance=hex=>{const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.03928?c/12.92:((c+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b};

// Paints the palette onto a root element (the live page, or the CMS preview stage).
export function paintGallery(root,theme,mode){
 const colors=galleryTheme(theme,mode);
 root.classList.add('g');root.dataset.skin=skinOf(mode);root.dataset.tone=luminance(colors.gBg)<.3?'dark':'light';
 for(const key of GALLERY_KEYS)root.style.setProperty('--'+key,colors[key]);
 return colors;
}

// Fonts + stylesheet, loaded once (the CMS loads them only when the Galeri design is chosen).
let styles;
export function galleryStyles(){
 return styles||=Promise.all([
  ['https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Inter:wght@400;500;600&display=swap',2500],
  [new URL('gallery.css',import.meta.url).href,6000]
 ].map(([href,limit])=>new Promise(done=>{
  const link=element('link');link.rel='stylesheet';link.href=href;link.onload=link.onerror=()=>done();setTimeout(done,limit);document.head.append(link);
 })));
}

const E=(tag,cls='',...kids)=>{const node=element(tag,'',cls);node.append(...kids);return node};
const svg=(path,cls='')=>{const wrap=element('span','','g-ico '+cls);wrap.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg>';return wrap};
const ICON={
 heart:'<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.4 4.8 6.6 4.8c2 0 3.6 1.1 5.4 3.2 1.8-2.1 3.4-3.2 5.4-3.2 3.2 0 5.1 3.2 3.9 6.5-1.8 4.6-9.3 9.2-9.3 9.2z"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 close:'<path d="M6 6l12 12M18 6 6 18"/>',
 left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',down:'<path d="M12 5v14m-6-6 6 6 6-6"/>',list:'<path d="M5 7h14M5 12h14M5 17h9"/>'
};

// The four hero picks: products starred in the CMS (max 4), topped up with the first visible ones.
export const spotlightOf=products=>{const chosen=products.filter(product=>product.featured).slice(0,4);return [...chosen,...products.filter(product=>!chosen.includes(product))].slice(0,4)};
const sizesLine=product=>{const sizes=product.variants.map(cleanSize);return sizes.length>3?sizes.slice(0,3).join(' · ')+' +'+(sizes.length-3):sizes.join(' · ')};

// One product card; used by the public page and by the CMS previews.
export function createGalleryCard(product,{index=0,saved=false,onOpen,onSave}={}){
 const card=E('article','g-card'),open=E('button','g-open'),tile=E('span','g-tile'),image=element('img','','g-img');
 open.type='button';open.setAttribute('aria-label',product.name);card.dataset.id=product.id;
 image.src=imageURL(product.image);image.alt='';image.decoding='async';image.loading=index<4?'eager':'lazy';
 image.onload=()=>image.classList.add('loaded');image.onerror=()=>image.classList.add('loaded');if(image.complete&&image.naturalWidth)image.classList.add('loaded');
 tile.append(image,E('span','g-idx',String(index+1).padStart(2,'0')));
 const badge=saleBadge(product,'g-sale');if(badge)tile.append(badge);
 const note=[noteOf(product),sizesLine(product)].filter(Boolean).join(' — ');
 const meta=E('span','g-meta',E('small','',product.category),E('h3','',product.name),E('span','g-sub',note||' '));
 const price=priceBlock(product,'g-price');if(price)meta.append(price);
 open.append(tile,meta);open.onclick=()=>onOpen?.(product);card.append(open);
 if(onSave){
  const heart=E('button','g-heart',svg(ICON.heart));heart.type='button';heart.dataset.save=product.id;
  heart.setAttribute('aria-label','Ruaj '+product.name+' në listë');heart.setAttribute('aria-pressed',String(saved));
  heart.onclick=event=>{event.stopPropagation();onSave(product);heart.classList.remove('pop');void heart.offsetWidth;heart.classList.add('pop')};
  card.append(heart);
 }
 return card;
}

// Compact page used by the CMS Design tab: header, hero, category chips and two cards, painted with the draft palette.
export function createGalleryMock(stage,{theme,mode,products,cards=products.slice(0,2),texts,brand=BRANDS.reka}){
 paintGallery(stage,theme,mode);stage.classList.add('g-mock');stage.replaceChildren();
 const logo=E('span','g-logo');logo.innerHTML=logoMarkup(brand);logo.classList.toggle('mk',brand.logo.kind==='mark');
 const picks=spotlightOf(products),plate=E('div','g-plate'),shot=element('img');if(picks[0]){shot.src=imageURL(picks[0].image);shot.alt=''}plate.append(shot);
 const chips=E('div','g-chips-row');['Të gjitha','Kategoria 2','Kategoria 3'].forEach((label,i)=>{const chip=E('span','g-chip',label);chip.setAttribute('aria-pressed',String(!i));chips.append(chip)});
 stage.append(
  E('div','g-top on',E('div','g-top-in',logo,E('span','g-pill',svg(ICON.list),'Lista ime'))),
  E('div','g-hero',E('div','g-in',E('div','g-copy',E('p','g-eyebrow',brand.eyebrow),titleNode(texts.title),E('p','g-intro',texts.intro)),E('div','g-stage',plate))),
  E('div','g-bar',chips),
  E('div','g-grid',...cards.map((product,i)=>createGalleryCard(product,{index:i,onOpen:()=>{},onSave:()=>{}})))
 );
}
function titleNode(text){
 const words=text.trim().split(/\s+/),last=words.pop(),title=E('h1','g-title');
 title.append(words.length?words.join(' ')+' ':'',E('em','',last));return title;
}

export async function startGallery(catalog,mode){
 mode=skinOf(mode);
 for(const link of [...document.querySelectorAll('link[rel=stylesheet]')])if(!/loader\.css/.test(link.getAttribute('href'))&&!link.hasAttribute('data-fonts'))link.remove();
 await galleryStyles();
 const products=catalog.products.filter(product=>product.visible).sort((a,b)=>b.priority-a.priority);
 const brand=profileOf(catalog),byId=new Map(products.map(product=>[product.id,product])),texts=galleryTexts(catalog,mode,brand);
 const selections=new Map(),selectionOf=product=>{if(!selections.has(product.id))selections.set(product.id,initialSelection(product));return selections.get(product.id)};
 const KEY='reka-list-'+(sharedSlug()||mode);let list=[];
 try{list=JSON.parse(localStorage.getItem(KEY)||'[]').filter(item=>byId.has(item.id));for(const item of list)selections.set(item.id,restoreSelection(byId.get(item.id),item));list=list.map(item=>item.id)}catch{list=[]}
 let category='',query='',shown=products,sheetList=products,sheetIndex=0;
 document.title=documentTitle(brand,{design:'gallery',mode,name:catalog.name});

 const root=E('div','g');document.body.className='';document.body.removeAttribute('style');document.body.replaceChildren(root);
 // Light or dark: the catalogue's own look unless the visitor chose otherwise (button in the header).
 const look=lookFor(catalog,'gallery',galleryTheme(catalog.theme,mode));
 const paint=dark=>{const colors=paintGallery(root,look.themes[dark?'dark':'light'],mode);document.body.style.background=colors.gBg;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',colors.gDark);applyLook(dark)};
 const dark0=currentLook(look)==='dark';paint(dark0);

 const logo=()=>{const link=E('a','g-logo');link.href='#';link.setAttribute('aria-label',brand.name+', kreu');link.innerHTML=logoMarkup(brand);link.classList.toggle('mk',brand.logo.kind==='mark');return link};
 const wa=E('a','g-wa',svg(ICON.chat),E('span','','WhatsApp'));wa.href=generalURL(brand);wa.target='_blank';wa.rel='noopener';
 const listBtn=E('button','g-pill',svg(ICON.list),E('span','','Lista ime'),E('b','','0'));listBtn.type='button';
 const top=E('header','g-top',E('div','g-wrap g-top-in',logo(),E('div','g-top-actions',...[look.toggle&&modeButton({dark:dark0,onToggle:dark=>{saveChoice(MODE_KEY,dark?'dark':'light');paint(dark)}}),wa,listBtn].filter(Boolean))));

 // Hero + rotating showcase of the chosen products
 const picks=spotlightOf(products);let pick=0,timer;
 const stageBtn=E('button','g-stage-main'),stageImg=element('img'),stageCat=E('small'),stageName=E('strong'),stageGo=E('span','g-stage-go','Shiko më shumë ›');
 stageBtn.type='button';stageBtn.append(stageImg);
 const thumbs=E('div','g-thumbs',...picks.map((product,i)=>{const b=E('button','g-thumb',Object.assign(element('img'),{src:imageURL(product.image),alt:product.name,decoding:'async'}));b.type='button';b.setAttribute('aria-label',product.name);b.onclick=()=>{clearInterval(timer);show(i)};return b}));
 const stage=E('div','g-stage',E('div','g-plate',stageBtn),E('div','g-stage-cap',E('span','',stageCat,stageName),stageGo),thumbs);
 function show(i){
  pick=i;const product=picks[i];if(!product)return;
  stageImg.classList.remove('swap');void stageImg.offsetWidth;stageImg.src=imageURL(product.image);stageImg.alt=product.name;stageImg.classList.add('swap');
  stageCat.textContent=product.category;stageName.textContent=product.name;
  [...thumbs.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
 }
 stageBtn.onclick=stageGo.onclick=()=>picks[pick]&&openSheet(picks[pick],picks);
 const cta=E('a','g-btn primary','Shiko produktet ',svg(ICON.down));cta.href='#katalogu';
 const talk=E('a','g-btn ghost','Na shkruani');talk.href=wa.href;talk.target='_blank';talk.rel='noopener';
 const hero=E('section','g-hero',E('div','g-wrap g-in',E('div','g-copy',E('p','g-eyebrow',brand.eyebrow),titleNode(texts.title),E('p','g-intro',texts.intro),E('div','g-cta',cta,talk)),stage));
 if(!picks.length)stage.hidden=true;

 // Bars skin: a slow ticker of the category names under the hero
 const names=categoryNames(catalog,products);
 const ticker=E('div','g-ticker',E('div','',...[0,1].flatMap(()=>names.map(name=>E('span','',name,E('i','','✦'))))));ticker.setAttribute('aria-hidden','true');

 // Search + categories
 const input=element('input');input.type='search';input.placeholder='Kërkoni një produkt…';input.autocomplete='off';input.setAttribute('aria-label','Kërkoni një produkt');
 const clear=E('button','g-clear','×');clear.type='button';clear.hidden=true;clear.setAttribute('aria-label','Pastro kërkimin');
 const count=E('span','g-count');count.setAttribute('role','status');
 const find=E('div','g-wrap g-find',E('h2','g-h2','Produktet'),E('label','g-search',svg(ICON.search),input,clear,count));
 const chips=E('div','g-chips-row');chips.setAttribute('role','group');chips.setAttribute('aria-label','Kategoritë e produkteve');
 for(const name of ['',...names]){
  const chip=E('button','g-chip',name||'Të gjitha',E('small','',String(name?products.filter(product=>product.category===name).length:products.length)));
  chip.type='button';chip.dataset.name=name;chip.setAttribute('aria-pressed',String(!name));
  chip.onclick=()=>{category=name;for(const item of chips.children)item.setAttribute('aria-pressed',String(item===chip));chip.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});render();scrollTo({top:Math.max(0,find.offsetTop-70),behavior:'smooth'})};
  chips.append(chip);
 }
 const bar=E('div','g-bar',E('div','g-wrap',chips));bar.id='katalogu';
 const host=E('main','g-wrap g-main'),empty=E('div','g-empty');empty.hidden=true;

 // Footer
 const contact=(label,small,href,external)=>{const link=E('a','',label,E('small','',small));link.href=href;if(external){link.target='_blank';link.rel='noopener'}return link};
 const band=E('section','g-band',E('div','g-wrap g-band-in',E('h2','','Nuk e gjeni atë që kërkoni?'),E('p','','Na shkruani në WhatsApp dhe ju ndihmojmë të zgjidhni.'),contact('Na shkruani në WhatsApp','Porosi dhe pyetje',wa.href,true)));
 band.querySelector('a').className='g-btn primary';
 const foot=E('footer','g-foot',E('div','g-wrap g-foot-in',E('div','',logo(),E('p','',brand.footerLine),...(brand.address?[E('p','',brand.address)]:[])),E('div','g-contacts',contact(brand.phoneLabel,'Telefononi','tel:+'+brand.phone),...(brand.email?[contact(brand.email,'Email','mailto:'+brand.email)]:[]),contact('WhatsApp','Porosi dhe pyetje',wa.href,true))),E('p','g-copy-line',brand.copyright));
 const fab=E('button','g-fab',svg(ICON.list),E('span','','Lista ime · '),E('b','','0'),E('span','','Shiko ›'));fab.type='button';
 const sheet=E('dialog','g-sheet'),drawer=E('dialog','g-drawer');sheet.setAttribute('aria-label','Detajet e produktit');drawer.setAttribute('aria-label','Lista ime');
 root.append(top,hero,ticker,find,bar,host,empty,band,foot,fab,sheet,drawer);

 /* ---------- rendering ---------- */
 const reveal='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('in');reveal.unobserve(entry.target)}},{rootMargin:'0px 0px -5% 0px'}):null;
 function render(){
  const q=norm(query.trim());
  shown=products.filter(product=>(!category||category===product.category)&&norm(product.name+' '+product.description+' '+product.category+' '+product.variants.join(' ')+' '+propertyText(product)+' '+noteOf(product)).includes(q));
  const grouped=!category&&!q,groups=new Map();
  if(grouped)for(const name of names)groups.set(name,[]);for(const product of shown){const key=grouped?product.category:'';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(product)}for(const [key,items] of groups)if(!items.length)groups.delete(key);
  host.replaceChildren();let index=0;
  for(const [name,items] of groups){
   const block=E('section','g-block'),grid=E('div','g-grid');
   if(name)block.append(E('div','g-head',E('h2','',name),E('span','',String(items.length))));
   for(const product of items){const card=createGalleryCard(product,{index:index++,saved:list.includes(product.id),onOpen:item=>openSheet(item,shown),onSave:toggleSave});if(reveal){card.classList.add('reveal');card.style.transitionDelay=Math.min(index%4,3)*60+'ms';reveal.observe(card)}grid.append(card)}
   block.append(grid);host.append(block);
  }
  count.textContent=shown.length+' produkte';clear.hidden=!query;empty.hidden=!!shown.length;
  if(!shown.length){const reset=E('button','g-btn primary','Pastro kërkimin');reset.type='button';reset.onclick=()=>{input.value=query='';category='';for(const item of chips.children)item.setAttribute('aria-pressed',String(!item.dataset.name));render()};empty.replaceChildren(E('h3','','Nuk u gjet asnjë produkt.'),E('p','','Provoni një emër tjetër ose shfaqni të gjitha kategoritë.'),reset)}
 }
 input.oninput=()=>{query=input.value;render()};
 clear.onclick=()=>{input.value=query='';input.focus();render()};

 /* ---------- saved list ---------- */
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(list.map(id=>({id,...selectionOf(byId.get(id))}))))}catch{}};
 function toggleSave(product){list=list.includes(product.id)?list.filter(id=>id!==product.id):[...list,product.id];persist();sync()}
 function sync(){
  for(const heart of root.querySelectorAll('[data-save]'))heart.setAttribute('aria-pressed',String(list.includes(heart.dataset.save)));
  listBtn.lastChild.textContent=fab.querySelector('b').textContent=String(list.length);
  fab.classList.toggle('on',list.length>0&&!sheet.open&&!drawer.open);
  const saveBtn=sheet.querySelector('.g-save');if(saveBtn){const saved=list.includes(sheetList[sheetIndex]?.id);saveBtn.setAttribute('aria-pressed',String(saved));saveBtn.lastChild.textContent=saved?' E ruajtur':' Ruaj në listë'}
 }
 const choice=(values,selection,key,label,onChange)=>{
  const box=E('div','g-opt',E('span','g-opt-label',label)),row=E('div','g-chips');row.setAttribute('role','radiogroup');row.setAttribute('aria-label',label);
  for(const value of values){const chip=E('button','g-opt-chip',value);chip.type='button';chip.setAttribute('role','radio');chip.setAttribute('aria-checked',String(value===selectedOf(selection,key)));
   chip.onclick=()=>{pickOption(selection,key,value);for(const item of row.children)item.setAttribute('aria-checked',String(item===chip));persist();onChange?.()};row.append(chip)}
  box.append(row);return box;
 };

 /* ---------- dialogs ---------- */
 const open=dialog=>{dialog.showModal();requestAnimationFrame(()=>requestAnimationFrame(()=>dialog.classList.add('on')));sync()};
 const close=dialog=>{if(!dialog.open)return;dialog.classList.remove('on');setTimeout(()=>{dialog.close();sync()},260)};
 for(const dialog of [sheet,drawer]){dialog.addEventListener('cancel',event=>{event.preventDefault();close(dialog)});dialog.addEventListener('click',event=>{if(event.target===dialog)close(dialog)})}

 function openSheet(product,from=shown){sheetList=from.length?from:products;sheetIndex=Math.max(0,sheetList.indexOf(product));renderSheet();if(!sheet.open)open(sheet)}
 const step=delta=>{sheetIndex=(sheetIndex+delta+sheetList.length)%sheetList.length;renderSheet()};
 function renderSheet(){
  const product=sheetList[sheetIndex],selection=selectionOf(product);
  const closeBtn=E('button','g-x',svg(ICON.close));closeBtn.type='button';closeBtn.setAttribute('aria-label','Mbyll');closeBtn.onclick=()=>close(sheet);
  let shown=imageURL(photoOf(product,selection));const image=element('img');image.src=shown;image.alt=product.name;
  image.onerror=()=>{const main=imageURL(product.image);if(shown!==main){shown=main;image.src=main}};   // an option photo that cannot load shows the main photo
  const showPhoto=()=>{const next=imageURL(photoOf(product,selection));if(next!==shown){shown=next;image.src=next}};preloadPhotos(product);
  const tile=E('div','g-sheet-tile',image,closeBtn);
  const badge=saleBadge(product,'g-sale');if(badge)tile.append(badge);
  if(sheetList.length>1){for(const [delta,icon,label] of [[-1,ICON.left,'Para'],[1,ICON.right,'Pas']]){const b=E('button','g-nav '+(delta<0?'l':'r'),svg(icon));b.type='button';b.setAttribute('aria-label',label);b.onclick=event=>{event.stopPropagation();step(delta)};tile.append(b)}}
  tile.append(E('span','g-pos',(sheetIndex+1)+' / '+sheetList.length));
  let x0=0,y0=0;
  tile.onclick=event=>{if(event.target.closest('button'))return;const r=tile.getBoundingClientRect();tile.style.setProperty('--ox',(event.clientX-r.left)/r.width*100+'%');tile.style.setProperty('--oy',(event.clientY-r.top)/r.height*100+'%');tile.classList.toggle('zoom')};
  tile.onmousemove=event=>{if(!tile.classList.contains('zoom'))return;const r=tile.getBoundingClientRect();tile.style.setProperty('--ox',(event.clientX-r.left)/r.width*100+'%');tile.style.setProperty('--oy',(event.clientY-r.top)/r.height*100+'%')};
  tile.addEventListener('touchstart',event=>{x0=event.touches[0].clientX;y0=event.touches[0].clientY},{passive:true});
  tile.addEventListener('touchend',event=>{const dx=event.changedTouches[0].clientX-x0,dy=event.changedTouches[0].clientY-y0;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5&&!tile.classList.contains('zoom'))step(dx<0?1:-1)});
  const order=E('a','g-btn primary',svg(ICON.chat),E('span','','Porosit në WhatsApp'));order.target='_blank';order.rel='noopener';
  const update=()=>{order.href=orderURL(product,selection,brand)};update();
  const save=E('button','g-btn ghost g-save',svg(ICON.heart),E('span','',' Ruaj në listë'));save.type='button';save.onclick=()=>toggleSave(product);
  const body=E('div','g-sheet-body',E('small','',product.category),E('h2','',product.name));
  if(noteOf(product))body.append(E('p','g-note',noteOf(product)));
  const price=priceBlock(product,'g-price');if(price)body.append(price);
  if(product.description)body.append(E('p','g-desc',product.description));
  for(const item of propertiesOf(product))body.append(choice(item.values,selection,item.key,item.name,()=>{update();showPhoto()}));
  body.append(E('div','g-actions',order,save));
  sheet.replaceChildren(E('div','g-sheet-in',E('span','g-grip'),tile,body));sync();
 }

 function openDrawer(){renderDrawer();open(drawer)}
 function renderDrawer(){
  const items=list.map(id=>byId.get(id)).filter(Boolean);
  const head=E('div','g-dh',E('h2','','Lista ime'),Object.assign(E('button','g-x',svg(ICON.close)),{type:'button',onclick:()=>close(drawer)}));
  const rows=E('div','g-dl');
  for(const product of items){
   const selection=selectionOf(product),row=E('div','g-item'),thumbImg=Object.assign(element('img'),{src:imageURL(photoOf(product,selection)),alt:''}),thumb=E('span','g-item-img',thumbImg);
   const info=E('div','g-item-info',E('strong','',product.name));
   const pick=(values,key,label)=>{const select=element('select');select.setAttribute('aria-label',label+' për '+product.name);for(const value of values)select.append(new Option(value,value));select.value=selectedOf(selection,key);select.onchange=()=>{pickOption(selection,key,select.value);thumbImg.src=imageURL(photoOf(product,selection));persist();renderDrawerFoot()};return select};
   const pickers=propertiesOf(product).filter(item=>item.values.length>1);
   if(pickers.length){const controls=E('div','g-item-sel');for(const item of pickers)controls.append(pick(item.values,item.key,item.name));info.append(controls)}
   else info.append(E('span','g-sub',[noteOf(product),selection.variant,selection.color,...orderParts(product,selection)].filter(Boolean).join(' · ')||product.category));
   const remove=E('button','g-rm','×');remove.type='button';remove.setAttribute('aria-label','Hiq '+product.name);remove.onclick=()=>{toggleSave(product);renderDrawer()};
   row.append(thumb,info,remove);rows.append(row);
  }
  if(!items.length)rows.append(E('p','g-empty-list','Lista është bosh. Shtypni ♡ te produktet që ju pëlqejnë, pastaj dërgojini të gjitha me një prekje.'));
  const send=E('a','g-btn primary',svg(ICON.chat),E('span','','Dërgo listën në WhatsApp'));send.target='_blank';send.rel='noopener';
  const wipe=E('button','g-link','Pastro listën');wipe.type='button';wipe.onclick=()=>{list=[];persist();sync();renderDrawer()};
  renderDrawerFoot.update=()=>{send.href=items.length?listURL(brand,items.map(product=>({text:orderDetail(product,selectionOf(product)),link:pageLink(product)}))):'#';send.style.opacity=items.length?1:.4;send.style.pointerEvents=items.length?'':'none'};
  renderDrawerFoot();
  drawer.replaceChildren(E('div','g-drawer-in',head,rows,E('div','g-df',send,items.length?wipe:E('span'))));
 }
 function renderDrawerFoot(){renderDrawerFoot.update?.()}
 listBtn.onclick=fab.onclick=openDrawer;
 addEventListener('keydown',event=>{if(!sheet.open)return;if(event.key==='ArrowRight')step(1);if(event.key==='ArrowLeft')step(-1)});
 addEventListener('scroll',()=>top.classList.toggle('on',scrollY>12),{passive:true});

 render();show(0);sync();
 const linked=products.find(product=>product.id===linkedProductId());   // a shared product link (?p=<id>) opens that product once the loading screen is gone
 if(linked)RekaLoader.whenHidden(()=>openSheet(linked,products));
 if(picks.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>{if(!document.hidden&&!sheet.open&&!drawer.open)show((pick+1)%picks.length)},4800);
 await Promise.race([Promise.all([...root.querySelectorAll('.g-grid img')].slice(0,4).map(image=>image.decode().catch(()=>{}))),new Promise(done=>setTimeout(done,2500))]);
}
