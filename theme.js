export function element(tag,text='',cls=''){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e}
export function applyTheme(t){for(const [k,v] of Object.entries(t))if(/^#[0-9a-f]{6}$/i.test(v))document.documentElement.style.setProperty('--'+k,v)}
export async function loadCatalog(){const local=['localhost','127.0.0.1'].includes(location.hostname);let r=await fetch(local?'/api/catalog':'catalog.json',{cache:'no-store'});if(!r.ok && local)r=await fetch('catalog.json',{cache:'no-store'});if(!r.ok)throw Error('Katalogu nuk u ngarkua.');return r.json()}
export const imageURL=source=>source;

