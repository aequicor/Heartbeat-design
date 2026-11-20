import fs from 'node:fs';

export async function blackIcons(c, desktopRoots, historyRoots) {
  const state = JSON.parse(fs.readFileSync(new URL('./migration-state.json', import.meta.url)));
  const ledgerPath = new URL('./desktop-components.json', import.meta.url);
  const ledger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath)) : {components: {}};
  const spec = JSON.parse(fs.readFileSync(new URL('./aurora.json', import.meta.url)));
  const roots = new Set([...historyRoots, spec.icons.closedFolder, spec.icons.openFolder, ...Object.values(ledger.components).map(n => n.id)]);
  for (const root of desktopRoots) {
    for (const name of ['Навигация', 'Лента до нижнего края / поле поверх истории', 'Заголовок диалога'])
      for (const n of (await c.call('search_nodes', {root, name, type: 'FRAME'})).nodes.filter(n => n.name === name && !n.id.includes(';'))) roots.add(n.id);
    for (const n of (await c.call('search_nodes', {root, name: 'Heartbeat', type: 'TEXT'})).nodes.filter(n => !n.id.includes(';'))) roots.add(n.parentId);
    for (const n of (await c.call('search_nodes', {root, name: 'Настройки', type: 'FRAME'})).nodes.filter(n => n.name === 'Настройки' && !n.id.includes(';'))) roots.add(n.parentId);
  }
  const flat = n => [n, ...(n.children ?? []).flatMap(flat)];
  const protectedColors = new Set(Object.entries(state.vars)
    .filter(([name]) => name.startsWith('aurora.status.') || ['aurora.green', 'aurora.warning', 'aurora.error'].includes(name))
    .map(([, id]) => id));
  const ordinary = paint => {
    if (paint.type !== 'SOLID' || !paint.color || (paint.opacity ?? 1) !== 1) return false;
    if (protectedColors.has(paint.boundVariables?.color)) return false;
    const {r, g, b} = paint.color;
    return Math.max(r, g, b) < .6 && Math.max(r, g, b) - Math.min(r, g, b) < .2;
  };
  const changed = [];
  for (const id of roots) {
    const root = (await c.call('get_node', {nodeId: id})).node;
    for (const n of flat(root).filter(n => ['VECTOR', 'BOOLEAN_OPERATION'].includes(n.type))) {
      for (const [field, tool] of [['fills', 'set_fills'], ['strokes', 'set_strokes']]) {
        if (!n[field]?.some(p => ordinary(p) && p.boundVariables?.color !== state.vars['aurora.ink'])) continue;
        await c.call(tool, {nodeId: n.id, [field]: n[field].map(p => ordinary(p) ? {...p, color: {r: 0, g: 0, b: 0}, boundVariables: {color: state.vars['aurora.ink']}} : p)});
        changed.push(n.id);
      }
    }
  }
  fs.writeFileSync(new URL('../exports/aurora-figma/black-icons.json', import.meta.url), JSON.stringify({changed}, null, 2) + '\n');
  return changed.length;
}
