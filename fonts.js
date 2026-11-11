// The fonts a catalogue can choose from the CMS ("Fonts" in the Design tab): one for headings, one for text. A curated list of Google Fonts,
// every one with the latin subset (ë and ç). Pure (no DOM, no imports): the pages, the CMS and the server all use this one file
// (npm run sync copies it to reka-cms/public/ and reka-cms/lib/). To add a font, add one line here (check the weights on fonts.google.com).
export const FONT_KINDS=Object.freeze({serif:'Serif',sans:'Sans-serif',display:'Display (for headings)',script:'Handwriting'});
// What shows while a font loads, or when Google cannot be reached.
const FALLBACK={serif:"Georgia,'Times New Roman',serif",sans:"system-ui,-apple-system,'Segoe UI',Arial,sans-serif",display:"Impact,'Arial Black',sans-serif",script:'cursive'};

// [name, kind, weights as Google's css2 API takes them]
const LIST=[
 ['Playfair Display','serif','400..700'],['Cormorant Garamond','serif','400..700'],['Lora','serif','400..700'],['Merriweather','serif','400..700'],['Libre Baskerville','serif','400..700'],
 ['DM Serif Display','serif','400;500;600;700'],['Fraunces','serif','400..700'],['EB Garamond','serif','400..700'],['Cinzel','serif','400..700'],
 ['Inter','sans','400..700'],['Poppins','sans','400;500;600;700'],['Montserrat','sans','400..700'],['Nunito','sans','400..700'],['Raleway','sans','400..700'],['DM Sans','sans','400..700'],
 ['Manrope','sans','400..700'],['Open Sans','sans','400..700'],['Roboto','sans','400..700'],['Work Sans','sans','400..700'],['Lato','sans','400;500;600;700'],
 ['Source Sans 3','sans','400..700'],['Josefin Sans','sans','400..700'],['Outfit','sans','400..700'],
 ['Oswald','display','400..700'],['Bebas Neue','display','400;500;600;700'],['Abril Fatface','display','400;500;600;700'],['Archivo Black','display','400;500;600;700'],
 ['Anton','display','400;500;600;700'],['Righteous','display','400;500;600;700'],
 ['Dancing Script','script','400..700'],['Pacifico','script','400;500;600;700'],['Caveat','script','400..700'],['Satisfy','script','400;500;600;700'],['Great Vibes','script','400;500;600;700']
];
export const FONTS=Object.freeze(LIST.map(([name,kind,weights])=>Object.freeze({name,kind,spec:name.replace(/ /g,'+')+':wght@'+weights,stack:"'"+name+"',"+FALLBACK[kind]})));
const BY_NAME=new Map(FONTS.map(font=>[font.name,font]));
export const fontByName=name=>typeof name==='string'?BY_NAME.get(name):undefined;

// The two choices of a catalogue: a valid font name, or '' for "as the design is". Anything else is ignored, so bad data never reaches a stylesheet.
export function fontsOf(catalog){
 const value=catalog&&typeof catalog==='object'&&catalog.fonts&&typeof catalog.fonts==='object'&&!Array.isArray(catalog.fonts)?catalog.fonts:{};
 return {heading:fontByName(value.heading)?value.heading:'',body:fontByName(value.body)?value.body:''};
}
// The server rule for catalog.fonts: '' when fine, otherwise the Albanian message to show.
export function fontsProblem(value){
 if(value===undefined)return '';
 const plain=value&&typeof value==='object'&&!Array.isArray(value);
 if(!plain||Object.keys(value).some(key=>key!=='heading'&&key!=='body')||Object.values(value).some(name=>typeof name!=='string'||(name!==''&&!fontByName(name))))return 'The fonts are not valid.';
 return '';
}
// One Google CSS address for the chosen fonts (the same font twice is requested once); '' when nothing is chosen.
export function fontsHref({heading,body}={}){
 const specs=[...new Set([heading,body].map(fontByName).filter(Boolean))].map(font=>font.spec);
 return specs.length?'https://fonts.googleapis.com/css2?family='+specs.join('&family=')+'&display=swap':'';
}
// The CSS variables the designs read (--font-heading, --font-body), only for the chosen fonts.
export function fontVars({heading,body}={}){
 const vars={};
 if(fontByName(heading))vars['--font-heading']=fontByName(heading).stack;
 if(fontByName(body))vars['--font-body']=fontByName(body).stack;
 return vars;
}
