// "Martini" page design: Martini&K's hero, cards and footer with the Galeri catalogue experience (sections, search, categories, saved list).
// Same catalog.json as the other designs. Pure logic lives in martini-core.js; this file is the DOM. Business details are fixed (see MARTINI).
import {element,imageURL,sharedSlug} from './theme.js';
import {applyLook,currentLook,lookFor,luminance,modeButton,saveChoice,MODE_KEY} from './mode.js';
import {MARTINI,MARTINI_DEFAULTS,MARTINI_PRESETS,MARTINI_TEXTS,martiniTheme,martiniTexts,martiniTokens,spotlightOf,searchProducts,categoryNames,groupByCategory,splitDescription,cleanSize,noteOf,orderLine,orderURL,listURL,generalURL,readList,saveList} from './martini-core.js';

export {MARTINI_DEFAULTS,MARTINI_PRESETS,MARTINI_TEXTS,martiniTheme,martiniTexts};

// Paints the palette onto a root element (the live page, or a CMS preview stage); returns the page colours.
export function paintMartini(root,theme){
 const tokens=martiniTokens(theme);
 root.classList.add('m');root.dataset.tone=luminance(tokens.paper)<.18?'dark':'light';
 for(const [name,value] of Object.entries(tokens))root.style.setProperty('--'+name,value);
 return tokens;
}

// Fonts + stylesheet, loaded once (the CMS loads them only when the Martini design is chosen).
let styles;
export function martiniStyles(){
 return styles||=Promise.all([
  ['https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500..800;1,9..144,500..700&family=Nunito:wght@400;600;700;800&display=swap',2500],
  [new URL('martini.css',import.meta.url).href,6000]
 ].map(([href,limit])=>new Promise(done=>{
  const link=element('link');link.rel='stylesheet';link.href=href;link.onload=link.onerror=()=>done();setTimeout(done,limit);document.head.append(link);
 })));
}

const E=(tag,cls='',...kids)=>{const node=element(tag,'',cls);node.append(...kids);return node};
// Icons and the mark are constant strings, never user data.
const svg=(path,cls='')=>{const wrap=element('span','','m-ico '+cls);wrap.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg>';return wrap};
const ICON={
 heart:'<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.4 4.8 6.6 4.8c2 0 3.6 1.1 5.4 3.2 1.8-2.1 3.4-3.2 5.4-3.2 3.2 0 5.1 3.2 3.9 6.5-1.8 4.6-9.3 9.2-9.3 9.2z"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',list:'<path d="M5 7h14M5 12h14M5 17h9"/>',down:'<path d="M12 5v14M6 13l6 6 6-6"/>'
};
const markNode=()=>{const holder=element('span');holder.innerHTML='<svg class="m-mark" viewBox="0 0 48 52" aria-hidden="true"><path d="M24 2 44 13.5v25L24 50 4 38.5v-25z" stroke-width="3"/><path d="M12.5 35V18l6.5 8.5L25.5 18v17M31 18v17M38.5 18 31 26.5l7.5 8.5" stroke-width="3.2"/></svg>';return holder.firstChild};
const logo=()=>{const link=E('a','m-logo',markNode(),E('span','m-word','MARTINI',E('span','','&'),'K'));link.href='#';link.setAttribute('aria-label',MARTINI.name+', kreu');return link};
const tear=()=>{const holder=element('span');holder.innerHTML='<svg class="m-tear" viewBox="0 0 1200 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30V14L40 8 80 17 120 9 160 15 200 6 240 14 280 8 320 17 360 10 400 16 440 7 480 14 520 9 560 17 600 8 640 15 680 11 720 17 760 8 800 14 840 7 880 16 920 10 960 17 1000 8 1040 14 1080 9 1120 16 1160 8 1200 13V30Z"/></svg>';return holder.firstChild};
// The last two words of the title (the last one when it has fewer than three) are set in italic mint.
function titleNode(text){
 const words=text.trim().split(/\s+/),k=words.length>=3?2:1,title=E('h1','m-title');
 title.append(words.length>k?words.slice(0,-k).join(' ')+' ':'',E('em','',words.slice(-k).join(' ')));return title;
}
const sizesLine=product=>{const sizes=(product.variants||[]).map(cleanSize);return sizes.length>3?sizes.slice(0,3).join(' · ')+' +'+(sizes.length-3):sizes.join(' · ')};

// One product card; used by the public page and by the CMS previews. Martini's card plus a ♡ in the corner of the photo.
export function createMartiniCard(product,{index=0,saved=false,onOpen,onSave}={}){
 const card=E('article','m-card'),open=E('button','m-open'),photo=E('span','m-ph');
 card.dataset.id=product.id;open.type='button';
 const placeholder=()=>{photo.replaceChildren();photo.classList.add('empty');photo.dataset.initial=(product.category||product.name||'?')[0]};
 if(product.image){const image=new Image();image.alt='';image.width=800;image.height=600;image.decoding='async';image.loading=index<4?'eager':'lazy';image.onerror=placeholder;image.src=imageURL(product.image);photo.append(image)}else placeholder();
 const pack=noteOf(product)||sizesLine(product);
 const text=E('span','m-tx',E('span','m-cat',product.category),E('span','m-nm',product.name));if(pack)text.append(E('span','m-pk',pack));
 open.append(photo,text);open.onclick=()=>onOpen?.(product);card.append(open);
 if(onSave){
  const heart=E('button','m-heart',svg(ICON.heart));heart.type='button';heart.dataset.save=product.id;
  heart.setAttribute('aria-label','Ruaj '+product.name+' në listë');heart.setAttribute('aria-pressed',String(saved));
  heart.onclick=event=>{event.stopPropagation();onSave(product);heart.classList.remove('pop');void heart.offsetWidth;heart.classList.add('pop')};
  card.append(heart);
 }
 return card;
}

// Compact static page for the CMS Design tab: header, hero, chips and a few cards, painted with the draft palette.
export function createMartiniMock(stage,{theme,products,cards=products.slice(0,2),texts}){
 paintMartini(stage,theme);stage.classList.add('m-mock');stage.replaceChildren();
 const art=E('div','m-art');
 spotlightOf(products.filter(product=>product.image),3).forEach((product,i)=>{const image=new Image();image.alt='';image.src=imageURL(product.image);art.append(E('figure','m-fl '+'abc'[i],image))});
 const chips=E('div','m-chips');['Të gjitha','Kategoria 2','Kategoria 3'].forEach((label,i)=>{const chip=E('span','m-chip',label);chip.setAttribute('aria-pressed',String(!i));chips.append(chip)});
 stage.append(
  E('div','m-top',E('div','m-wrap',logo(),E('span','m-list-btn',svg(ICON.list),'Lista ime'))),
  E('div','m-hero',E('div','m-wrap',E('div','m-hero-in',E('div','',E('p','m-eyebrow',MARTINI.since),titleNode(texts.title),E('p','m-intro',texts.intro)),art))),
  E('div','m-bar',chips),
  E('div','m-grid',...cards.map((product,i)=>createMartiniCard(product,{index:i,onOpen:()=>{},onSave:()=>{}})))
 );
}

export async function startMartini(catalog){
 for(const link of [...document.querySelectorAll('link[rel=stylesheet]')])if(!/loader\.css/.test(link.getAttribute('href')))link.remove();
 await martiniStyles();
 const products=catalog.products.filter(product=>product.visible).sort((a,b)=>b.priority-a.priority);
 const texts=martiniTexts(catalog),names=categoryNames(catalog,products),reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.title=MARTINI.name+' — Katalogu i produkteve';
 const root=E('div','m');document.body.className='';document.body.removeAttribute('style');document.body.replaceChildren(root);
 let category='',query='',shown=products,firstPaint=true;
 // Saved list ("Lista ime"): remembered in the browser per catalogue; hearts, header count and floating button always follow `list`.
 const byId=new Map(products.map(product=>[product.id,product])),KEY='martini-list-'+(sharedSlug()||'martini'),selections=new Map();
 let store=null;try{store=localStorage}catch{}   // even reading `localStorage` can throw when storage is blocked
 const selectionOf=product=>{if(!selections.has(product.id))selections.set(product.id,{variant:cleanSize(product.variants?.[0]||''),color:product.colors?.[0]||''});return selections.get(product.id)};
 const savedItems=readList(store,KEY,new Set(byId.keys()));
 for(const item of savedItems){const product=byId.get(item.id),selection=selectionOf(product);if((product.variants||[]).map(cleanSize).includes(item.variant))selection.variant=item.variant;if((product.colors||[]).includes(item.color))selection.color=item.color}   // a size or colour that no longer exists falls back to the first
 let list=savedItems.map(item=>item.id);
 const persist=()=>saveList(store,KEY,list.map(id=>({id,...selectionOf(byId.get(id))})));
 const toggleSave=product=>{list=list.includes(product.id)?list.filter(id=>id!==product.id):[...list,product.id];persist();sync()};

 // Light or dark: the catalogue's own look unless the visitor chose otherwise (the button in the header).
 const look=lookFor(catalog,'martini',martiniTheme(catalog.theme));
 const paint=dark=>{const tokens=paintMartini(root,look.themes[dark?'dark':'light']);document.body.style.background=tokens.paper;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',tokens.forest);applyLook(dark)};
 const dark0=currentLook(look)==='dark';paint(dark0);

 // Header
 const wa=E('a','m-wa',svg(ICON.chat),E('span','lbl','WhatsApp'));wa.href=generalURL();wa.target='_blank';wa.rel='noopener';wa.setAttribute('aria-label','Na shkruani në WhatsApp');
 const listBtn=E('button','m-list-btn',svg(ICON.list),E('span','lbl','Lista ime'),E('b','','0'));listBtn.type='button';listBtn.setAttribute('aria-label','Lista ime');
 const toggle=look.toggle?modeButton({dark:dark0,onToggle:dark=>{saveChoice(MODE_KEY,dark?'dark':'light');paint(dark)}}):null;
 const top=E('header','m-top',E('div','m-wrap',logo(),E('div','m-tools',...[toggle,wa,listBtn].filter(Boolean))));

 // Hero: headline, stamps, counters, floating products and the featured strip
 const picks=spotlightOf(products,5);
 const art=E('div','m-art');art.setAttribute('aria-hidden','true');
 picks.filter(product=>product.image).slice(0,3).forEach((product,i)=>{const image=new Image();image.alt='';image.width=800;image.height=600;image.src=imageURL(product.image);art.append(E('figure','m-fl '+'abc'[i],image))});
 if(!art.children.length)art.hidden=true;
 const cta=E('a','m-cta','Shfleto katalogun ',svg(ICON.down));cta.href='#katalogu';
 const stats=E('div','m-stats',...MARTINI.stats.map(stat=>{const box=E('div','m-stat',E('b','',stat.to+stat.suffix),E('span','',stat.label));box.dataset.to=stat.to;box.dataset.suffix=stat.suffix;return box}));
 const spot=E('div','m-spot'),spotWrap=E('div','m-spot-wrap',E('p','m-eyebrow','Të përzgjedhura'),spot);
 spot.append(...picks.map((product,i)=>createMartiniCard(product,{index:i,saved:list.includes(product.id),onOpen:item=>openSheet(item,picks),onSave:toggleSave})));
 if(!picks.length)spotWrap.hidden=true;
 const hero=E('section','m-hero',E('div','m-wrap',E('div','m-hero-in',E('div','',E('p','m-eyebrow',MARTINI.since),titleNode(texts.title),E('p','m-intro',texts.intro),E('ul','m-stamps',...MARTINI.stamps.map(stamp=>E('li','',stamp))),cta,stats),art),spotWrap),tear());

 // Search + categories
 const input=element('input');input.type='search';input.placeholder='Kërkoni një produkt…';input.autocomplete='off';input.setAttribute('aria-label','Kërkoni një produkt');
 const clear=E('button','m-clear','×');clear.type='button';clear.hidden=true;clear.setAttribute('aria-label','Pastro kërkimin');
 const count=E('span','m-count');count.setAttribute('role','status');count.setAttribute('aria-live','polite');
 const find=E('div','m-wrap m-find',E('h2','m-h2','Produktet'),E('label','m-search',svg(ICON.search),input,clear,count));
 const chips=E('div','m-chips'),chipFor=new Map();chips.setAttribute('role','group');chips.setAttribute('aria-label','Kategoritë e produkteve');
 const paintChips=()=>{for(const [name,chip] of chipFor)chip.setAttribute('aria-pressed',String(name===category))};
 for(const name of ['',...names]){
  const total=name?products.filter(product=>product.category===name).length:products.length;
  const chip=E('button','m-chip',name||'Të gjitha',E('small','',String(total)));chip.type='button';
  chip.onclick=()=>{category=name;paintChips();refresh();chip.scrollIntoView({inline:'center',block:'nearest',behavior:reduceMotion()?'auto':'smooth'})};
  chipFor.set(name,chip);chips.append(chip);
 }
 const bar=E('div','m-bar',E('div','m-wrap',chips));
 const host=E('main','m-wrap m-main'),empty=E('div','m-wrap m-empty');host.id='katalogu';empty.hidden=true;

 // Footer + floating list button + dialogs
 const external=link=>{link.target='_blank';link.rel='noopener';return link};
 const waLink=external(E('a','','Na shkruani në WhatsApp',E('small','','Porosi dhe pyetje')));waLink.href=generalURL();
 const tel=E('a','',MARTINI.phoneLabel,E('small','','Telefononi'));tel.href='tel:+'+MARTINI.phone;
 const mail=E('a','',MARTINI.email,E('small','','Email'));mail.href='mailto:'+MARTINI.email;
 const social=E('div','m-social',...[['Facebook',MARTINI.facebook],['Instagram',MARTINI.instagram],['LinkedIn',MARTINI.linkedin]].map(([label,href])=>{const link=external(E('a','',label));link.href=href;return link}));
 const foot=E('footer','m-foot',E('div','m-wrap',E('div','m-foot-in',E('div','',logo(),E('p','',MARTINI.blurb),E('p','m-pow',MARTINI.tagline)),E('div','m-links',waLink,tel,mail,E('address','',MARTINI.address)),social),E('p','m-copy','© '+new Date().getFullYear()+' '+MARTINI.name+' Shpk')));
 const fab=E('button','m-fab',svg(ICON.list),E('span','','Lista ime · '),E('b','','0'));fab.type='button';
 const sheet=E('dialog','m-sheet'),drawer=E('dialog','m-drawer');sheet.setAttribute('aria-label','Detajet e produktit');drawer.setAttribute('aria-label','Lista ime');
 root.append(top,hero,find,bar,host,empty,foot,fab,sheet,drawer);

 /* ---------- rendering ---------- */
 const seen=!reduceMotion()&&'IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('in');seen.unobserve(entry.target)}},{rootMargin:'0px 0px -5% 0px'}):null;
 const reveal=cards=>{if(!seen)return;cards.forEach((card,i)=>{card.classList.add('rise');card.style.animationDelay=(i%4)*70+'ms';seen.observe(card)})};
 function render(){
  shown=searchProducts(products,{query,category});
  const sections=!category&&!query.trim()?groupByCategory(shown,names):(shown.length?[['',shown]]:[]);
  host.replaceChildren();let index=0;
  for(const [name,items] of sections){
   const block=E('section','m-block'),grid=E('div','m-grid');
   if(name)block.append(E('div','m-head',E('i','m-dia'),E('h2','',name),E('span','m-n',String(items.length))));
   for(const product of items)grid.append(createMartiniCard(product,{index:index++,saved:list.includes(product.id),onOpen:item=>openSheet(item,shown),onSave:toggleSave}));
   block.append(grid);host.append(block);
  }
  count.textContent=shown.length+(shown.length===1?' produkt':' produkte');clear.hidden=!query;
  host.hidden=!shown.length;empty.hidden=!!shown.length;
  if(!shown.length){
   const reset=E('button','m-btn mint','Pastro kërkimin'),ask=external(E('a','m-btn ghost','Pyetni në WhatsApp'));reset.type='button';ask.href=generalURL();
   reset.onclick=()=>{input.value=query='';category='';paintChips();refresh();input.focus()};   // focus moves on, because this button is hidden along with the empty state
   empty.replaceChildren(E('h3','','Nuk u gjet asnjë produkt.'),E('p','','Provoni një emër tjetër ose shfaqni të gjitha kategoritë.'),reset,ask);
  }
  if(firstPaint){firstPaint=false;reveal([...host.querySelectorAll('.m-card'),...spot.children])}   // rise-in on the first paint only, so typing and chips do not blink
 }
 // After a change the visitor made, bring the start of the results into view below the sticky bars.
 const bars=()=>top.offsetHeight+bar.offsetHeight;
 function refresh(){render();if(host.getBoundingClientRect().top<bars())host.scrollIntoView({block:'start',behavior:'instant'})}
 input.oninput=()=>{query=input.value;refresh()};
 input.onkeydown=event=>{if(event.key==='Escape'&&input.value){input.value=query='';refresh()}};
 clear.onclick=()=>{input.value=query='';refresh();input.focus()};

 function sync(){
  for(const heart of root.querySelectorAll('[data-save]'))heart.setAttribute('aria-pressed',String(list.includes(heart.dataset.save)));
  listBtn.lastChild.textContent=fab.querySelector('b').textContent=String(list.length);
  listBtn.setAttribute('aria-label','Lista ime, '+list.length+(list.length===1?' produkt':' produkte'));
  fab.classList.toggle('on',list.length>0&&!sheet.open&&!drawer.open);
  const saveBtn=sheet.querySelector('.m-save');
  if(saveBtn){const on=list.includes(sheetList[sheetIndex]?.id);saveBtn.setAttribute('aria-pressed',String(on));saveBtn.lastChild.textContent=on?'E ruajtur':'Ruaj në listë'}
 }
 listBtn.onclick=fab.onclick=()=>openDrawer();

 // The sticky header + chip bar height, so anchors and scrollIntoView land below them.
 const setStack=()=>document.documentElement.style.setProperty('--stack',bars()+'px');
 setStack();addEventListener('resize',setStack);if('ResizeObserver' in window){const watcher=new ResizeObserver(setStack);watcher.observe(bar);watcher.observe(top)}

 // Counters tick up once when they scroll into view (final values stay in place without motion).
 if(seen){
  const counters=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){counters.unobserve(entry.target);countUp(entry.target)}},{threshold:.6});
  const countUp=stat=>{
   const out=stat.querySelector('b'),to=Number(stat.dataset.to),end=stat.dataset.suffix||'',t0=performance.now();
   const step=now=>{const k=Math.min(1,(now-t0)/1300);out.textContent=Math.round(to*(1-(1-k)**3))+end;if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step);
  };
  stats.querySelectorAll('.m-stat').forEach(stat=>{stat.querySelector('b').textContent='0'+(stat.dataset.suffix||'');counters.observe(stat)});
  setTimeout(()=>stats.querySelectorAll('.m-stat').forEach(stat=>{const out=stat.querySelector('b');if(out.textContent==='0'+(stat.dataset.suffix||''))out.textContent=stat.dataset.to+(stat.dataset.suffix||'')}),6000);   // safety net if one never scrolled into view
 }


 /* ---------- dialogs: product sheet and the list drawer ---------- */
 const openers=new Map();
 const open=dialog=>{openers.set(dialog,document.activeElement);dialog.showModal();requestAnimationFrame(()=>requestAnimationFrame(()=>dialog.classList.add('on')));sync()};
 const close=dialog=>{if(!dialog.open)return;dialog.classList.remove('on');setTimeout(()=>dialog.close(),reduceMotion()?0:260)};
 for(const dialog of [sheet,drawer]){
  dialog.addEventListener('cancel',event=>{event.preventDefault();close(dialog)});
  dialog.addEventListener('click',event=>{if(event.target===dialog)close(dialog)});
  dialog.addEventListener('close',()=>{sync();const from=openers.get(dialog);openers.delete(dialog);if(from?.isConnected)from.focus()});   // focus goes back to what opened it
 }
 const choice=(values,selection,key,label,onChange)=>{
  const box=E('div','m-opt',E('span','m-opt-label',label)),row=E('div','m-opt-row');row.setAttribute('role','radiogroup');row.setAttribute('aria-label',label);
  for(const value of values){const chip=E('button','m-opt-chip',value);chip.type='button';chip.setAttribute('role','radio');chip.setAttribute('aria-checked',String(value===selection[key]));
   chip.onclick=()=>{selection[key]=value;for(const item of row.children)item.setAttribute('aria-checked',String(item===chip));persist();onChange?.()};row.append(chip)}
  // radio-group keys: arrows move the choice inside the group, and must not step to another product
  row.addEventListener('keydown',event=>{
   const forward=event.key==='ArrowRight'||event.key==='ArrowDown',back=event.key==='ArrowLeft'||event.key==='ArrowUp';
   if(!forward&&!back)return;
   const chips=[...row.children],at=chips.indexOf(document.activeElement);if(at<0)return;
   event.preventDefault();event.stopPropagation();
   const next=chips[(at+(forward?1:-1)+chips.length)%chips.length];next.focus();next.click();
  });
  box.append(row);return box;
 };
 let sheetList=products,sheetIndex=0;
 function openSheet(product,from=shown){sheetList=from.length?from:products;sheetIndex=Math.max(0,sheetList.indexOf(product));renderSheet();if(!sheet.open)open(sheet)}
 const step=delta=>{sheetIndex=(sheetIndex+delta+sheetList.length)%sheetList.length;renderSheet();(sheet.querySelector('.m-nav.'+(delta<0?'l':'r'))||sheet.querySelector('.m-x')).focus()};
 function renderSheet(){
  const product=sheetList[sheetIndex],selection=selectionOf(product),{rows,text}=splitDescription(product.description),variants=(product.variants||[]).map(cleanSize),colors=product.colors||[];
  const specs=[...rows];
  if(variants.length===1&&!rows.some(([label])=>label==='Përmasa'))specs.push(['Përmasa',variants[0]]);
  if(colors.length===1&&!rows.some(([label])=>label==='Ngjyra'))specs.push(['Ngjyra',colors[0]]);
  const photo=E('div','m-sh-ph'),closeBtn=E('button','m-x','×');closeBtn.type='button';closeBtn.setAttribute('aria-label','Mbyll');closeBtn.onclick=()=>close(sheet);
  if(product.image){const image=new Image();image.alt=product.name;image.src=imageURL(product.image);photo.append(image)}else{photo.classList.add('empty');photo.dataset.initial=(product.category||product.name||'?')[0]}
  photo.append(closeBtn);
  if(sheetList.length>1){
   for(const [delta,label,path] of [[-1,'Para','<path d="m14 6-6 6 6 6"/>'],[1,'Pas','<path d="m10 6 6 6-6 6"/>']]){const button=E('button','m-nav '+(delta<0?'l':'r'),svg(path));button.type='button';button.setAttribute('aria-label',label);button.onclick=event=>{event.stopPropagation();step(delta)};photo.append(button)}
   photo.append(E('span','m-pos',(sheetIndex+1)+' / '+sheetList.length));
  }
  let x0=0,y0=0;
  photo.addEventListener('touchstart',event=>{x0=event.touches[0].clientX;y0=event.touches[0].clientY},{passive:true});
  photo.addEventListener('touchend',event=>{const dx=event.changedTouches[0].clientX-x0,dy=event.changedTouches[0].clientY-y0;if(sheetList.length>1&&Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1)});
  const name=E('h2','m-sh-name',product.name);name.id='m-sh-name';
  const body=E('div','m-sh-body',E('p','m-cat',product.category),name);
  const note=noteOf(product);if(note&&!specs.some(([,value])=>value===note))body.append(E('p','m-sh-note',note));
  if(specs.length){const dl=E('dl','m-specs');for(const [label,value] of specs)dl.append(E('div','',E('dt','',label),E('dd','',value)));body.append(dl)}
  if(text)body.append(E('p','m-desc',text));
  const order=E('a','m-btn mint',svg(ICON.chat),E('span','','Porosit në WhatsApp'));order.target='_blank';order.rel='noopener';
  const update=()=>{order.href=orderURL(product,selection);order.setAttribute('aria-label','Porosit '+orderLine(product,selection)+' në WhatsApp')};update();
  if(variants.length>1)body.append(choice(variants,selection,'variant','Përmasa',update));
  if(colors.length>1)body.append(choice(colors,selection,'color','Ngjyra',update));
  const save=E('button','m-btn ghost m-save',svg(ICON.heart),E('span','','Ruaj në listë'));save.type='button';save.onclick=()=>toggleSave(product);
  body.append(E('div','m-acts',order,save));
  sheet.setAttribute('aria-labelledby','m-sh-name');sheet.removeAttribute('aria-label');
  sheet.replaceChildren(E('div','m-sheet-in',photo,body));sync();
 }
 addEventListener('keydown',event=>{if(!sheet.open||sheetList.length<2)return;if(event.key==='ArrowRight')step(1);else if(event.key==='ArrowLeft')step(-1)});

 function openDrawer(){renderDrawer();open(drawer)}
 function renderDrawer(){
  const items=list.map(id=>byId.get(id)).filter(Boolean);
  const closeBtn=E('button','m-x','×');closeBtn.type='button';closeBtn.setAttribute('aria-label','Mbyll');closeBtn.onclick=()=>close(drawer);
  const rows=E('div','m-dl');
  const send=E('a','m-btn mint',svg(ICON.chat),E('span','','Dërgo listën në WhatsApp'));send.target='_blank';send.rel='noopener';
  const refreshSend=()=>{send.href=items.length?listURL(items.map(product=>({product,selection:selectionOf(product)}))):'#';send.setAttribute('aria-disabled',String(!items.length))};
  send.onclick=event=>{if(!items.length)event.preventDefault()};
  for(const product of items){
   const selection=selectionOf(product),thumb=E('span','m-item-img'),info=E('div','',E('strong','',product.name)),variants=(product.variants||[]).map(cleanSize),colors=product.colors||[];
   if(product.image){const image=new Image();image.alt='';image.src=imageURL(product.image);thumb.append(image)}
   const pick=(values,key,label)=>{const select=element('select');select.setAttribute('aria-label',label+' për '+product.name);for(const value of values)select.append(new Option(value,value));select.value=selection[key];select.onchange=()=>{selection[key]=select.value;persist();refreshSend()};return select};
   if(variants.length>1||colors.length>1){const controls=E('div','m-sel');if(variants.length>1)controls.append(pick(variants,'variant','Përmasa'));if(colors.length>1)controls.append(pick(colors,'color','Ngjyra'));info.append(controls)}
   else info.append(E('span','m-sub',[noteOf(product),selection.variant,selection.color].filter(Boolean).join(' · ')||product.category));
   const remove=E('button','m-rm','×');remove.type='button';remove.setAttribute('aria-label','Hiq '+product.name);
   remove.onclick=()=>{toggleSave(product);renderDrawer();(drawer.querySelector('.m-rm')||drawer.querySelector('.m-x')).focus()};
   rows.append(E('div','m-item',thumb,info,remove));
  }
  if(!items.length)rows.append(E('p','m-empty-list','Lista është bosh. Shtypni ♡ te produktet që ju pëlqejnë, pastaj dërgojini të gjitha me një prekje.'));
  const wipe=E('button','m-link','Pastro listën');wipe.type='button';wipe.onclick=()=>{list=[];persist();sync();renderDrawer();drawer.querySelector('.m-x').focus()};
  refreshSend();
  drawer.replaceChildren(E('div','m-dw',E('div','m-dh',E('h2','','Lista ime'),closeBtn),rows,E('div','m-df',send,items.length?wipe:E('span'))));
 }

 paintChips();render();sync();
 await Promise.race([Promise.all([...root.querySelectorAll('.m-grid img')].slice(0,4).map(image=>image.decode().catch(()=>{}))),new Promise(done=>setTimeout(done,2500))]);
}
