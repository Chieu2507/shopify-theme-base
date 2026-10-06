(() => {
  const escape = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const types = (root) => ['query', ...[['showProducts','product'],['showCollections','collection'],['showBlogPosts','article'],['showPages','page']].filter(([flag]) => root.dataset[flag] !== 'false').map(([,type]) => type)].join(',');
  const request = async (root, query, signal) => {
    const params = new URLSearchParams({q:query,'resources[type]':types(root),'resources[limit]':'5','resources[limit_scope]':'each'});
    const response = await fetch(`${root.dataset.predictiveSearchUrl}?${params}`, {signal,headers:{Accept:'application/json'}});
    if (!response.ok) throw new Error('Predictive search failed');
    return (await response.json()).resources?.results || {};
  };
  const highlight = (text, query) => {
    const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
    return index < 0 ? escape(text) : `${escape(text.slice(0,index))}<strong>${escape(text.slice(index,index+query.length))}</strong>${escape(text.slice(index+query.length))}`;
  };
  const render = async (root, target, data, query, signal) => {
    const labels = root.dataset;
    const groups = [['products',labels.productsLabel],['collections',labels.collectionsLabel],['articles',labels.blogPostsLabel],['pages',labels.pagesLabel]];
    const queries = data.queries || [];
    target.innerHTML = (queries.length ? `<section><h2 class="heading-text heading-sm">${escape(labels.suggestionsLabel)}</h2><div class="search-suggestions__chips">${queries.map(item => `<button type="button" data-search-suggestion="${escape(item.text)}">${highlight(item.text || '',query)}</button>`).join('')}</div></section>` : '') + groups.filter(([key]) => data[key]?.length).map(([key,label]) => `<section><h2 class="heading-text heading-sm">${escape(label)}</h2><div data-search-group="${key}">${data[key].map(item => `<a class="search-suggestions__link body-text body-sm" href="${escape(item.url)}">${escape(item.title)}</a>`).join('')}</div></section>`).join('');
    if (!target.innerHTML) target.innerHTML = `<p role="status">${escape(labels.noResultsLabel)}</p>`;
    target.innerHTML += `<div class="search-suggestions__footer"><a class="btn btn--primary" href="${escape(labels.searchUrl)}?q=${encodeURIComponent(query)}&options%5Bprefix%5D=last">${escape(labels.viewAllLabel)}</a></div>`;
    const paths = (data.products || []).map(item => {try {const url=new URL(item.url,location.origin);return url.origin===location.origin ? url.pathname : '';} catch {return '';}});
    const rows = await window.ThemeRecentlyViewed?.load(paths,'[data-recently-viewed-row]',signal) || [];
    if (signal.aborted) return;
    const group = target.querySelector('[data-search-group="products"]');
    rows.forEach((row,index) => {if(row && group?.children[index]) group.children[index].replaceWith(row);});
    target.dispatchEvent(new CustomEvent('collection:products-loaded',{bubbles:true}));
  };
  const recent = async (root,target,signal) => {
    const paths = root.dataset.showRecent === 'false' ? [] : window.ThemeRecentlyViewed?.read().slice(0,Number(root.dataset.recentLimit)||5) || [];
    const rows = await window.ThemeRecentlyViewed?.load(paths,'[data-recently-viewed-row]',signal) || [];
    if(signal.aborted) return;
    const valid=rows.filter(Boolean);
    target.innerHTML= valid.length ? `<h2 class="heading-text heading-sm">${escape(root.dataset.recentLabel)}</h2>` : '';
    target.append(...valid);
    target.hidden=!valid.length;
    target.dispatchEvent(new CustomEvent('collection:products-loaded',{bubbles:true}));
  };
  window.ThemeSearchSuggestions={escape,types,request,render,recent};
})();
