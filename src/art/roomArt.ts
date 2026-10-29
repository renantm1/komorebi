import { restaurantSVG } from './illustrations';
export function roomSVG(wall: string): string {
  let art = restaurantSVG();
  // Furniture is rendered as interactive sprites now, rather than baked into the backdrop.
  art = art.replace(/<g transform="translate\(52 464\)">[\s\S]*?<\/g>/, '')
    .replace(/<g transform="translate\(115 640\)">[\s\S]*?<\/g>/, '')
    .replace(/<g fill="#7d5e43"[\s\S]*?<\/g>/, '').replace(/<g fill="#a47b51"[\s\S]*?<\/g>/, '');
  if (wall === 'wall-sage') art = art.replace('#f0e3c8', '#d4dfc1').replace('#ddc5a0', '#b9caa5');
  if (wall === 'wall-sakura') {
    art = art.replace('#f0e3c8', '#f1dfd1').replace('#ddc5a0', '#dfc2ae');
    art = art.replace('</defs>', `<pattern id="sakura-paper" width="90" height="78" patternUnits="userSpaceOnUse"><g stroke="#c38c7b" fill="none" opacity=".2"><path d="m19 23 17 15m-8-26 3 15m0 0 13 1"/><path d="M58 49q-8-15-15 0 6 15 15 0 15 7 14-4-9-9-14 4Z"/></g></pattern></defs>`);
    art = art.replace('<path fill="url(#floor)"', '<rect width="1120" height="425" fill="url(#sakura-paper)"/><path fill="url(#floor)"');
  }
  return art;
}
export function floorSVG(id: string): string {
  const tatami = `<pattern id="p" width="280" height="150" patternUnits="userSpaceOnUse"><rect width="280" height="150" fill="#b9bc8a"/><path d="M0 0h280v150H0Z" fill="none" stroke="#7b8d69" stroke-width="7"/>${Array.from({ length: 28 }, (_, i) => `<path d="M8 ${6 + i * 5}h264" stroke="#d5d1a0" opacity=".5" stroke-width="1"/>`).join('')}<path d="M140 4v142" stroke="#a2aa78" stroke-width="2"/></pattern>`;
  const tiles = `<pattern id="p" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#daccaa"/><path d="M0 0h45v45H0Zm45 45h45v45H45Z" fill="#b99372" opacity=".65"/><path d="M0 0h90v90H0Zm45 0v90M0 45h90" stroke="#eddfbf" stroke-width="3"/><path d="m22 14 8 8-8 8-8-8m53 28 8 8-8 8-8-8" fill="none" stroke="#a78668" opacity=".4"/></pattern>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="305" viewBox="0 0 1120 305"><defs>${id === 'floor-tatami' ? tatami : tiles}</defs><rect width="1120" height="305" fill="url(#p)"/><path d="M0 0h1120v305H0Z" fill="#e9cd9212"/></svg>`;
}
