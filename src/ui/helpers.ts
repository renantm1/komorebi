import { svgURL } from '../art/illustrations';
import { icon } from './icons';
export { icon };
export const image = (svg: string, alt: string, cls = '') => `<img class="${cls}" src="${svgURL(svg)}" alt="${alt}" draggable="false"/>`;
export const button = (text: string, action: string, cls = 'primary', ico = 'arrow', extra = '') => `<button class="${cls}" data-action="${action}" ${extra}><span>${text}</span>${ico ? icon(ico) : ''}</button>`;
