// Product properties and their photos. A product has sizes (variants) and colours, and optionally custom properties (any name, any values, e.g. Material: Steel).
// Any value of any property can have its own photo; the photo of the selected option is shown on the card and in the popup. Pure (no DOM, no imports): the pages,
// the CMS form and the server all use this one file (npm run sync copies it to reka-cms/public/ and reka-cms/lib/). Its only import is the pure price.js.
//
// On a product (all optional):  properties: [{name, values:[text]}]
//                               photos: {"variants":{"24 cm":path}, "colors":{"Red":path}, "p:<property name>":{"Steel":path}}
//                               prices: {"variants":{"24 cm":{price,salePrice?}}, "colors":{...}, "p:<property name>":{...}}   (same keys as photos; price.js rules)
// A selection (what the customer picked): {variant, color, props:{[name]:value}, recent:[property keys, last click first]}; saved lists may hold older ones without props/recent.
import {priceOf,MAX_PRICE} from './price.js';
export const cleanSize=value=>String(value).replace(/^[Øø]\s*/,'').trim();
export const LIMITS=Object.freeze({properties:8,name:40,values:40,value:100,photos:40,prices:100});
const BUILTIN=new Set(['size','sizes','colour','color','colours','colors','permasa','ngjyra','permasat','ngjyrat']);
const fold=text=>String(text).normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase();
const PHOTO=/^(assets\/(?:[\w-]+\/)*[\w.-]+|uploads\/[\w.-]+|https:\/\/(www\.)?reka\.al\/[^\s"<>]+)$/;   // same rule as the main photo (lib/products.mjs)
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const own=(object,key)=>plain(object)&&Object.hasOwn(object,key);
const customOf=product=>(Array.isArray(product?.properties)?product.properties:[]).filter(item=>plain(item)&&typeof item.name==='string'&&Array.isArray(item.values));

// The properties that have values, in display order: sizes, colours, then the custom ones. key: "variants" | "colors" | "p:<name>".
export function propertiesOf(product){
 const list=[],sizes=(product?.variants||[]).map(cleanSize),colors=product?.colors||[];
 if(sizes.length)list.push({key:'variants',name:'Përmasa',values:sizes});
 if(colors.length)list.push({key:'colors',name:'Ngjyra',values:[...colors]});
 for(const item of customOf(product)){const values=item.values.filter(value=>typeof value==='string'&&value);if(values.length)list.push({key:'p:'+item.name,name:item.name,values})}
 return list;
}
export const initialSelection=product=>({variant:cleanSize(product?.variants?.[0]||''),color:product?.colors?.[0]||'',props:Object.fromEntries(propertiesOf(product).filter(item=>item.key.startsWith('p:')).map(item=>[item.name,item.values[0]])),recent:[]});
export function selectedOf(selection,key){
 if(key==='variants')return selection?.variant||'';
 if(key==='colors')return selection?.color||'';
 return key.startsWith('p:')&&own(selection?.props,key.slice(2))?selection.props[key.slice(2)]:'';
}
// The customer picked a value: store it and remember this property was clicked last.
export function pickOption(selection,key,value){
 if(key==='variants')selection.variant=value;else if(key==='colors')selection.color=value;else{selection.props=selection.props||{};selection.props[key.slice(2)]=value}
 selection.recent=[key,...(selection.recent||[]).filter(item=>item!==key)];
}
export const optionPhoto=(product,key,value)=>{const map=product?.photos?.[key];return own(product?.photos,key)&&own(map,value)&&typeof map[value]==='string'?map[value]:''};
// The selected options in the order of the photo and price rule: the property clicked last first (before any click: sizes, colours, custom in order).
// Returns what pick(key,value) finds for the first selected option that has something, else null.
function firstSelected(product,selection,pick){
 for(const key of [...(selection?.recent||[]),...propertiesOf(product).map(item=>item.key)]){const found=pick(key,selectedOf(selection,key));if(found)return found}
 return null;
}
// The photo to show: the selected option of the property clicked last that has one, else the main photo.
export const photoOf=(product,selection)=>firstSelected(product,selection,(key,value)=>optionPhoto(product,key,value))||product.image;
// The stored price entry {price,salePrice?} of a value, or null.
export const optionPrice=(product,key,value)=>{const entry=own(product?.prices,key)&&own(product.prices[key],value)?product.prices[key][value]:null;return plain(entry)?entry:null};
// The price block to show ({price,sale,percent} as priceOf, or null): the selected option of the property clicked last that has a valid price replaces the product's own price and discount
// (a plain priced option shows no discount even when the product has one); with none, the product's own price.
export const priceFor=(product,selection)=>firstSelected(product,selection,(key,value)=>{const entry=optionPrice(product,key,value);return entry?priceOf({price:entry.price,salePrice:entry.salePrice}):null})||priceOf(product);
// Does the product have a usable option price (so its price can change with the selection)?
export const hasOptionPrices=product=>propertiesOf(product).some(item=>item.values.some(value=>{const entry=optionPrice(product,item.key,value);return !!entry&&priceOf(entry)!==null}));
// The CMS form's specific messages for one option's fields (undefined/null = empty field). '' when fine.
export function optionPriceProblem(price,salePrice){
 const has=number=>number!==undefined&&number!==null;
 if(has(price)&&!(Number.isInteger(price)&&price>=1&&price<=MAX_PRICE))return 'Price must be a whole number from 1 to 10 000 000.';
 if(has(salePrice)){
  if(!has(price))return 'Enter the price before the sale price.';
  if(!Number.isInteger(salePrice)||salePrice<1||salePrice>=price)return 'Sale price must be a whole number lower than the price.';
 }
 return '';
}
export const photoPaths=product=>Object.values(plain(product?.photos)?product.photos:{}).flatMap(map=>plain(map)?Object.values(map):[]).filter(path=>typeof path==='string');
// Extra words for the order message: only the custom properties ("Material: Steel"); size and colour are added by the callers as before.
export const orderParts=(product,selection)=>propertiesOf(product).filter(item=>item.key.startsWith('p:')).map(item=>[item.name,selectedOf(selection,item.key)]).filter(([,value])=>value).map(([name,value])=>name+': '+value);
export const propertyText=product=>customOf(product).flatMap(item=>[item.name,...item.values.filter(value=>typeof value==='string')]).join(' ');
// A selection read back from a saved list: every value must still exist, otherwise the first one is used (as for sizes today).
export function restoreSelection(product,saved){
 const selection=initialSelection(product);if(!plain(saved))return selection;
 const lists=Object.fromEntries(propertiesOf(product).map(item=>[item.key,item.values]));
 if((lists.variants||[]).includes(saved.variant))selection.variant=saved.variant;
 if((lists.colors||[]).includes(saved.color))selection.color=saved.color;
 for(const name of Object.keys(selection.props))if(own(saved.props,name)&&(lists['p:'+name]||[]).includes(saved.props[name]))selection.props[name]=saved.props[name];
 selection.recent=(Array.isArray(saved.recent)?saved.recent:[]).filter((key,index,all)=>own(lists,key)&&all.indexOf(key)===index);
 return selection;
}
// A property was renamed in the CMS form: its photos follow the new name, unless that would take them from another row that still has the old name
// (a new row being typed "Handle c" next to an existing "Handle") or overwrite the photos of a row that has the new name. otherNames: the names of the other rows.
export function movePropertyPhotos(photos,from,to,otherNames){
 if(from===to||!own(photos,'p:'+from)||own(photos,'p:'+to)||otherNames.includes(from)||otherNames.includes(to))return {photos,moved:false};
 const {['p:'+from]:map,...rest}=photos;
 return {photos:{...rest,['p:'+to]:map},moved:true};
}
// Does the customer have to choose something the compact card does not show (a colour, or a custom property with more than one value)? Then the card's order button opens the popup.
export const hasPopupChoices=product=>propertiesOf(product).some(item=>item.key==='colors'||(item.key.startsWith('p:')&&item.values.length>1));
// The product as the CMS saves it: names trimmed, empty and duplicate properties and values dropped, and photos kept only for values that still exist. Returns a copy.
export function tidyProduct(product){
 const out={...product},seen=new Set(),properties=[];
 for(const item of customOf(product)){
  const name=item.name.trim(),values=[...new Set(item.values.filter(value=>typeof value==='string').map(value=>value.trim()).filter(Boolean))];
  if(name&&values.length&&!seen.has(fold(name))){seen.add(fold(name));properties.push({name,values})}
 }
 if(properties.length)out.properties=properties;else delete out.properties;
 const allowed={variants:new Set((product.variants||[]).map(cleanSize)),colors:new Set(product.colors||[])};
 for(const item of properties)allowed['p:'+item.name]=new Set(item.values);
 // photos and prices are kept only for values that still exist (and entries that are usable); empty maps are removed
 const prune=(source,usable)=>{
  const kept={};
  for(const [key,map] of Object.entries(plain(source)?source:{})){
   if(!own(allowed,key)||!plain(map))continue;
   const entries=Object.fromEntries(Object.entries(map).filter(([value,item])=>allowed[key].has(value)&&usable(item)));
   if(Object.keys(entries).length)kept[key]=entries;
  }
  return kept;
 };
 const photos=prune(product.photos,path=>typeof path==='string'&&path),prices=prune(product.prices,entry=>plain(entry)&&priceOf(entry)!==null);
 if(Object.keys(photos).length)out.photos=photos;else delete out.photos;
 if(Object.keys(prices).length)out.prices=prices;else delete out.prices;
 return out;
}
// The rows of the CMS form ([{name, values}] as typed, before tidyProduct drops anything): '' when fine, otherwise what the owner should fix (empty rows are ignored).
export function propertyRowsProblem(rows){
 const names=new Set(),used=rows.filter(row=>row.name.trim()||row.values.length);
 if(used.length>LIMITS.properties)return 'Up to '+LIMITS.properties+' custom properties.';
 for(const {name,values} of used){
  const label=name.trim();
  if(!label)return 'Give every property a name.';
  if(label.length>LIMITS.name)return 'Property names can have '+LIMITS.name+' characters at most.';
  if(BUILTIN.has(fold(label)))return '“'+label+'” is already a field above (Size and Color). Use a different name.';
  if(names.has(fold(label)))return '“'+label+'” is used twice. Property names must be different.';names.add(fold(label));
  if(!values.length)return 'Add at least one value to “'+label+'”.';
  if(values.length>LIMITS.values)return 'Up to '+LIMITS.values+' values per property (“'+label+'”).';
  if(values.some(value=>value.length>LIMITS.value))return 'A value of “'+label+'” is longer than '+LIMITS.value+' characters.';
 }
 return '';
}
// '' when fine, otherwise the message the server shows (English: the CMS wording of this feature).
export function propertiesProblem(product){
 const BAD='Custom properties are not valid.',BADP='Option photos are not valid.',BADPRICE='Option prices are not valid.';
 if(product.properties!==undefined){
  if(!Array.isArray(product.properties)||product.properties.length>LIMITS.properties)return BAD;
  const names=new Set();
  for(const item of product.properties){
   if(!plain(item)||Object.keys(item).some(key=>key!=='name'&&key!=='values')||typeof item.name!=='string')return BAD;
   const name=item.name.trim();
   if(!name||name.length>LIMITS.name||BUILTIN.has(fold(name))||names.has(fold(name)))return BAD;names.add(fold(name));
   if(!Array.isArray(item.values)||!item.values.length||item.values.length>LIMITS.values||new Set(item.values).size!==item.values.length)return BAD;
   if(item.values.some(value=>typeof value!=='string'||!value.trim()||value.length>LIMITS.value))return BAD;
  }
 }
 if(product.photos!==undefined){
  if(!plain(product.photos))return BADP;
  const allowed={variants:new Set((product.variants||[]).map(cleanSize)),colors:new Set(product.colors||[])};
  for(const item of customOf(product))allowed['p:'+item.name]=new Set(item.values);
  let count=0;
  for(const [key,map] of Object.entries(product.photos)){
   if(!own(allowed,key)||!plain(map))return BADP;
   for(const [value,path] of Object.entries(map)){if(!allowed[key].has(value)||typeof path!=='string'||!PHOTO.test(path)||path.includes('..'))return BADP;count++}
  }
  if(count>LIMITS.photos)return BADP;
 }
 if(product.prices!==undefined){
  if(!plain(product.prices))return BADPRICE;
  const allowed={variants:new Set((product.variants||[]).map(cleanSize)),colors:new Set(product.colors||[])};
  for(const item of customOf(product))allowed['p:'+item.name]=new Set(item.values);
  let count=0;
  for(const [key,map] of Object.entries(product.prices)){
   if(!own(allowed,key)||!plain(map))return BADPRICE;
   for(const [value,entry] of Object.entries(map)){
    if(!allowed[key].has(value)||!plain(entry)||Object.keys(entry).some(field=>field!=='price'&&field!=='salePrice'))return BADPRICE;
    if(typeof entry.price!=='number'||(entry.salePrice!==undefined&&typeof entry.salePrice!=='number')||optionPriceProblem(entry.price,entry.salePrice))return BADPRICE;
    count++;
   }
  }
  if(count>LIMITS.prices)return BADPRICE;
 }
 return '';
}
