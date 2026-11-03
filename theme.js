export function element(tag,text='',cls=''){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e}
export function applyTheme(t){for(const [k,v] of Object.entries(t))if(/^#[0-9a-f]{6}$/i.test(v))document.documentElement.style.setProperty('--'+k,v);const meta=document.querySelector('meta[name="theme-color"]');if(meta&&t.green)meta.content=t.green}
// The shared catalogues site (<body data-catalog="shared">) serves every custom catalogue at /<slug>; its data and photos live under /c/<slug>/.
export const sharedSlug=()=>{const slug=document.body?.dataset.catalog==='shared'?location.pathname.split('/')[1]||'':'';return /^[a-z0-9-]{2,40}$/.test(slug)?slug:''};
export async function loadCatalog(){const slug=sharedSlug(),local=!slug&&['localhost','127.0.0.1'].includes(location.hostname);let r=await fetch(slug?'/c/'+slug+'/catalog.json':local?'/api/catalog':'catalog.json',{cache:'no-store'});if(!r.ok && local)r=await fetch('catalog.json',{cache:'no-store'});if(!r.ok)throw Error('Katalogu nuk u ngarkua.');return r.json()}
export const imageURL=source=>{const slug=sharedSlug();return slug&&source.startsWith('uploads/')?'/c/'+slug+'/'+source:source};

