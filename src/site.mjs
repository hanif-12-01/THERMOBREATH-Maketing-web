import { activateExplorer } from './explorer.mjs';
import { activateBreath } from './breath.mjs';

/**
 * @template {Element} T
 * @param {ParentNode} root
 * @param {string} selector
 * @param {{new (): T}} type
 */
function find(root, selector, type) {
  const element = root.querySelector(selector);
  if (!(element instanceof type)) throw new Error(`Invalid UI element: ${selector}`);
  return element;
}

const navigation = find(document, '#navigation', HTMLElement);
const menu = find(document, '[data-menu]', HTMLButtonElement);
const setMenu = (open) => {
  navigation.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
};
menu.hidden = false;
menu.addEventListener('click', () => setMenu(!navigation.classList.contains('open')));
navigation.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    setMenu(false);
    menu.focus();
  }
});
matchMedia('(min-width: 896px)').addEventListener('change', () => setMenu(false));

const flow = find(document, '[data-flow]', HTMLElement);
const steps = [...flow.querySelectorAll('button')];
const descriptions = [...flow.querySelectorAll('article')];
const flowDisplay = flow.querySelector('.flow-display');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
activateBreath(find(document, '[data-breath]', HTMLElement), reducedMotion);
let animationFrame;
steps.forEach((step, i) => {
  descriptions[i].hidden = i !== 0;
  step.addEventListener('click', () => {
    steps.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === i));
      descriptions[index].hidden = index !== i;
    });
    if (reducedMotion.matches) return;
    flowDisplay.classList.remove('animating');
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => {
      animationFrame = requestAnimationFrame(() => flowDisplay.classList.add('animating'));
    });
  });
});
find(flow, '[data-flow-controls]', HTMLElement).hidden = false;

activateExplorer(find(document, '[data-explorer]', HTMLElement), reducedMotion);
