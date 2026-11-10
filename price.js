// Prices are whole numbers in ALL (Albanian lek). A product may have a price ("price") and, optionally, a lower discounted price ("salePrice").
// Pure (no DOM, no imports): the pages, the CMS and the server all use this one file (npm run sync copies it to reka-cms/public/ and reka-cms/lib/).
export const CURRENCY='ALL';   // the currency code, as the shop writes it (not the word "Lekë")
export const MAX_PRICE=10000000;
const whole=n=>Number.isInteger(n)&&n>=1&&n<=MAX_PRICE;
const has=n=>n!==undefined&&n!==null;

// The rules for the CMS form and the server: '' when fine, otherwise the Albanian message to show.
export function priceProblem({price,salePrice}={}){
 if(has(price)&&!whole(price))return 'Çmimi duhet të jetë numër i plotë pozitiv.';
 if(has(salePrice)){
  if(!has(price))return 'Vendosni fillimisht çmimin.';
  if(!whole(salePrice))return 'Çmimi me zbritje duhet të jetë numër i plotë pozitiv.';
  if(salePrice>=price)return 'Çmimi me zbritje duhet të jetë më i vogël se çmimi.';
 }
 return '';
}

// What a card shows: null (no usable price), {price,sale:null,percent:0} (price only) or {price,sale,percent} for a discount.
// The percent is the exact discount rounded UP to a whole number (20.2% -> 21), never 100. Anything invalid is ignored, so bad data never shows as a price.
export function priceOf(product){
 const price=product?.price,sale=product?.salePrice;
 if(!whole(price))return null;
 if(!whole(sale)||sale>=price)return {price,sale:null,percent:0};
 return {price,sale,percent:Math.min(99,Math.ceil((price-sale)*100/price))};
}

// 1200 -> "1 200 ALL" (non-breaking spaces, so a price never wraps in the middle).
export const formatPrice=amount=>String(amount).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' '+CURRENCY;
