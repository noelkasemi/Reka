// The custom card ("Custom design" in Forma e kartës): a Klasik card the owner builds from settings in the CMS (frame corners, border, inner line,
// shadow, photo window, text, size chips, button, discount badge). One table of settings drives everything: the server rules, the CSS variables the card
// reads, and the controls of the CMS builder. Pure (no DOM, no imports): the pages, the CMS and the server all use this one file
// (npm run sync copies it to reka-cms/public/ and reka-cms/lib/). To add a setting: add a row here, a value to every preset, and its CSS rule in cards.css.
const freeze=Object.freeze;
export const GROUPS=freeze([['frame','Frame'],['photo','Photo'],['text','Text'],['chips','Size chips'],['button','Order button'],['badge','Discount badge']].map(freeze));

const enumField=(key,group,label,options)=>freeze({key,group,label,kind:'enum',options:freeze(options.map(freeze))});
const range=(key,group,label,min,max,unit='px')=>freeze({key,group,label,kind:'range',min,max,step:1,unit});
const color=(key,group,label,optional=false)=>freeze({key,group,label,kind:'color',optional});
const bool=(key,group,label)=>freeze({key,group,label,kind:'bool'});

export const FIELDS=freeze([
 enumField('corners','frame','Corners',[['round','Rounded'],['notch','Notched (round cut-outs)'],['cut','Chamfered (diagonal cuts)'],['arch','Arch']]),
 range('size','frame','Corner size',0,40),
 color('bg','frame','Card color'),
 color('bg2','frame','Second color (gradient)',true),
 range('borderWidth','frame','Border width',0,8),
 enumField('borderStyle','frame','Border style',[['solid','Solid'],['double','Double'],['dashed','Dashed'],['dotted','Dotted']]),
 color('borderColor','frame','Border color'),
 bool('innerOn','frame','Inner line'),
 range('innerInset','frame','Inner line distance',4,16),
 color('innerColor','frame','Inner line color'),
 enumField('shadow','frame','Shadow',[['none','None'],['soft','Soft'],['strong','Strong'],['hard','Hard offset']]),
 enumField('padding','frame','Inner spacing',[['compact','Tight'],['normal','Normal'],['airy','Roomy']]),

 enumField('photoShape','photo','Photo shape',[['rect','Rectangle'],['round','Rounded corners'],['circle','Circle'],['arch','Arch']]),
 range('photoRadius','photo','Photo corner rounding',0,30),
 color('photoBg','photo','Photo background'),
 range('photoBorderWidth','photo','Photo border width',0,6),
 color('photoBorderColor','photo','Photo border color'),
 range('photoHeight','photo','Photo height',110,220),
 bool('photoInset','photo','Photo inside the spacing (off: edge to edge)'),

 enumField('align','text','Text alignment',[['left','Left'],['center','Center']]),
 bool('upper','text','Capital letters in the title'),
 enumField('titleSize','text','Title size',[['s','Small'],['m','Medium'],['l','Large']]),
 color('textColor','text','Text color'),
 color('accent','text','Accent color (price)'),

 enumField('chips','chips','Size chip style',[['pill','Pill'],['square','Square'],['underline','Underline']]),

 enumField('btnStyle','button','Button style',[['filled','Filled'],['outline','Outline'],['soft','Soft']]),
 range('btnRadius','button','Button rounding',0,30),
 color('btnBg','button','Button color'),
 color('btnColor','button','Button text color'),
 bool('btnFull','button','Full-width button'),
 bool('btnUpper','button','Capital letters on the button'),
 bool('btnIcon','button','Cart icon'),

 color('badgeBg','badge','Badge color'),
 enumField('badgeShape','badge','Badge shape',[['pill','Pill'],['square','Square']]),
 enumField('badgeSide','badge','Badge side',[['left','Left'],['right','Right']])
]);
const BY_KEY=new Map(FIELDS.map(item=>[item.key,item]));

// Six ready models: every setting is given (the first one is also the default for keys a stored card leaves out).
const FIRST={
 corners:'notch',size:14,bg:'#dcd9bb',bg2:'',borderWidth:4,borderStyle:'double',borderColor:'#8a7a45',innerOn:false,innerInset:8,innerColor:'#8a7a45',shadow:'none',padding:'normal',
 photoShape:'rect',photoRadius:0,photoBg:'#ffffff',photoBorderWidth:0,photoBorderColor:'#8a7a45',photoHeight:150,photoInset:true,
 align:'left',upper:true,titleSize:'m',textColor:'#2a3322',accent:'#44502f',chips:'pill',
 btnStyle:'filled',btnRadius:6,btnBg:'#44502f',btnColor:'#f6f1e3',btnFull:true,btnUpper:false,btnIcon:true,badgeBg:'#c8372d',badgeShape:'pill',badgeSide:'left'
};
const preset=(id,name,over={})=>freeze({id,name,values:freeze({...FIRST,...over})});
export const PRESETS=freeze([
 preset('double','Double frame'),
 preset('postcard','Postcard',{corners:'round',size:18,bg:'#f7efe0',borderWidth:2,borderStyle:'dashed',borderColor:'#b89a52',innerOn:true,innerInset:8,innerColor:'#b89a52',shadow:'soft',padding:'airy',photoShape:'round',photoRadius:12,photoBorderColor:'#b89a52',align:'center',upper:false,titleSize:'l',textColor:'#3a2a14',accent:'#9a5b13',chips:'underline',btnStyle:'outline',btnRadius:18,btnBg:'#9a5b13',btnColor:'#ffffff',btnIcon:false,badgeShape:'square',badgeSide:'right'}),
 preset('ticket','Ticket',{corners:'cut',size:14,bg:'#ffffff',borderWidth:2,borderStyle:'solid',borderColor:'#1d1d17',innerColor:'#1d1d17',photoBg:'#f1f1ec',photoBorderWidth:2,photoBorderColor:'#1d1d17',photoHeight:140,titleSize:'s',textColor:'#1d1d17',accent:'#c8372d',chips:'square',btnRadius:0,btnBg:'#1d1d17',btnColor:'#ffffff',btnUpper:true,btnIcon:false,badgeShape:'square'}),
 preset('arch','Arch',{corners:'arch',size:20,bg:'#365343',bg2:'#2a4234',borderWidth:0,borderStyle:'solid',borderColor:'#365343',innerColor:'#d8bb7a',shadow:'strong',photoShape:'arch',photoRadius:18,photoBorderColor:'#365343',photoHeight:160,align:'center',textColor:'#f7f2e5',accent:'#d8bb7a',btnRadius:20,btnBg:'#f7f2e5',btnColor:'#1b3326',badgeSide:'right'}),
 preset('modern','Modern',{corners:'round',size:22,bg:'#ffffff',borderWidth:1,borderStyle:'solid',borderColor:'#e2ddd0',innerColor:'#e2ddd0',shadow:'soft',padding:'airy',photoShape:'round',photoRadius:16,photoBg:'#f4f1ea',photoBorderColor:'#e2ddd0',photoHeight:160,upper:false,textColor:'#1c2f25',accent:'#1d5240',btnStyle:'soft',btnRadius:14,btnBg:'#1d5240',btnColor:'#ffffff'}),
 preset('retro','Retro',{corners:'round',size:8,bg:'#fff4d6',borderWidth:3,borderStyle:'solid',borderColor:'#1c1c1c',innerColor:'#1c1c1c',shadow:'hard',photoBg:'#ffe08a',photoBorderWidth:3,photoBorderColor:'#1c1c1c',photoHeight:140,textColor:'#1c1c1c',accent:'#d4391c',chips:'square',btnRadius:4,btnBg:'#d4391c',btnColor:'#ffffff',btnUpper:true,btnIcon:false,badgeBg:'#1c1c1c',badgeShape:'square'})
]);
export const DEFAULT_CUSTOM=PRESETS[0].values;

const MESSAGE='The card design is not valid.',HEX=/^#[0-9a-f]{6}$/i;
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
function valueOk(item,value){
 if(item.kind==='enum')return typeof value==='string'&&item.options.some(([option])=>option===value);
 if(item.kind==='range')return typeof value==='number'&&Number.isFinite(value)&&value>=item.min&&value<=item.max;
 if(item.kind==='color')return typeof value==='string'&&(HEX.test(value)||(item.optional&&value===''));
 return typeof value==='boolean';
}
// The rule the CMS and the server share: '' when fine (or when there is no custom card), otherwise the Albanian message to show.
export function customCardProblem(value){
 if(value===undefined)return '';
 if(!plain(value))return MESSAGE;
 for(const [key,setting] of Object.entries(value)){const item=BY_KEY.get(key);if(!item||!valueOk(item,setting))return MESSAGE}
 return '';
}
// What the page draws: the full settings of a valid stored card (the defaults fill what it leaves out), or null. Invalid means "no custom card".
export function customCardOf(catalog){
 const stored=catalog&&typeof catalog==='object'?catalog.customCard:undefined;
 if(stored===undefined||stored===null||customCardProblem(stored))return null;
 return {...DEFAULT_CUSTOM,...stored};
}

// The CMS's draft card: is it an unsaved change, and what is written when the design is saved? (saved: the stored card or null; style: the chosen shape.)
// A saved card is kept while another shape is chosen, and a card edited and then left for another shape is still saved: the owner's work is never dropped silently.
const sameCard=(a,b)=>FIELDS.every(item=>a[item.key]===b[item.key]);
export const customCardChanged=(draft,saved,style)=>!!draft&&(saved?!sameCard(draft,saved):style==='custom'||!sameCard(draft,DEFAULT_CUSTOM));
export const customCardToSave=(draft,saved,style)=>draft&&(saved||style==='custom'||!sameCard(draft,DEFAULT_CUSTOM))?{...draft}:null;

const PAD={compact:8,normal:12,airy:18};
const onOff=value=>value?'on':'off';
// The CSS variables and data attributes of one card (cards.css has a rule for each). Only validated settings come in, so only safe strings go out.
export function customCardVars(card){
 const roundish=card.corners==='round'||card.corners==='arch';
 const vars={
  '--cc-bg':card.bg,'--cc-bgimg':card.bg2?'linear-gradient(160deg,'+card.bg+','+card.bg2+')':'none',
  '--cc-bw':card.borderWidth+'px','--cc-bs':card.borderStyle,'--cc-bc':card.borderColor,
  '--cc-r':roundish?card.size+'px':'0px','--cc-cut':card.size+'px',
  '--cc-pad':(PAD[card.padding]+(card.innerOn?card.innerInset+2:0))+'px','--cc-inset':card.innerInset+'px','--cc-ic':card.innerColor,
  '--cc-ph':card.photoHeight+'px','--cc-pbg':card.photoBg,'--cc-pbw':card.photoBorderWidth+'px','--cc-pbc':card.photoBorderColor,'--cc-pr':card.photoRadius+'px',
  '--cc-text':card.textColor,'--cc-accent':card.accent,
  '--cc-btr':card.btnRadius+'px','--cc-btbg':card.btnBg,'--cc-btc':card.btnColor,'--cc-badge':card.badgeBg
 };
 const data={
  corners:card.corners,shadow:card.shadow,inner:onOff(card.innerOn),photo:card.photoShape,'photo-inset':onOff(card.photoInset),
  align:card.align,upper:onOff(card.upper),'title-size':card.titleSize,chips:card.chips,
  btn:card.btnStyle,'btn-full':onOff(card.btnFull),'btn-upper':onOff(card.btnUpper),'btn-icon':onOff(card.btnIcon),
  'badge-shape':card.badgeShape,'badge-side':card.badgeSide
 };
 return {vars,data};
}
