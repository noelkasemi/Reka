import {loadCatalog} from './theme.js';

// Picks the page design. The CMS ("Dizajni i faqes") stores it as catalog.layout; ?layout=martini|gallery|classic previews another one without publishing.
const params=new URLSearchParams(location.search);
const requested=params.get('catalog')||document.body.dataset.catalog;
let catalog=null;
try{catalog=await loadCatalog(requested)}catch(error){console.error(error)}
// Custom catalogues carry their own skin; Restaurant and Bars are chosen by the page.
const mode=(catalog?.skin||requested)==='bars'?'bars':'restaurant';
if(catalog&&(params.get('layout')||catalog.layout)==='martini'){
 try{
  await (await import('./martini.js')).startMartini(catalog);
  RekaLoader.hide(900);
 }catch(error){
  // Same safety net as Galeri: fall back to the classic design.
  console.error(error);
  if(params.get('layout')!=='classic'){params.set('layout','classic');location.replace(location.pathname+'?'+params)}
 }
}else if(catalog&&(params.get('layout')||catalog.layout)==='gallery'){
 try{
  await (await import('./gallery.js')).startGallery(catalog,mode);
  RekaLoader.hide(900);
 }catch(error){
  // Safety net: never leave customers on a broken page; fall back to the classic design.
  console.error(error);
  if(params.get('layout')!=='classic'){params.set('layout','classic');location.replace(location.pathname+'?'+params)}
 }
}else (await import('./classic.js')).startClassic(catalog,mode);
