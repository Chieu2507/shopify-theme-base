#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'blocks/grid.liquid'), 'utf8');
const definition = JSON.parse(source.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
const settingsById = new Map(definition.settings.filter((s) => s.id).map((s) => [s.id, s]));
function migrateGridColumns(document) {
  const before = JSON.stringify(document);
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'grid') {
      const settings = value.settings ||= {};
      const oldAlignment = settings.alignment;
      if (settings.gap != null) {
        settings.gap_horizontal ??= settings.gap;
        settings.gap_vertical ??= settings.gap;
      }
      if (settings.gap_mobile != null) {
        settings.gap_horizontal_mobile ??= settings.gap_mobile;
        settings.gap_vertical_mobile ??= settings.gap_mobile;
      }
      const desktop = Number(settings.columns_desktop || 4);
      const mobile = Number(settings.columns_mobile || 1);
      const tablet = Number(settings.columns_tablet || desktop);
      if (!settings.custom_columns && (tablet !== desktop || desktop < 2 || mobile > 2)) {
        settings.custom_columns = true;
        settings.columns_per_breakpoint = `xs:${mobile}, sm:${mobile}, md:${tablet}, lg:${tablet}, xl:${desktop}, xxl:${desktop}`;
      }
      for (const [id, value] of Object.entries(settings)) {
        const definition = settingsById.get(id);
        if (!definition) delete settings[id];
        else if (id === 'columns_desktop') settings[id] = String(Math.min(6, Math.max(2, Number(value) || 4)));
        else if (id === 'columns_mobile') settings[id] = String(Math.min(2, Math.max(1, Number(value) || 1)));
        else if (definition.type === 'range' && typeof value === 'number') settings[id] = Math.min(definition.max, Math.max(definition.min, value));
      }
      const children = value.blocks || {};
      const array = Array.isArray(children);
      const rebuilt = array ? [] : {};
      const mapping = new Map();
      for (const [id, child] of Object.entries(children)) {
        if (child.type === '_column') { rebuilt[array ? rebuilt.length : id] = child; mapping.set(id, id); continue; }
        let wrapperId = `${id}_column`;
        while (!array && (children[wrapperId] || rebuilt[wrapperId])) wrapperId += '_migrated';
        let content = child;
        if (oldAlignment === 'middle' || oldAlignment === 'bottom') {
          content = { type: 'group', settings: { direction: 'vertical', width: 'fill', height: 'fill', position: oldAlignment === 'middle' ? 'center' : 'bottom', gap_desktop: 0, gap_mobile: 0 }, blocks: array ? [child] : { [id]: child }, ...(!array && { block_order: [id] }) };
        }
        const wrapper = { type: '_column', settings: { gap_desktop: 0, gap_mobile: 0 }, blocks: array ? [content] : { [id]: content }, ...(!array && { block_order: [id] }) };
        if (child.disabled != null) wrapper.disabled = child.disabled;
        if (array) rebuilt.push(wrapper); else rebuilt[wrapperId] = wrapper;
        mapping.set(id, wrapperId);
      }
      value.blocks = rebuilt;
      if (!array && value.block_order) value.block_order = value.block_order.map((id) => mapping.get(id) || id);
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(document);
  return before !== JSON.stringify(document);
}
function migrateFile(file) {
  const source = fs.readFileSync(file, 'utf8');
  const prefix = source.match(/^\s*\/\*[\s\S]*?\*\/\s*/)?.[0] || '';
  const document = JSON.parse(source.slice(prefix.length));
  if (!migrateGridColumns(document)) return false;
  fs.writeFileSync(file, prefix + JSON.stringify(document, null, 2) + '\n');
  return true;
}
if (require.main === module) {
  for (const file of process.argv.slice(2)) console.log(`${migrateFile(file) ? 'Migrated' : 'Unchanged'}: ${file}`);
}
module.exports = { migrateGridColumns, migrateFile };
