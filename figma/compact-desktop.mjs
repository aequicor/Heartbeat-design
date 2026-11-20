import fs from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {connect, saveScreenshots} from './client.mjs';
import {compactToolComponents} from './desktop-tools.mjs';
import {blackIcons} from './black-icons.mjs';

const flat = n => [n, ...(n.children ?? []).flatMap(flat)];
const out = new URL('../exports/aurora-figma/', import.meta.url);
const spec = JSON.parse(fs.readFileSync(new URL('./aurora.json', import.meta.url)));
const density = spec.desktopDensity;
const {screens: desktopRoots, historySources: historyRoots, process: processStyles} = density;

export async function compactDesktop(c, toolsOnly = false) {
  fs.mkdirSync(out, {recursive: true});
  const report = {desktopRoots, historyRoots, styles: {}, changed: []};
  const write = async (tool, args) => { await c.call(tool, args); report.changed.push({tool, ...args}); };
  const tree = async id => (await c.call('get_node', {nodeId: id})).node;
  const size = async (n, height, width = n.width) => {
    await write('resize_nodes', {nodeIds: [n.id], width, height});
    const props = {};
    for (const key of ['layoutSizingHorizontal', 'layoutSizingVertical'])
      if (['FILL', 'HUG'].includes(n[key])) props[key] = n[key];
    if (Object.keys(props).length) await write('set_layout_props', {nodeId: n.id, ...props});
  };
  const layout = async (n, props) => write('set_auto_layout', {nodeId: n.id, layoutMode: n.layout.mode, ...props});
  const moveY = async (n, y) => { if (n.y !== y) await write('move_nodes', {nodeIds: [n.id], dx: 0, dy: y - n.y}); };
  const blackText = async n => {
    if (n.fills?.length !== 1 || n.fills[0].type !== 'SOLID') return;
    const paint = n.fills[0];
    if (['Subtitle инструмента / обязательный', 'Thinking / первые токены'].includes(n.name)) {
      await write('set_fills', {nodeId: n.id, fills: [{type: 'SOLID', color: {r: 95 / 255, g: 99 / 255, b: 104 / 255}, opacity: paint.opacity, visible: paint.visible}]});
      return;
    }
    // Keep white labels and coloured status text.
    const {r, g, b} = paint.color;
    if (Math.min(r, g, b) > .95 || Math.max(r, g, b) - Math.min(r, g, b) > .2) return;
    await write('set_fills', {nodeId: n.id, fills: [{type: 'SOLID', color: {r: 0, g: 0, b: 0}, opacity: paint.opacity, visible: paint.visible}]});
  };
  async function fitBubbles(source) {
    const nodes = flat(source);
    for (const text of nodes.filter(n => n.type === 'TEXT' && ['Текст пользователя', 'Текст ответа'].includes(n.name))) {
      const user = text.name === 'Текст пользователя';
      let owner = nodes.find(n => n.id === text.parentId);
      while (owner && owner.name !== (user ? 'Яблочная поверхность пользователя' : 'Ответ агента / единая карточка'))
        owner = nodes.find(n => n.id === owner.parentId);
      if (!owner || (!user && owner.width >= 400)) continue;
      await write('set_layout_props', {nodeId: text.id, layoutSizingHorizontal: 'HUG'});
      await write('set_text_properties', {nodeId: text.id, textAutoResize: 'WIDTH_AND_HEIGHT'});
      const measured = await tree(text.id);
      const width = Math.min(user ? 520 : 632, Math.max(64, Math.ceil(measured.width) + 24));
      await size(owner, owner.height, width);
      await write('set_text_properties', {nodeId: text.id, textAutoResize: 'HEIGHT'});
      await write('set_layout_props', {nodeId: text.id, layoutSizingHorizontal: 'FILL'});
    }
  }
  try {
    const styles = await c.call('get_styles');
    for (const [role, label, family, weight, fontSize, line] of [
      ['message', 'Сообщение', spec.message.family, 'Regular', density.message.size, density.message.line],
      ['title', 'Действие', 'Inter', processStyles.titleWeight, ...processStyles.title],
      ['meta', 'Статус', 'Inter', 'Regular', ...processStyles.meta],
      ['thinking', 'Размышления', 'Inter', 'Regular', ...processStyles.thinking],
      ['caption', 'Подпись хода работы', 'Inter', 'Regular', ...processStyles.caption],
      ['detail', 'Подробности', 'Inter', 'Regular', ...processStyles.detail],
    ]) {
      const name = `Aurora/Desktop/Компактный/${label}`;
      const props = {fontName: {family, style: weight}, fontSize, lineHeight: {unit: 'PIXELS', value: line}, letterSpacing: {unit: 'PIXELS', value: 0}};
      const found = styles.texts.find(s => s.name === name);
      if (found) { await c.call('update_text_style', {styleId: found.id, ...props}); report.styles[role] = found.id; }
      else report.styles[role] = (await c.call('create_text_style', {name, ...props})).styleId;
    }

    for (const id of historyRoots) {
      const source = await tree(id);
      if (source?.type !== 'COMPONENT' || source.width < 600) throw new Error(`Unexpected desktop history ${id}`);
      await layout(source, {itemSpacing: density.messageGap});
      for (const n of toolsOnly ? [] : flat(source)) {
        if (n.type === 'TEXT' && n.fontName?.family && !/Mono/i.test(n.fontName.family)) {
          let role;
          if (['Title инструмента / опциональный', 'Thinking / title'].includes(n.name)) role = 'title';
          else if (['Subtitle инструмента / обязательный', 'Thinking / первые токены'].includes(n.name)) role = 'meta';
          else if (n.name === 'Thinking / полученные фрагменты') role = 'thinking';
          else if (/Название этапа|Подпись \/ Ход работы/.test(n.name)) role = 'caption';
          else if (/^(Текст пользователя|Текст ответа|Рекомендация в тексте ответа)/.test(n.name)) role = 'message';
          else if (n.name.startsWith('Текст /')) role = 'detail';
          else if (n.fontSize >= 16 || [report.styles.detail, report.styles.message].includes(n.styleIds?.text))
            role = n.fontName.family === 'Inter' ? 'detail' : 'message';
          if (role) await write('apply_style_to_node', {nodeId: n.id, field: 'text', styleId: report.styles[role]});
          else await write('set_text_properties', {nodeId: n.id, fontSize: 14, lineHeight: {unit: 'PIXELS', value: 20}, ...(n.name === 'Время' ? {textAutoResize: 'WIDTH_AND_HEIGHT'} : {})});
          await blackText(n);
        }
        if (n.name === 'Инструмент / кликабельный заголовок') {
          const padding = flat(n).some(child => child.name === 'Thinking / title') ? 4 : 6;
          await layout(n, {paddingTop: padding, paddingBottom: padding});
        }
        if (n.type === 'FRAME' && n.height < 20 && n.children?.some(ch => ch.name === 'Время')) await size(n, 20);
        if (/^(Thinking \/ полный текст|Подробности инструмента \/ внутри блока)$/.test(n.name)) await layout(n, {paddingTop: 8, paddingBottom: 8});
        if (n.name === 'Ход работы / раскрыть историю этого ответа') await size(n, 32);
        if (n.name.endsWith('/ раскрытие этапа')) await size(n, 28);
      }
      await compactToolComponents(c, await tree(id), report.styles);
      if (!toolsOnly) await fitBubbles(await tree(id));
      // The timeline is absolute artwork. Realign it to the resized event headers.
      const updated = await tree(id);
      for (const stage of flat(updated).filter(n => n.children?.some(ch => ch.name === 'Хронология / маркеры на общей линии'))) {
        const contents = flat(stage).find(n => n.name === 'Сохранённые события завершённого этапа');
        const rail = stage.children.find(n => n.name === 'Хронология / маркеры на общей линии');
        const events = contents?.children.filter(n => n.type === 'INSTANCE') ?? [];
        let end = 20;
        for (let i = 0; i < events.length; i++) {
          const header = events[i].children.find(n => n.name === 'Инструмент / кликабельный заголовок');
          if (!header) continue;
          const dot = rail.children[i * 2 + 1], line = rail.children[i * 2];
          if (!dot || !line) continue;
          const y = events[i].y + header.height / 2 - dot.height / 2;
          await moveY(line, end);
          await size(line, Math.max(1, y - end));
          await moveY(dot, y);
          end = y + dot.height;
        }
        if (!contents) continue;
        await size(rail, contents.height);
        const spine = stage.children.find(n => n.name === 'Линия и маркер этапа');
        if (spine) {
          await size(spine, contents.height);
          const tail = spine.children.find(n => n.name === 'Связь со следующим этапом');
          if (tail) await size(tail, Math.max(1, contents.height - tail.y));
        }
      }
      console.log('Compact history', id);
    }

    for (const root of toolsOnly ? [] : desktopRoots) {
      for (const name of ['Навигация', 'Лента до нижнего края / поле поверх истории', 'Заголовок диалога']) {
        const matches = (await c.call('search_nodes', {root, name, type: 'FRAME'})).nodes.filter(n => n.name === name && !n.id.includes(';'));
        for (const match of matches) {
          const section = await tree(match.id), nav = name === 'Навигация';
          for (const n of flat(section)) {
            if (n.type === 'TEXT') {
              await write('set_text_properties', {nodeId: n.id, fontSize: 14, lineHeight: {unit: 'PIXELS', value: 20}});
              await blackText(n);
            }
            if (nav) {
              if (n.type === 'TEXT' && (/имя проекта/i.test(n.name) || n.name === 'Раздел без проекта'))
                await write('set_text_properties', {nodeId: n.id, fontName: {family: n.fontName.family, style: 'Regular'}});
              if (n.name === 'Название сессии / плавное затенение' && n.height < 20) await size(n, 20);
              if (n.type === 'FRAME' && n.width === 240 && n.height === 32) await size(n, 28);
              if (n.name === 'Фон выбранной сессии') { await size(n, 24); await moveY(n, 2); }
              if (n.name === 'Новый диалог и поиск') await size(n, 44);
              if (n.name === 'Новый диалог') await size(n, 28);
              if (n.name === 'Поиск по диалогам') await size(n, 28, 28);
              if (['Проекты', 'Боковая панель / содержимое списка'].includes(n.name) && n.layout?.mode === 'VERTICAL') await layout(n, {itemSpacing: spec.navigation.projectGap});
            } else {
              if (['Верхняя плавающая область / параметры выполнения', 'Параметры выполнения и режим доступа', 'Движок, модель и усилие', 'Выбрать режим доступа', 'Плавающий контекст и квота'].includes(n.name)) await size(n, 32);
              if (['Выбрать движок', 'Выбрать модель', 'Выбрать усилие'].includes(n.name)) await size(n, 28);
              if (n.name === 'Движок, модель и усилие') await layout(n, {itemSpacing: 12, paddingLeft: 10, paddingRight: 10});
              if (n.name === 'Плавающий ввод / поверх истории') { await size(n, density.chrome.composerHeight); await moveY(n, section.height - 16 - density.chrome.composerHeight); }
              if (n.name === 'Спокойная поверхность компактного ввода') { await size(n, density.chrome.composerHeight); await write('set_corner_radius', {nodeId: n.id, radius: density.chrome.composerRadius}); }
              if (n.name === 'Компактное поле ввода') { await layout(n, {paddingTop: 6, paddingBottom: 6, paddingLeft: 6, paddingRight: 6}); await write('set_corner_radius', {nodeId: n.id, radius: density.chrome.composerInnerRadius}); }
              if (['Прикрепить файл', 'Отправить'].includes(n.name) && n.width === 36 && n.height === 36) await size(n, 32, 32);
            }
          }
        }
      }
      console.log('Compact screen', root);
    }
    if (!toolsOnly) await blackIcons(c, desktopRoots, historyRoots);
    await saveScreenshots(c, [spec.desktop, '2:55599', '2:56219'], fileURLToPath(new URL('./compact/', out)));
    return report.styles;
  } finally {
    fs.writeFileSync(new URL('compact-report.json', out), JSON.stringify(report, null, 2) + '\n');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const client = await connect(spec);
  try {
    await compactDesktop(client, process.argv.includes('--tools-only'));
  } finally {
    client.close();
  }
}
