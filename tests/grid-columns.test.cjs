const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { migrateGridColumns } = require('../scripts/migrate-grid-columns.cjs');
const schema = JSON.parse(fs.readFileSync('blocks/grid.liquid', 'utf8').match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
test('Columns exposes the observed settings and conditional editor branches', () => {
  const settings = Object.fromEntries(schema.settings.filter((s) => s.id).map((s) => [s.id, s]));
  assert.deepEqual(Object.keys(settings), ['columns_desktop','columns_mobile','enable_swipe_mobile','custom_columns','columns_per_breakpoint','gap_horizontal','gap_vertical','gap_horizontal_mobile','gap_vertical_mobile','width','custom_width','padding_top','padding_bottom','customize_mobile_padding','padding_top_mobile','padding_bottom_mobile']);
  assert.deepEqual(settings.columns_desktop.options.map((o) => o.value), ['2','3','4','5','6']);
  assert.deepEqual(settings.columns_mobile.options.map((o) => o.value), ['1','2']);
  assert.equal(settings.columns_per_breakpoint.visible_if, '{{ block.settings.custom_columns }}');
  assert.equal(settings.gap_vertical_mobile.visible_if, '{{ block.settings.enable_swipe_mobile == false }}');
  assert.equal(settings.custom_width.visible_if, "{{ block.settings.width == 'custom' }}");
  assert.equal(settings.padding_top_mobile.visible_if, '{{ block.settings.customize_mobile_padding }}');
  assert.equal(settings.padding_bottom_mobile.visible_if, '{{ block.settings.customize_mobile_padding }}');
  assert.deepEqual(settings.width.options.map((o) => o.value), ['fill', 'custom']);
  assert.deepEqual([settings.gap_horizontal.max, settings.gap_vertical.max, settings.gap_horizontal_mobile.max, settings.gap_vertical_mobile.max], [100,100,50,50]);
  assert.deepEqual([settings.custom_width.min, settings.custom_width.max], [10,100]);
  assert.deepEqual(schema.blocks, [{type:'_column'}]);
  assert.equal(schema.presets[0].blocks.length, 4);
});
test('legacy Grid migration preserves content, order and disabled state while mapping tablet and gaps', () => {
  const first = {type:'text',settings:{text:'First'},disabled:true};
  const second = {type:'image',settings:{image:'shopify://image/second.jpg'}};
  const grid = {type:'grid',settings:{columns_desktop:4,columns_tablet:2,columns_mobile:1,gap:64,gap_mobile:24,alignment:'middle'},blocks:{first,second},block_order:['second','first']};
  const document={blocks:{grid}};
  assert.equal(migrateGridColumns(document),true);
  assert.equal(grid.settings.columns_desktop,'4');
  assert.equal(grid.settings.gap_horizontal,64);assert.equal(grid.settings.gap_vertical,64);
  assert.equal(grid.settings.gap_horizontal_mobile,24);assert.equal(grid.settings.gap_vertical_mobile,24);
  assert.equal(grid.settings.columns_per_breakpoint,'xs:1, sm:1, md:2, lg:2, xl:4, xxl:4');
  assert.equal(grid.settings.columns_tablet,undefined);assert.equal(grid.settings.alignment,undefined);
  assert.deepEqual(grid.block_order,['second_column','first_column']);
  assert.equal(grid.blocks.first_column.disabled,true);
  assert.strictEqual(grid.blocks.first_column.blocks.first.blocks.first,first);
  assert.strictEqual(grid.blocks.second_column.blocks.second.blocks.second,second);
  assert.equal(grid.blocks.first_column.blocks.first.settings.position,'center');
  assert.equal(migrateGridColumns(document),false);
});
test('Grid templates have only Column direct children and valid nested block references', () => {
  const data=JSON.parse(fs.readFileSync('templates/page.about-us.json','utf8').replace(/^\s*\/\*[\s\S]*?\*\/\s*/,''));
  const visit=(value)=>{
    if(!value||typeof value!=='object')return;
    if(value.type==='grid')for(const child of Object.values(value.blocks||{}))assert.equal(child.type,'_column');
    for(const child of Object.values(value))visit(child);
  };
  visit(data);
});
