import {applyTheme,element,loadCatalog,imageURL} from './theme.js';
import {buildOptions,cardStyleName,createCard,initialSelection,noteOf,orderURL,waHref} from './card.js';

const $=selector=>document.querySelector(selector);
const norm=value=>String(value||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const mode=(new URLSearchParams(location.search).get('catalog')||document.body.dataset.catalog)==='bars'?'bars':'restaurant';
const COPY={
 restaurant:{title:'Pajisje profesionale për kuzhinën tuaj',doc:'Reka Horeca — Katalogu i produkteve'},
 bars:{title:'Pajisje profesionale për barin tuaj',doc:'Reka Horeca — Katalogu Bars i produkteve'}
}[mode];

let products=[],category='',style='slate';
const selections=new Map(),nodes=new Map();
const sheet=$('#sheet'),host=$('#products'),filters=$('#filters'),search=$('#search');

const reveal='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('in');reveal.unobserve(entry.target)}},{rootMargin:'0px 0px -6% 0px'}):null;
const EMPTY_ICON='<svg class="empty-icon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="28" cy="28" r="16"/><path d="m40 40 16 16"/></svg>';
const selectionOf=product=>{if(!selections.has(product.id))selections.set(product.id,initialSelection(product));return selections.get(product.id)};

function cardFor(product,eager=false){
 const card=createCard(product,{style,selection:selectionOf(product),eager,onOpen:openSheet});
 nodes.set(product.id,card);
 if(reveal){card.classList.add('reveal');reveal.observe(card)}
 return card;
}

function render(){
 const query=norm(search.value.trim());
 const shown=products.filter(product=>(!category||category===product.category)&&norm(product.name+' '+product.description+' '+product.category+' '+product.variants.join(' ')+' '+noteOf(product)).includes(query));
 const grouped=!category&&!query,groups=new Map();
 for(const product of shown){const key=grouped?product.category:'';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(product)}
 host.replaceChildren();nodes.clear();
 let index=0;
 for(const [name,items] of groups){
  const block=element('section','','cat-block'),grid=element('div','','grid');
  if(name){const head=element('div','','cat-head');head.append(element('h2',name),element('span',String(items.length)));block.append(head)}
  for(const product of items)grid.append(cardFor(product,index++<4));
  block.append(grid);host.append(block);
 }
 $('#count').textContent=shown.length+' produkte';$('#clear').hidden=!search.value;
 $('#empty').hidden=!!shown.length;
 if(!shown.length)showEmpty('Nuk u gjet asnjë produkt.','Provoni një emër tjetër ose shfaqni të gjitha kategoritë.','Pastro kërkimin',resetFilters);
}

function showEmpty(title,text,action,handler){
 const box=$('#empty');box.hidden=false;box.replaceChildren();
 box.insertAdjacentHTML('afterbegin',EMPTY_ICON);
 const button=element('button',action,'btn');button.type='button';button.onclick=handler;
 box.append(element('h3',title),element('p',text),button);
}

// Spotlight: products flagged "featured" in the CMS (max 4); otherwise the top 4 by priority.
function renderSpotlight(){
 const row=$('#spot'),featured=products.filter(product=>product.featured).slice(0,4),picks=featured.length?featured:products.slice(0,4);
 row.replaceChildren();row.hidden=!picks.length;
 for(const product of picks){
  const card=element('button','','spot-card'),picture=element('span','','spot-img'),image=element('img');
  card.type='button';image.src=imageURL(product.image);image.alt='';image.decoding='async';picture.append(image);
  card.append(picture,element('span',product.name,'spot-name'),element('span','Shiko më shumë ›','spot-cta'));
  card.onclick=()=>openSheet(product);row.append(card);
 }
}

function resetFilters(){search.value='';setCategory('')}
function setCategory(name){category=name;for(const button of filters.children)button.setAttribute('aria-pressed',String(button.dataset.name===name));render()}

function openSheet(product){
 const selection=selectionOf(product);
 const close=element('button','×','sheet-close');close.type='button';close.setAttribute('aria-label','Mbyll');close.onclick=()=>sheet.close();
 const picture=element('div','','sheet-image'),image=element('img');image.src=imageURL(product.image);image.alt=product.name;picture.append(image,close);
 const order=element('a','','order');order.target='_blank';order.rel='noopener';order.append(element('span','Porosit në WhatsApp'));
 const update=()=>{order.href=orderURL(product,selection)};update();
 const body=element('div','','sheet-body');
 body.append(element('p',product.category,'sheet-cat'),element('h2',product.name));
 if(noteOf(product))body.append(element('p',noteOf(product),'sheet-note'));
 if(product.description)body.append(element('p',product.description,'sheet-desc'));
 body.append(buildOptions(product,selection,update),order);
 const inner=element('div','','sheet-inner');inner.append(picture,body);
 sheet.replaceChildren(inner);sheet.showModal();
 sheet.onclose=()=>{const old=nodes.get(product.id);if(old)old.replaceWith(cardFor(product))};
}
sheet.addEventListener('click',event=>{if(event.target===sheet)sheet.close()});

search.oninput=render;
$('#clear').onclick=()=>{search.value='';search.focus();render()};
for(const link of document.querySelectorAll('[data-wa]'))link.href=waHref('Përshëndetje Reka Horeca! Dua informacion për produktet.');
addEventListener('scroll',()=>$('#fab').classList.toggle('show',scrollY>520),{passive:true});

const waitFor=image=>image.decode().catch(()=>{});

try{
 const catalog=await loadCatalog(mode);
 applyTheme(catalog.theme);style=cardStyleName(catalog.cardStyle);
 document.title=COPY.doc;$('#title').innerHTML=COPY.title+'<span>.</span>';
 products=catalog.products.filter(product=>product.visible).sort((a,b)=>b.priority-a.priority);
 const names=[...new Set(products.map(product=>product.category))];
 for(const name of ['',...names]){
  const button=element('button','','');button.type='button';button.dataset.name=name;button.setAttribute('aria-pressed',String(name===category));
  button.append(name||'Të gjitha',element('small',String(name?products.filter(product=>product.category===name).length:products.length)));
  button.onclick=()=>{setCategory(name);scrollTo({top:Math.max(0,$('#katalogu').offsetTop-1),behavior:'smooth'})};
  filters.append(button);
 }
 renderSpotlight();
 render();
 // Hold the cat until the first row of photos is in, but never longer than 2.5 s.
 await Promise.race([Promise.all([...host.querySelectorAll('img')].slice(0,4).map(waitFor)),new Promise(done=>setTimeout(done,2500))]);
}catch(error){
 console.error(error);$('#count').textContent='';
 showEmpty('Katalogu nuk u ngarkua.','Kontrolloni lidhjen me internetin dhe provoni përsëri.','Provo përsëri',()=>location.reload());
}
RekaLoader.hide(900);
