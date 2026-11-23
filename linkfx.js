// What a share link does on the page: scroll to the cards it points at, then ring them for a moment (the ring itself is CSS: .link-ring in cards.css,
// gallery.css and martini.css). Used by the three designs. `scrollTo` and `later` can be replaced so the timing is testable.
import {focusY} from './links.js';

export const RING_MS=3000,SETTLE_MS=800,AIM_TOLERANCE=40;
const move=(y,instant)=>window.scrollTo({top:y,behavior:instant||matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});

// cards: the page's card elements for the link's products. offset(): height of the sticky bars, read when needed (it changes with the screen size).
// The ring starts once the scroll has settled (a long smooth scroll would use it up), after one correction if the page moved (photos loading above).
// A card that is no longer in the page (a chip or a search redrew the list) is left alone.
export function playLink(cards,{offset=()=>0,scrollTo=move,later=setTimeout}={}){
 const present=()=>cards.filter(card=>card.isConnected);
 const aim=list=>focusY(list.map(card=>{const box=card.getBoundingClientRect();return {top:box.top+scrollY,bottom:box.bottom+scrollY}}),{viewport:innerHeight,offset:offset()});
 const first=present();if(!first.length)return;
 scrollTo(aim(first),false);
 later(()=>{
  const list=present();if(!list.length)return;
  const y=aim(list);if(Math.abs(y-scrollY)>AIM_TOLERANCE)scrollTo(y,true);
  for(const card of list)card.classList.add('link-ring');
  later(()=>{for(const card of list)card.classList.remove('link-ring')},RING_MS);
 },SETTLE_MS);
}
