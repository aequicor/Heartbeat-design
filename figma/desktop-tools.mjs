import fs from 'node:fs';

const ledgerUrl = new URL('./desktop-components.json', import.meta.url);
const flat = n => [n, ...(n.children ?? []).flatMap(flat)];

export async function compactToolComponents(c, source, styles) {
  const ledger = fs.existsSync(ledgerUrl) ? JSON.parse(fs.readFileSync(ledgerUrl)) : {components: {}, instances: {}};
  const save = () => fs.writeFileSync(ledgerUrl, JSON.stringify(ledger, null, 2) + '\n');
  const get = async id => (await c.call('get_node', {nodeId: id})).node;
  const instances = flat(source).filter(n => n.type === 'INSTANCE' && n.mainComponent && n.children?.some(ch => ch.name === 'Инструмент / кликабельный заголовок') && flat(n).some(ch => ch.name === 'Опциональный title и обязательный subtitle' || ch.name === 'Thinking / title'));
  for (const instance of instances) {
    let target = Object.values(ledger.components).find(x => x.id === instance.mainComponent.id);
    if (!target) target = ledger.components[instance.mainComponent.id];
    if (!target) {
      const original = await get(instance.mainComponent.id);
      const inventory = (await c.call('search_nodes', {root: '2:8576', type: 'COMPONENT'})).nodes;
      const right = Math.max(...inventory.map(n => n.x + n.width));
      const clone = await c.call('clone_node', {nodeId: original.id});
      target = {id: clone.nodeId, original: original.id};
      ledger.components[original.id] = target; save();
      const kind = flat(original).some(n => n.name === 'Thinking / title') ? 'Thinking' : 'Инструмент · строка';
      await c.call('batch_rename_nodes', {renames: [{nodeId: target.id, name: `Aurora/Desktop/${kind}/${original.name}`} ]});
      const copied = await get(target.id);
      await c.call('move_nodes', {nodeIds: [target.id], dx: right + 80 - copied.x, dy: 0});
    }
    const component = await get(target.id);
    for (const text of flat(component).filter(n => n.type === 'TEXT' && n.name.startsWith('Thinking /'))) {
      const role = text.name === 'Thinking / title' ? 'title' : text.name === 'Thinking / первые токены' ? 'meta' : 'thinking';
      await c.call('apply_style_to_node', {nodeId: text.id, field: 'text', styleId: styles[role]});
      await c.call('set_fills', {nodeId: text.id, fills: [{type: 'SOLID', color: role === 'meta' ? {r:95/255,g:99/255,b:104/255} : {r:0,g:0,b:0}}]});
    }
    if (flat(component).some(n => n.name === 'Thinking / title')) {
      const header = component.children.find(n => n.name === 'Инструмент / кликабельный заголовок');
      await c.call('set_auto_layout', {nodeId: header.id, layoutMode: 'HORIZONTAL', paddingTop: 4, paddingBottom: 4});
      const body = component.children.find(n => n.name === 'Thinking / полный текст');
      if (body) await c.call('set_auto_layout', {nodeId: body.id, layoutMode: 'VERTICAL', paddingTop: 8, paddingBottom: 8});
    }
    for (const column of flat(component).filter(n => n.name === 'Опциональный title и обязательный subtitle')) {
      const title = column.children.find(n => n.name === 'Title инструмента / опциональный');
      const status = column.children.find(n => n.name === 'Subtitle инструмента / обязательный');
      const header = flat(component).find(n => n.id === column.parentId);
      await c.call('set_auto_layout', {nodeId: column.id, layoutMode: 'HORIZONTAL', itemSpacing: 12, counterAxisAlignItems: 'CENTER'});
      await c.call('set_layout_props', {nodeId: column.id, layoutSizingVertical: 'HUG'});
      if (title) {
        await c.call('apply_style_to_node', {nodeId: title.id, field: 'text', styleId: styles.title});
        await c.call('set_text_properties', {nodeId: title.id, textAutoResize: 'HEIGHT', textTruncation: 'ENDING', maxLines: 1});
        await c.call('set_layout_props', {nodeId: title.id, layoutSizingHorizontal: 'FILL'});
        await c.call('set_fills', {nodeId: title.id, fills: [{type: 'SOLID', color: {r: 0, g: 0, b: 0}}]});
      }
      await c.call('apply_style_to_node', {nodeId: status.id, field: 'text', styleId: styles.meta});
      await c.call('set_text', {nodeId: status.id, characters: status.characters.split(' · ')[0]});
      await c.call('set_text_properties', {nodeId: status.id, textAutoResize: 'WIDTH_AND_HEIGHT'});
      await c.call('set_layout_props', {nodeId: status.id, layoutSizingHorizontal: 'HUG'});
      await c.call('set_fills', {nodeId: status.id, fills: [{type: 'SOLID', color: {r: 95/255, g: 99/255, b: 104/255}}]});
      for (const child of header.children.filter(n => n.name === 'Иконка / центр колонки 24' || n.name === 'Шеврон / центр текстовой колонки'))
        await c.call('set_layout_props', {nodeId: child.id, layoutSizingVertical: 'HUG'});
      await c.call('set_auto_layout', {nodeId: header.id, layoutMode: 'HORIZONTAL', paddingTop: 6, paddingBottom: 6});
    }
    if (instance.mainComponent.id !== target.id) {
      await c.call('swap_component', {instanceId: instance.id, componentId: target.id});
      const swapped = await get(instance.id);
      const originals = flat(instance).filter(n => n.type === 'TEXT');
      for (const text of flat(swapped).filter(n => n.type === 'TEXT')) {
        const index = originals.findIndex(n => n.name === text.name);
        if (index < 0) continue;
        const [previous] = originals.splice(index, 1);
        const characters = previous.name === 'Subtitle инструмента / обязательный'
          ? previous.characters.split(' · ')[0]
          : previous.characters;
        if (text.characters !== characters) await c.call('set_text', {nodeId: text.id, characters});
      }
    }
    ledger.instances[instance.id] = target.id; save();
  }
  for (const list of flat(source).filter(n => n.name === 'Сохранённые события завершённого этапа'))
    await c.call('set_auto_layout', {nodeId: list.id, layoutMode: 'VERTICAL', itemSpacing: 2});
}
