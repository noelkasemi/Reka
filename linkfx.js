// What a share link does on the page: scroll to the cards it points at, then lay a pulsing halo over each of them for a moment (the halo itself is CSS:
// .link-halo in cards.css, gallery.css and martini.css). Used by the three designs. `scrollTo`, `later` and `mark` can be replaced so the timing is testable.
import {focusY} from './links.js';

export const RING_MS=3000,WATCH_MS=250,POLL_MS=150,MAX_SETTLE_MS=4000,AIM_TOLERANCE=40,PAD=6;
// 'instant' is a real jump (the site's CSS makes 'auto' smooth); with reduce-motion the page's own setting is plain, so 'auto' jumps too.
const move=(y,instant)=>window.scrollTo({top:y,behavior:instant?'instant':matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
// The halo is a separate box laid over the card in page coordinates, not a style on the card: the Kornizë card is drawn with a CSS mask (which hides a shadow
// on the card itself), Hark has an arched inner shape, and custom frames clip. A plain rounded box around the card looks right on all of them.
const halo=card=>{
 const box=card.getBoundingClientRect(),element=document.createElement('div');
 element.className='link-halo';element.setAttribute('aria-hidden','true');
 Object.assign(element.style,{top:box.top+scrollY-PAD+'px',left:box.left+scrollX-PAD+'px',width:box.width+2*PAD+'px',height:box.height+2*PAD+'px'});
 // Inside the design's root (.g = Galeri, .m = Martini): that is where those designs define their colours, so the halo inherits the accent. Klasik uses :root, so body does.
 (card.closest('.g,.m')||document.body).append(element);
 return element;
};

// cards: the page's card elements for the link's products. offset(): height of the sticky bars, read when needed (it changes with the screen size).
// The halos start once the page has stopped scrolling (a long smooth scroll takes longer on a phone, and the halo would be used up on the way), after one
// correction if the page moved (photos loading above). A card that is no longer in the page (a chip or a search redrew the list) is left alone, and its halo goes.
export function playLink(cards,{offset=()=>0,scrollTo=move,later=setTimeout,mark=halo}={}){
 const present=()=>cards.filter(card=>card.isConnected);
 const aim=list=>focusY(list.map(card=>{const box=card.getBoundingClientRect();return {top:box.top+scrollY,bottom:box.bottom+scrollY}}),{viewport:innerHeight,offset:offset()});
 const first=present();if(!first.length)return;
 scrollTo(aim(first),false);
 const ring=()=>{
  const list=present();if(!list.length)return;
  const y=aim(list);if(Math.abs(y-scrollY)>AIM_TOLERANCE)scrollTo(y,true);
  const marks=list.map(card=>[card,mark(card)]);
  const watch=elapsed=>later(()=>{
   for(const [card,item] of marks)if(elapsed>=RING_MS||!card.isConnected)item.remove();
   if(elapsed<RING_MS)watch(elapsed+WATCH_MS);
  },WATCH_MS);
  watch(WATCH_MS);
 };
 const settle=(last,waited)=>later(()=>{const now=scrollY;if(now!==last&&waited<MAX_SETTLE_MS)settle(now,waited+POLL_MS);else ring()},POLL_MS);
 settle(scrollY,0);
}
