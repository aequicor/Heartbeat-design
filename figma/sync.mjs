import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {connect, saveScreenshots} from './client.mjs';
import {compactDesktop} from './compact-desktop.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), 'utf8'));
const spec = read('./aurora.json');
const state = read('./migration-state.json');
const out = fileURLToPath(new URL('../exports/aurora-figma/', import.meta.url));
fs.mkdirSync(out, {recursive: true});
const client = await connect(spec), call = client.call;
const report = {revision: spec.revision, styles: {}, components: [], textNodes: [], chrome: [], navigation: [], masks: []};
const flat = node => [node, ...(node.children ?? []).flatMap(flat)];
const concrete = node => !node.id.includes(';');
const color = hex => ({r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255, space: 'SRGB'});
const shadow = (alpha, radius, y) => ({type: 'DROP_SHADOW', visible: true, color: {...color('#222B27'), a: alpha}, radius, offset: {x: 0, y}, spread: 0});
const seen = new Set();
let styles;

async function bindText(node, role) {
  if (seen.has(node.id) || node.type !== 'TEXT' || !node.fontName?.family || /Mono/i.test(node.fontName.family)) return;
  seen.add(node.id);
  if (!role) {
    if (['Title инструмента / опциональный', 'Thinking / title'].includes(node.name)) role = 'title';
    else if (['Subtitle инструмента / обязательный', 'Thinking / первые токены'].includes(node.name)) role = 'meta';
    else if (node.name === 'Thinking / полученные фрагменты') role = 'body';
    else role = node.fontSize >= 16 || (node.styleIds?.text && node.styleIds.text === state.desktopRefinement?.styles.detail) ? 'detail' : 'caption';
  }
  await call('apply_style_to_node', {nodeId: node.id, field: 'text', styleId: report.styles[role]});
  report.textNodes.push(node.id);
}

try {
  styles = await call('get_styles');
  for (const [role, value] of Object.entries(spec.processStyles)) {
    const existing = styles.texts.find(s => s.name === value.name);
    const props = {fontName: {family: 'Inter', style: value.weight}, fontSize: value.size, lineHeight: {unit: 'PIXELS', value: value.line}, letterSpacing: {unit: 'PIXELS', value: 0}};
    if (existing) { await call('update_text_style', {styleId: existing.id, ...props}); report.styles[role] = existing.id; }
    else report.styles[role] = (await call('create_text_style', {name: value.name, ...props})).styleId;
  }
  const effectStyles = {};
  for (const [key, name, effects] of [
    ['panel', 'Aurora/Глубина/Плавающая панель', [shadow(.08, 12, 3), shadow(.04, 2, 1)]],
    ['composer', 'Aurora/Глубина/Поле ввода', [shadow(.10, 16, 4), shadow(.04, 2, 1)]]
  ]) {
    const existing = styles.effects.find(s => s.name === name);
    if (existing) { await call('update_effect_style', {styleId: existing.id, effects}); effectStyles[key] = existing.id; }
    else effectStyles[key] = (await call('create_effect_style', {name, effects})).styleId;
  }
  report.effectStyles = effectStyles;
  for (const [name, hex] of Object.entries(spec.colors)) {
    if (!state.vars[name]) throw new Error(`Missing color token: ${name}`);
    await call('set_variable_value', {variableId: state.vars[name], modeId: state.collection.defaultModeId, value: {...color(hex), a: 1}});
  }
  const components = (await call('search_nodes', {root: spec.libraryPage, type: 'COMPONENT'})).nodes;
  for (const component of components.filter(n => /^(Инструмент \/ единый блок|Thinking \/ единый раскрываемый блок)/.test(n.name))) {
    const tree = (await call('get_node', {nodeId: component.id})).node;
    for (const node of flat(tree).filter(concrete)) await bindText(node);
    report.components.push(component.id);
  }
  for (const root of spec.pages) {
    for (const name of ['Title инструмента', 'Subtitle инструмента', 'Thinking /', 'Подпись / Ход работы', 'Название этапа']) {
      const nodes = (await call('search_nodes', {root, name, type: 'TEXT'})).nodes;
      for (const node of nodes.filter(concrete)) await bindText(node);
    }
    // Saved local overrides in the reviewed transcript also receive style links.
    for (const node of (await call('search_nodes', {root, name: 'Ход работы / доступ к сохранённым событиям', type: 'FRAME'})).nodes.filter(concrete)) {
      const tree = (await call('get_node', {nodeId: node.id})).node;
      for (const child of flat(tree)) await bindText(child);
    }
    for (const name of ['Контекст диалога', 'Открыть субагентов', 'Движок, модель и усилие', 'Выбрать режим доступа', 'Плавающий контекст и квота', 'Спокойная поверхность компактного ввода', 'Компактное поле ввода']) {
      const nodes = (await call('search_nodes', {root, name, type: 'FRAME'})).nodes.filter(n => concrete(n) && n.name === name);
      for (const node of nodes) {
        const composer = name === 'Спокойная поверхность компактного ввода', inner = name === 'Компактное поле ввода';
        await call('set_corner_radius', {nodeId: node.id, radius: inner ? spec.chrome.composerInnerRadius : composer ? spec.chrome.composerRadius : spec.chrome.panelRadius});
        if (!inner) await call('apply_style_to_node', {nodeId: node.id, field: 'effect', styleId: effectStyles[composer ? 'composer' : 'panel']});
        report.chrome.push(node.id);
      }
    }
    for (const nav of (await call('search_nodes', {root, name: 'Навигация', type: 'FRAME'})).nodes.filter(n => concrete(n) && n.name === 'Навигация' && n.width === spec.navigation.width)) {
      const tree = (await call('get_node', {nodeId: nav.id})).node;
      for (const node of flat(tree)) {
        if (node.type === 'FRAME' && (node.name.startsWith('Заголовок проекта') || node.name === 'Заголовок · Без проекта' || node.name === 'Единая модель сессий' || node.name === 'Показать больше...'))
          await call('resize_nodes', {nodeIds: [node.id], width: node.width, height: spec.navigation.rowHeight});
        if (node.name === 'Фон выбранной сессии') await call('resize_nodes', {nodeIds: [node.id], width: node.width, height: 28});
        if (node.name === 'Новый диалог и поиск') {
          await call('resize_nodes', {nodeIds: [node.id], width: node.width, height: spec.navigation.createRowHeight});
          await call('set_auto_layout', {nodeId: node.id, layoutMode: 'HORIZONTAL', paddingTop: 8, paddingBottom: 8, itemSpacing: 8});
          const button = node.children.find(n => n.name === 'Новый диалог');
          if (button) await call('set_layout_props', {nodeId: button.id, layoutSizingHorizontal: 'FILL'});
        }
        if (node.type === 'TEXT' && /^Показать больше/.test(node.characters)) await call('set_text', {nodeId: node.id, characters: 'Ещё диалоги'});
        if (node.type === 'TEXT' && node.name === 'Имя группы') await call('set_text_properties', {nodeId: node.id, fontSize: 13, lineHeight: {unit: 'PIXELS', value: 20}, fontName: {family: 'Roboto', style: 'Medium'}});
        if (node.type === 'TEXT' && (/имя проекта/i.test(node.name) || node.name === 'Раздел без проекта')) await call('set_text_properties', {nodeId: node.id, fontName: {family: node.fontName.family, style: 'Regular'}});
      }
      report.navigation.push(nav.id);
    }
    for (const node of (await call('search_nodes', {root, name: 'Мягкая маска', type: 'FRAME'})).nodes.filter(concrete)) {
      if (node.opacity !== 1) await call('set_opacity', {nodeId: node.id, opacity: 1});
      report.masks.push(node.id);
    }
    for (const node of (await call('search_nodes', {root, name: 'Текст ввода', type: 'TEXT'})).nodes.filter(concrete))
      if (['Написать сообщение...', 'Сообщение...'].includes(node.characters)) await call('set_text', {nodeId: node.id, characters: 'Сообщение'});
    console.log('Synchronized page', root);
  }
  const updatedStyles = await call('get_styles');
  if (!Object.values(report.styles).every(id => updatedStyles.texts.some(s => s.id === id))) throw new Error('Text style verification failed');
  const desktopStyles = await compactDesktop(client);
  await saveScreenshots(client, spec.verificationFrames, out);
  state.desktopRefinement.styles = desktopStyles;
  state.refinement = {revision: spec.revision, desktop: spec.desktop, styles: report.styles, effectStyles, components: report.components};
  fs.writeFileSync(new URL('./migration-state.json', import.meta.url), JSON.stringify(state, null, 2) + '\n');
  console.log({components: report.components.length, textNodes: report.textNodes.length, chrome: report.chrome.length, navigation: report.navigation.length});
} finally {
  client.close();
  fs.writeFileSync(`${out}/sync-report.json`, JSON.stringify(report, null, 2) + '\n');
}
