#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const testimonialSections = new Set([
  'testimonial-carousel',
]);
const commonSections = new Set([
  'testimonials-background-custom',
  'testimonials-horizontal-custom',
]);

// Change types only; retain IDs, settings, content, order and disabled state.
function migrateTestimonialCarousel(document) {
  let changed = false;
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    const privateCarousel = testimonialSections.has(value.type);
    if (privateCarousel || commonSections.has(value.type)) {
      const carouselType = privateCarousel ? '_testimonial-carousel' : 'carousel';
      const slideType = privateCarousel ? '_testimonial-slide' : 'slide';
      for (const block of Object.values(value.blocks || {})) {
        if (block.type !== 'carousel' && block.type !== '_testimonial-carousel') continue;
        if (block.type !== carouselType) {
          block.type = carouselType;
          changed = true;
        }
        for (const slide of Object.values(block.blocks || {})) {
          if (!['slide', '_testimonial-slide'].includes(slide.type) || slide.type === slideType) continue;
          slide.type = slideType;
          changed = true;
        }
      }
    }
    for (const child of Object.values(value)) visit(child);
  }
  visit(document);
  return changed;
}

function migrateFile(file) {
  const source = fs.readFileSync(file, 'utf8');
  const prefix = source.match(/^\s*\/\*[\s\S]*?\*\/\s*/)?.[0] || '';
  const document = JSON.parse(source.slice(prefix.length));
  if (!migrateTestimonialCarousel(document)) return false;
  fs.writeFileSync(file, prefix + JSON.stringify(document, null, 2) + '\n');
  return true;
}

if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files.length) throw new Error('Pass saved template/group JSON files explicitly.');
  for (const file of files) console.log(`${migrateFile(path.resolve(file)) ? 'Migrated' : 'Unchanged'}: ${file}`);
}
module.exports = { migrateTestimonialCarousel, migrateFile };
