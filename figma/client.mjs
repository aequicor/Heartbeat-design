import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {homedir} from 'node:os';
import {join} from 'node:path';

export async function connect(spec) {
  const server = process.env.FIGWRIGHT_SERVER ?? join(homedir(), '.local/share/figwright/server/node_modules/@figwright/mcp/dist/index.mjs');
  const child = spawn(process.execPath, [server], {stdio: ['pipe', 'pipe', 'inherit']});
  let sequence = 0;
  const pending = new Map();
  let stopped;
  const fail = error => {
    stopped = error;
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(error);
    }
    pending.clear();
  };
  child.stdin.on('error', fail);
  child.on('error', fail);
  child.on('exit', () => fail(new Error('Figwright server stopped')));
  createInterface({input: child.stdout}).on('line', line => {
    let result; try { result = JSON.parse(line); } catch { return; }
    const p = pending.get(result.id); if (!p) return;
    clearTimeout(p.timer);
    pending.delete(result.id);
    if (result.error) p.reject(new Error(result.error.message));
    else p.resolve(result.result);
  });
  const rpc = (method, params) => new Promise((resolve, reject) => {
    if (stopped) { reject(stopped); return; }
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 120000);
    pending.set(id, {resolve, reject, timer});
    child.stdin.write(JSON.stringify({jsonrpc: '2.0', id, method, params}) + '\n');
  });
  const call = async (name, args = {}) => {
    const response = await rpc('tools/call', {name, arguments: args});
    if (response.isError) throw new Error(`${name}: ${response.content.map(c => c.text).join(' ')}`);
    const value = response.content.find(c => c.type === 'text')?.text;
    try { return JSON.parse(value); } catch { return value; }
  };
  const close = () => { child.stdin.end(); child.kill(); };
  try {
    await rpc('initialize', {protocolVersion: '2025-03-26', capabilities: {}, clientInfo: {name: 'aurora-sync', version: '1'}});
    child.stdin.write(JSON.stringify({jsonrpc: '2.0', method: 'notifications/initialized'}) + '\n');
    let ready = false;
    for (let i = 0; i < 20; i++) {
      const result = await call('list_files');
      if (result.files.some(file => file.fileName === spec.fileName)) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    if (!ready) throw new Error('Open Aurora-DS and the Figwright plugin in Figma');
    await call('use_file', {fileName: spec.fileName});
    const {nodes} = await call('search_nodes', {root: spec.pages[2], type: 'FRAME'});
    if (!nodes.some(node => node.id === spec.desktop)) {
      throw new Error(`Desktop ${spec.desktop} does not match the Aurora migration ledger`);
    }
    return {call, close};
  } catch (error) { close(); throw error; }
}

export async function saveScreenshots(client, nodeIds, outDir) {
  const {saved} = await client.call('save_screenshots', {nodeIds, outDir, scale: 1});
  for (const id of nodeIds) {
    if (!saved.some(frame => frame.nodeId === id && frame.path && !frame.empty)) {
      throw new Error(`Missing screenshot for frame ${id}`);
    }
  }
}
