// Google Analytics 4 events. The page's analytics block (index.html, between the <!--analytics--> markers) loads the Google tag and defines gtag().
// The CMS preview page has no such block, so every call here does nothing there; ?no-analytics (see index.html) mutes the tag in one browser.
import {orderParts} from './properties.js';

const send=(...args)=>{try{if(typeof window.gtag==='function')window.gtag(...args)}catch{}};
export const track=(name,params={})=>send('event',name,params);
// The catalogue, business and design go along with every later event, then the page view (the tag is set up with send_page_view:false so it carries them too).
export const startTracking=defaults=>{send('set',defaults);track('page_view')};
// One product the way GA4's item reports want it: id, name, category and the chosen size, colour and options.
export const itemOf=(product,selection={})=>{
 const variant=[selection.variant,selection.color,...orderParts(product,selection)].filter(Boolean).join(' · ');
 return {item_id:product.id,item_name:product.name,item_category:product.category,...(variant&&{item_variant:variant})};
};
export const productEvent=(name,product,selection)=>track(name,{items:[itemOf(product,selection)]});
// A WhatsApp link whose click carries its own event (order, list); the contact listener below skips it. params() runs at click time (the chosen option may have changed); null = nothing to count.
export const trackLink=(link,name,params)=>{link.dataset.tracked='1';link.addEventListener('click',()=>{const data=params();if(data)track(name,data)})};
// The search box: one event once the visitor stops typing, never one per letter.
let searchTimer;
export const trackSearch=term=>{clearTimeout(searchTimer);const text=term.trim();if(text.length>1)searchTimer=setTimeout(()=>track('search',{search_term:text}),900)};
// Any other WhatsApp link (header, footer, hero, "no results") counts as a contact click. A cancelled click (a card button that only opens the popup) is no contact.
export const watchContacts=()=>document.addEventListener('click',event=>{
 const link=event.target.closest?.('a[href*="wa.me"]');
 if(link&&!link.dataset.tracked&&!event.defaultPrevented)track('whatsapp_contact',{place:link.closest('footer')?'footer':link.closest('header')?'header':'page'});
});
