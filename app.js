import {loadCatalog,sharedSlug} from './theme.js';
import {profileOf} from './brand.js';
import {startTracking,watchContacts} from './track.js';
import {applyFonts} from './mode.js';
import {fontsOf} from './fonts.js';

// Picks the page design. The CMS ("Dizajni i faqes") stores it as catalog.layout; ?layout=martini|gallery|classic previews another one without publishing.
const params=new URLSearchParams(location.search);
const requested=params.get('catalog')||document.body.dataset.catalog;
let catalog=null;
try{catalog=await loadCatalog(requested)}catch(error){console.error(error)}
// The fonts chosen in the CMS (Shkrimi), applied before the design starts so the first paint already uses them.
if(catalog)applyFonts(document.documentElement,fontsOf(catalog));
// Custom catalogues carry their own skin; Restaurant and Bars are chosen by the page.
const mode=(catalog?.skin||requested)==='bars'?'bars':'restaurant';
// Google Analytics (does nothing on a page without the Google tag): which catalogue, which business and which design the events belong to.
const layout=catalog?params.get('layout')||catalog.layout:'';
startTracking({catalogue:sharedSlug()||document.body.dataset.catalog,business:profileOf(catalog).id,design:layout==='martini'||layout==='gallery'?layout:'classic'});watchContacts();
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
