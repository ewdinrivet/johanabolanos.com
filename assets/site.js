{
  const menu = document.querySelector('.menu-btn');
  const links = document.querySelector('.links');
  if (menu && links) {
    menu.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  const gal = document.querySelector('.gal');
  if (gal) {
    const items = [...gal.querySelectorAll('button')];
    const filters = document.querySelectorAll('.filters button');
    filters.forEach(f => f.addEventListener('click', () => {
      filters.forEach(x => x.setAttribute('aria-pressed', x === f ? 'true' : 'false'));
      const c = f.dataset.cat;
      items.forEach(b => { b.hidden = !(c === 'all' || b.dataset.cat === c); });
    }));
    const dlg = document.querySelector('dialog.lb');
    const img = dlg.querySelector('img');
    const cap = dlg.querySelector('figcaption');
    let idx = 0;
    const visible = () => items.filter(b => !b.hidden);
    const show = i => {
      const v = visible();
      idx = (i + v.length) % v.length;
      const b = v[idx];
      img.src = b.dataset.full;
      img.alt = b.querySelector('img').alt;
      cap.textContent = b.dataset.label || '';
    };
    items.forEach(b => b.addEventListener('click', () => {
      show(visible().indexOf(b));
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    }));
    dlg.querySelector('.x').addEventListener('click', () => dlg.close());
    dlg.querySelector('.pv').addEventListener('click', () => show(idx - 1));
    dlg.querySelector('.nx').addEventListener('click', () => show(idx + 1));
    dlg.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.tagName === 'FIGURE') dlg.close(); });
  }

  const form = document.querySelector('form.lead-form');
  if (form) {
    const err = form.querySelector('.err');
    const ok = form.querySelector('.ok');
    form.addEventListener('input', () => { err.textContent = ''; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form);
      const name = (d.get('nombre') || '').toString().trim();
      const goal = (d.get('objetivo') || '').toString();
      if (!name || !goal) { err.textContent = form.dataset.err; return; }
      const parts = [form.dataset.hello + ' ' + name + '.', form.dataset.goal + ' ' + goal + '.'];
      const zona = (d.get('zona') || '').toString().trim();
      const msg = (d.get('mensaje') || '').toString().trim();
      if (zona) parts.push(form.dataset.zone + ' ' + zona + '.');
      if (msg) parts.push(msg);
      const url = 'https://wa.me/573124066324?text=' + encodeURIComponent(parts.join(' '));
      const a = ok.querySelector('a');
      a.href = url;
      ok.style.display = 'block';
      try { window.open(url, '_blank', 'noopener'); } catch (_) {}
    });
  }
}
