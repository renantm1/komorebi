import type { RecipeId } from '../data/recipes';
export function expandedFood(id: RecipeId): string {
  const bowl = (inside: string, color = '#c7cfb1', broth = '#f5ebcd') => `<ellipse cx="100" cy="169" rx="64" ry="9" fill="#56674e" opacity=".13"/><path d="M22 89q7 74 78 77 69-3 78-77Z" fill="${color}" stroke="#748774" stroke-width="3"/><path d="M46 135q52 21 107-2" stroke="#9ba68a" stroke-width="3" fill="none"/><ellipse cx="100" cy="89" rx="78" ry="39" fill="#f2e6c9" stroke="#748774" stroke-width="3"/><ellipse cx="100" cy="87" rx="68" ry="30" fill="${broth}"/>${inside}`;
  if (id === 'temaki') return `<ellipse cx="100" cy="169" rx="58" ry="9" fill="#56674e" opacity=".13"/><path d="M42 65 104 176 165 65Z" fill="#3e5943" stroke="#344d38" stroke-width="3"/><path d="M49 75 104 168 114 74Z" fill="#5e7950"/><ellipse cx="103" cy="64" rx="62" ry="32" fill="#f9f1d8" stroke="#466447" stroke-width="4"/><path d="M62 56 80 38 139 62 129 86Z" fill="#e99c7c"/><path d="m78 45 14 33m7-26 10 32m9-21 7 23" stroke="#ffdfb7" stroke-width="5"/><path d="m111 40 36-1-12 36-19-4Z" fill="#8fab70"/><path d="m119 44 20-2-9 24" fill="none" stroke="#d2dfa4" stroke-width="4"/><path d="m59 76 41 80" stroke="#849163" opacity=".4" stroke-width="2"/>`;
  if (id === 'gyoza') {
    let p = '<ellipse cx="100" cy="137" rx="84" ry="30" fill="#d7dfc0" stroke="#99aa8c" stroke-width="2"/>';
    for (let i = 0; i < 4; i++) p += `<g transform="translate(${43 + i * 39} ${100 + i % 2 * 12}) rotate(${i % 2 ? 12 : -8})"><path d="M-23 14Q-28-30 0-29 29-29 23 14q-23 14-46 0Z" fill="#f4dfad" stroke="#d0ab6c" stroke-width="2"/><path d="M-17 12Q-20-12-7-20M-5 16q-8-24 6-41M8 15q-3-22 8-31" stroke="#c8a56c" stroke-width="2" fill="none"/><path d="M-18 16q18 10 36-1" stroke="#bc884c" stroke-width="5" fill="none"/></g>`;
    return p + '<path d="M151 143q27-19 27-4t-27 4" fill="#78965e"/>';
  }
  if (id === 'tempura') {
    let p = '<ellipse cx="100" cy="141" rx="84" ry="29" fill="#c3d0b3" stroke="#829b7b" stroke-width="2"/><path d="m33 143 120-8" stroke="#8b7049" stroke-width="3"/>';
    for (let i = 0; i < 3; i++) p += `<g transform="translate(${57 + i * 41} ${111 - i % 2 * 14}) rotate(${i * 15 - 10})"><path d="M-9 26q-27-62-7-77 24-10 27 12l4 64Z" fill="#e7bd65" stroke="#c6984d" stroke-width="2"/><path d="M-5 28l-9 17 10-3 9 6 7-20Z" fill="#dd8d69"/><path d="M-9-43l12 7m-19 6 18 7m-19 6 20 7m-17 7 19 5m-17 6 20 6" stroke="#f5da91" stroke-width="5"/></g>`;
    return p + '<path d="M153 145q5-35 28-23l-11 23Z" fill="#9bad73"/>';
  }
  if (id === 'donburi') return bowl(`<path d="M44 89q14-35 44-17l12 25q-39 13-56-8M78 76q21-29 44-7l-2 24-32 7M105 81q25-30 48-8l5 24-43 7Z" fill="#c69a63" stroke="#ac7f4e" stroke-width="2"/><path d="M46 81 81 88m8-13 24 7m10-2 25 10" stroke="#e9c58b" stroke-width="4"/><ellipse cx="106" cy="66" rx="24" ry="28" fill="#fff2c9"/><ellipse cx="109" cy="69" rx="13" ry="16" fill="#edbb50"/><path d="m52 64 15 8m66 23 14 3m-17-46-14 10" stroke="#72965d" stroke-width="5"/>`);
  if (id === 'missoshiru') return bowl(`<path d="M53 77h22v18H53m54-29h20v20h-20m-27 17h17v17H80" fill="#efe1b7"/><g fill="#9d7957"><ellipse cx="133" cy="92" rx="18" ry="8"/><ellipse cx="86" cy="68" rx="13" ry="7"/></g><path d="m125 93-1 13M86 69v14" stroke="#e1cb9c" stroke-width="5"/><g fill="#789358"><ellipse cx="53" cy="66" rx="9" ry="4"/><ellipse cx="65" cy="61" rx="8" ry="4"/><ellipse cx="119" cy="104" rx="9" ry="4"/></g>`, '#a97959', '#ae8751');
  if (id === 'yakisoba') {
    let p = '<path d="m139 119 56 32" stroke="#5d5f4a" stroke-width="12" stroke-linecap="round"/><ellipse cx="97" cy="122" rx="80" ry="38" fill="#69735c"/><ellipse cx="97" cy="110" rx="80" ry="37" fill="#465c45" stroke="#899578" stroke-width="4"/>';
    for (let i = 0; i < 9; i++) p += `<path d="M${35 + i * 3} ${100 + i * 3}q22-34 43-9t38-6 31 15" fill="none" stroke="${i % 2 ? '#d0a35d' : '#e7c37a'}" stroke-width="5"/>`;
    return p + '<path d="m44 88 17-9 8 18-15 9m68-15 12-15 14 10-8 19m-49 6 8-12 12 12-8 10" fill="#a8bf7d" stroke="#c4d397" stroke-width="2"/><path d="m55 120 7-6m74-4 6-6m-50-18 7-6" stroke="#bd805c" stroke-width="4"/>';
  }
  if (id === 'uramaki') {
    let p = '<ellipse cx="100" cy="145" rx="80" ry="28" fill="#d6dec2"/>';
    for (let i = 0; i < 6; i++) { const x = 47 + i % 3 * 51, y = 76 + Math.floor(i / 3) * 48; p += `<g transform="translate(${x} ${y})"><path d="M-24 0v20q24 24 48 0V0Z" fill="#f6ecd0" stroke="#ddd3af" stroke-width="2"/><ellipse rx="25" ry="22" fill="#fff5d9" stroke="#ddd3af" stroke-width="2"/><ellipse rx="16" ry="14" fill="#4d664b"/><path d="M-10-6h17v17h-17Z" fill="#e59b7c"/><path d="M5-9h7V6H5Z" fill="#91ad71"/><path d="m-21-1 3 3m35-6 3 3m-10 19 3 2" stroke="#bea16c" stroke-width="2"/></g>`; }
    return p;
  }
  if (id === 'karaage') {
    let p = '<ellipse cx="100" cy="143" rx="84" ry="28" fill="#d6dfbf" stroke="#8fa280" stroke-width="2"/><path d="M28 128q0-38 27-27-8 26-27 27m4-1q-15-30 8-35 11 22-8 35" fill="#86a36c"/>';
    for (let i = 0; i < 6; i++) p += `<g transform="translate(${61 + i % 3 * 36} ${96 + Math.floor(i / 3) * 35}) rotate(${i * 17})"><path d="M-16-14 3-23 20-11 22 8 4 22-16 13-21-1Z" fill="${i % 2 ? '#cea358' : '#dcb46a'}" stroke="#b58943" stroke-width="2"/><path d="m-11-4 7-8m7 23 8-5m-5-17 7 7" stroke="#f0ce83" stroke-width="4"/></g>`;
    return p + '<path d="m152 145 22-30 13 27Z" fill="#f0d47e" stroke="#e3bf62" stroke-width="3"/>';
  }
  return '';
}
export const extraIngredients = {
  dough: '<ellipse cx="50" cy="37" rx="31" ry="16" fill="#ddcca7"/><ellipse cx="48" cy="31" rx="31" ry="16" fill="#e9d9b6"/><ellipse cx="48" cy="25" rx="31" ry="16" fill="#f8edce" stroke="#dac7a0" stroke-width="2"/>',
  cabbage: '<path d="M19 39Q8 4 40 14q4-20 25-5 26 0 17 27-14 24-63 3" fill="#a3ba7b"/><path d="M27 17q21 1 24 28m19-30L51 45M19 30l29 13m34-20L53 43" fill="none" stroke="#d1dea2" stroke-width="3"/>',
  shrimp: '<path d="M70 17q-30-21-42 2-20 29 18 30 25-2 17-19-8-9-17-1" fill="none" stroke="#e9a083" stroke-width="16" stroke-linecap="round"/><path d="m67 13 14-9-2 15 12 5-18 4" fill="#d38566"/><path d="m30 18 12 5m-14 8 14 2m-6 10 9-8m8 10-3-11" stroke="#fce2bf" stroke-width="4"/>',
  chicken: '<path d="m18 22 20-12 16 15-5 21-25-1Zm35-1 19-7 13 16-10 18-23-5Z" fill="#d6a37c" stroke="#b9855e" stroke-width="2"/><path d="m24 27 21 7m13-4 17 5" stroke="#f0cfaa" stroke-width="4"/>',
  miso: '<path d="M21 39q-9-24 12-21 0-23 21-10 23-7 21 13 22 20-6 28Z" fill="#b68c5d"/><path d="M28 31q10-19 24-9m4 14q12-14 16-6" stroke="#d0ab78" stroke-width="3" fill="none"/>',
  sauce: '<ellipse cx="50" cy="35" rx="35" ry="12" fill="#865e3d"/><path d="M25 31q18-10 39-1" stroke="#c09560" stroke-width="3" fill="none"/>',
};
