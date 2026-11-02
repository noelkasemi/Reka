import {applyTheme,element,loadCatalog,imageURL} from './theme.js';

let products=[],category='Të gjitha';
const selected=new Map(),grid=document.querySelector('#products'),filters=document.querySelector('#filters');
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const cleanSize=value=>String(value).replace(/^[Øø]\s*/,'').trim();
const mode=new URLSearchParams(location.search).get('catalog')==='bars'||document.querySelector('.header-label')?.textContent.includes('BARS')?'bars':'restaurant';

function classifyImage(image,card){
 image.classList.add('loaded');
 const ratio=image.naturalWidth/image.naturalHeight;
 card.dataset.imageShape=ratio>1.35?'wide':ratio<.72?'tall':'balanced';
}

function render(){
 const query=norm(document.querySelector('#search').value.trim());
 const shown=products.filter(product=>(category==='Të gjitha'||category===product.category)&&norm(product.name+' '+product.description+' '+product.category+' '+product.variants.join(' ')).includes(query));
 grid.replaceChildren();document.querySelector('#count').textContent=shown.length+' produkte';document.querySelector('#empty').hidden=!!shown.length;
 shown.forEach((product,index)=>{
  const style={slate:'slate',ornate:'ornate',classic:'classic',standard:'slate',compact:'slate',poster:'slate',minimal:'classic'}[window.catalogCardStyle]||'slate';
  const card=element('article','','card '+style),picture=element('div','','product-image'),image=element('img');
  card.dataset.title=product.name.length>31?'long':product.name.length<17?'short':'normal';
  card.dataset.options=String(Number(Boolean(product.variants.length))+Number(Boolean(product.colors.length)));
  image.src=imageURL(product.image);image.alt=product.name;image.decoding='async';
  if(index<4){image.loading='eager';image.fetchPriority='high'}else{image.loading='lazy';image.fetchPriority='low'}
  image.onload=()=>classifyImage(image,card);if(image.complete&&image.naturalWidth)classifyImage(image,card);
  picture.append(image);
  const content=element('div','','card-body');content.append(element('p',product.category,'card-category'),element('h3',product.name));
  if(product.description){const more=element('details','','product-description');more.append(element('summary','Përshkrimi'),element('p',product.description));content.append(more)}
  const variants=element('div','','variant'),state=selected.get(product.id)||{variant:cleanSize(product.variants[0]||''),color:product.colors[0]||''};selected.set(product.id,state);
  const order=element('a','','order');order.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20.5 8H7M10 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg><span>Porosit</span>';order.target='_blank';order.rel='noopener';
  function update(){const detail=[product.name,product.note,state.variant,state.color].filter(Boolean).join(' · ');order.href='https://wa.me/355694050377?text='+encodeURIComponent('Përshëndetje Reka Horeca! Dëshiroj të porosis: '+detail+'. Ju lutem më informoni për çmimin dhe disponueshmërinë. Faleminderit!');order.setAttribute('aria-label','Porosit '+detail+' në WhatsApp')}
  function select(options,label,key){if(!options.length)return;const field=element('label',label,'variant-label'),select=element('select');select.setAttribute('aria-label',label+' — '+product.name);for(const option of options){const value=key==='variant'?cleanSize(option):option,item=new Option(value,value);item.selected=value===state[key];select.add(item)}select.onchange=()=>{state[key]=select.value;update()};field.append(select);variants.append(field)}
  select(product.variants,'Përmasa','variant');select(product.colors,'Ngjyra','color');if(product.note)variants.prepend(element('p',product.note,'variant-note'));
  update();content.append(variants,order);card.append(picture,content);grid.append(card);
 });
}

document.querySelector('#search').oninput=render;
document.querySelector('#reset').onclick=()=>{document.querySelector('#search').value='';filters.firstElementChild.click()};

try{
 const catalog=await loadCatalog(mode);applyTheme(catalog.theme);window.catalogCardStyle=catalog.cardStyle||'slate';
 if(mode==='bars'){document.title='Reka Horeca — Katalogu Bars i produkteve';document.querySelector('.header-label').textContent='KATALOG BARS';document.querySelector('.section-top h1').innerHTML='Katalogu Bars i produkteve<span>.</span>'}
 products=catalog.products.filter(product=>product.visible).sort((a,b)=>b.priority-a.priority);
 for(const name of ['Të gjitha',...new Set(products.map(product=>product.category))]){const button=element('button',name);button.type='button';button.setAttribute('aria-pressed',name===category);button.onclick=()=>{category=name;for(const item of filters.children)item.setAttribute('aria-pressed',item===button);render()};filters.append(button)}
 render();
}catch(error){console.error(error);document.querySelector('#count').textContent='Katalogu nuk u ngarkua. Rifreskoni faqen.'}
