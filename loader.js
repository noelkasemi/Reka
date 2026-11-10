// Cat loading screen. Classic script (not a module) so it can run from <head> and cover the page before app.js loads.
(function(){
 const cat='<svg class="cat" viewBox="0 0 200 170" aria-hidden="true"><ellipse class="shadow" cx="100" cy="163" rx="64" ry="6"/><g class="tail"><path d="M142 138c34 4 44-34 24-48"/></g><ellipse class="fur" cx="100" cy="132" rx="46" ry="32"/><g class="paws"><ellipse cx="80" cy="158" rx="14" ry="9"/><ellipse cx="120" cy="158" rx="14" ry="9"/></g><g class="head"><path class="fur" d="M62 72 58 34l28 18z"/><path class="fur" d="M138 72l4-38-28 18z"/><path class="inner" d="M66 62l-2-17 14 9z"/><path class="inner" d="M134 62l2-17-14 9z"/><ellipse class="fur" cx="100" cy="82" rx="42" ry="36"/><path class="stripe" d="M100 48v10M91 50l3 9M109 50l-3 9"/><g class="eyes"><ellipse cx="84" cy="80" rx="4.5" ry="6.5"/><ellipse cx="116" cy="80" rx="4.5" ry="6.5"/></g><circle class="cheek" cx="71" cy="94" r="7"/><circle class="cheek" cx="129" cy="94" r="7"/><path class="nose" d="M95 90h10l-5 6z"/><path class="mouth" d="M100 96q-5 7-11 3M100 96q5 7 11 3"/><path class="whisk" d="M62 90l-18-4M62 95l-18 4M138 90l18-4M138 95l18 4"/></g><path class="thread" d="M152 152q-20 14-34 6"/><g class="yarn"><circle cx="164" cy="150" r="13"/><path d="M154 146q10 6 20-2M153 152q11 6 22 0"/></g></svg>';
 // Martini&K's mark (same path data as MARK_SVG in brand.js; this file is a classic script and cannot import it, tests/loader.test.mjs compares them).
 const martini='<span class="rl-martini"><svg class="rl-mark" viewBox="0 0 48 52" aria-hidden="true"><path d="M24 2 44 13.5v25L24 50 4 38.5v-25z"/><path d="M12.5 35V18l6.5 8.5L25.5 18v17M31 18v17M38.5 18 31 26.5l7.5 8.5"/></svg><span class="rl-word">MARTINI<span>&amp;</span>K</span></span>';
 let el,run=0,shownAt=0,waiting=[];
 // Callbacks for "when the loading screen is gone" (a shared product link opens its popup then, not underneath the loader).
 const flush=()=>{const list=waiting;waiting=[];for(const fn of list)try{fn()}catch(error){console.error(error)}};
 window.RekaLoader={
  cat,
  // dim=true: translucent overlay for in-app actions (save/publish); default is the opaque page-load screen.
  show(text='Po ngarkohet',{dim=false,brand=false}={}){
   if(!el){
    el=document.createElement('div');el.id='reka-loader';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.setAttribute('popover','manual');
    el.innerHTML='<div class="rl-box"></div>';
    document.documentElement.append(el);
   }
   run++;shownAt=Date.now();
   // brand=true (or 'reka'): quiet Reka logo loader for the public sites; brand='martini': the Martini&K mark; an unknown value shows Reka's logo. The cat is only for the CMS.
   el.firstChild.innerHTML=brand?(brand==='martini'?martini:'<img class="rl-logo" src="assets/logo.png" alt="Reka Horeca">')+'<span class="rl-line"></span><span class="rl-sr rl-msg"></span>':cat+'<p class="rl-text"><span class="rl-msg"></span><span class="rl-dots"><i></i><i></i><i></i></span></p>';
   el.querySelector('.rl-msg').textContent=text;el.classList.toggle('rl-brand',!!brand);
   el.classList.toggle('rl-dim',dim);el.classList.remove('rl-out');el.hidden=false;
   // popover = top layer, so the cat also covers open <dialog>s
   try{if(!el.matches(':popover-open'))el.showPopover()}catch{}
  },
  // Keeps the cat on screen for at least `min` ms so it never just flashes.
  hide(min=800){
   if(!el)return;const id=run,wait=Math.max(0,min-(Date.now()-shownAt));
   setTimeout(()=>{if(id!==run)return;el.classList.add('rl-out');setTimeout(()=>{if(id===run){el.hidden=true;try{el.hidePopover()}catch{}flush()}},320)},wait);
  },
  whenHidden(fn){if(!el||el.hidden)fn();else waiting.push(fn)},
  async wrap(text,task,options){this.show(text,{dim:true,...options});try{return await task()}finally{this.hide(options?.min??600)}}
 };
})();
