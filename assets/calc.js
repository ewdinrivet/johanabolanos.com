{
  const root = document.querySelector('[data-calc]');
  if (root) {
    const kind = root.dataset.calc;
    const L = JSON.parse(document.getElementById('calc-i18n').textContent);
    const CFG = JSON.parse(document.getElementById('calc-cfg').textContent);
    const loc = L.locale;
    const money = v => new Intl.NumberFormat(loc, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(v));
    const pct = (v, d = 1) => new Intl.NumberFormat(loc, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v) + ' %';
    const num = el => {
      const raw = String(el.value).replace(/[^\d,.-]/g, '');
      const norm = el.dataset.money !== undefined ? raw.replace(/[.,]/g, '') : raw.replace(',', '.');
      const n = parseFloat(norm);
      return isFinite(n) ? n : 0;
    };
    const $ = id => document.getElementById(id);
    root.querySelectorAll('input[data-money]').forEach(el => {
      const fmt = () => { const n = num(el); el.value = n ? new Intl.NumberFormat(loc).format(n) : ''; };
      el.addEventListener('blur', fmt); fmt();
    });
    const payment = (P, eaPct, years) => {
      const i = Math.pow(1 + eaPct / 100, 1 / 12) - 1;
      const n = Math.round(years * 12);
      if (P <= 0 || n <= 0) return { cuota: 0, i, n };
      if (i === 0) return { cuota: P / n, i, n };
      return { cuota: P * i / (1 - Math.pow(1 + i, -n)), i, n };
    };
    const balanceAfter = (P, i, cuota, months) => {
      if (i === 0) return Math.max(0, P - cuota * months);
      return Math.max(0, P * Math.pow(1 + i, months) - cuota * (Math.pow(1 + i, months) - 1) / i);
    };
    let summary = '';

    const rows = (list) => list.map(([k, v, strong]) => `<div class="${strong ? 'big' : ''}"><span>${k}</span><b>${v}</b></div>`).join('');

    const calcHipo = () => {
      const precio = num($('h-precio'));
      const tipo = $('h-tipo').value;
      const ini = num($('h-ini'));
      const plazo = num($('h-plazo'));
      const tasa = num($('h-tasa'));
      const ref = CFG.rates[tipo];
      $('h-ref').textContent = L.refText.replace('{min}', pct(ref.min, 2)).replace('{max}', pct(ref.max, 2)).replace('{date}', CFG.rates.date);
      const minIni = tipo === 'vis' ? 20 : 30;
      const warn = [];
      if (ini < minIni) warn.push(L.warnIni.replace('{p}', minIni));
      if (tasa < ref.min - 0.5 || tasa > ref.max + 2) warn.push(L.warnRate);
      const P = precio * (1 - ini / 100);
      const { cuota, i, n } = payment(P, tasa, plazo);
      const total = cuota * n;
      const gastos = precio * CFG.closing / 100;
      const ingreso = cuota / 0.30;
      $('h-out').innerHTML = rows([
        [L.cuota, money(cuota), true],
        [L.prestamo, money(P)],
        [L.inicial, money(precio - P)],
        [L.gastos, money(gastos)],
        [L.efectivo, money(precio - P + gastos)],
        [L.ingreso, money(ingreso)],
        [L.intereses, money(total - P)],
        [L.tasaMes, pct(i * 100, 3)]
      ]);
      $('h-warn').textContent = warn.join(' ');
      summary = [
        L.mailTitleH,
        `${L.precio}: ${money(precio)}`, `${L.tipoLbl}: ${tipo === 'vis' ? 'VIS' : 'No VIS'}`, `${L.iniLbl}: ${pct(ini, 0)}`,
        `${L.plazoLbl}: ${plazo} ${L.years}`, `${L.tasaLbl}: ${pct(tasa, 2)} E.A.`,
        `${L.cuota}: ${money(cuota)}`, `${L.prestamo}: ${money(P)}`, `${L.inicial}: ${money(precio - P)}`,
        `${L.gastos}: ${money(gastos)}`, `${L.efectivo}: ${money(precio - P + gastos)}`,
        `${L.ingreso}: ${money(ingreso)}`, `${L.intereses}: ${money(total - P)}`,
        `${L.refShort} ${CFG.rates.date}: ${pct(ref.min, 2)} – ${pct(ref.max, 2)}`
      ].join('\n');
    };

    const calcInv = () => {
      const precio = num($('i-precio'));
      const gastosPct = num($('i-gastos'));
      const remod = num($('i-remod'));
      const arriendo = num($('i-arriendo'));
      const admin = num($('i-admin'));
      const predial = num($('i-predial'));
      const otros = num($('i-otros'));
      const vacios = Math.min(12, num($('i-vacios')));
      const comision = num($('i-comision'));
      const valor = num($('i-valor'));
      const fin = Math.min(80, num($('i-fin')));
      const tasa = num($('i-tasa'));
      const plazo = num($('i-plazo'));
      const gastos = precio * gastosPct / 100;
      const P = precio * fin / 100;
      const { cuota, i } = payment(P, tasa, plazo);
      const ingresoAnual = arriendo * (12 - vacios);
      const gastosAnual = admin * 12 + predial + otros + ingresoAnual * comision / 100;
      const noi = ingresoAnual - gastosAnual;
      const costoTotal = precio + gastos + remod;
      const efectivo = costoTotal - P;
      const flujoAnual = noi - cuota * 12;
      const bruta = precio ? (arriendo * 12) / precio * 100 : 0;
      const neta = costoTotal ? noi / costoTotal * 100 : 0;
      const coc = efectivo > 0 ? flujoAnual / efectivo * 100 : 0;
      const v5 = precio * Math.pow(1 + valor / 100, 5);
      const saldo5 = P > 0 ? balanceAfter(P, i, cuota, 60) : 0;
      const patrimonio5 = v5 - saldo5;
      const retorno5 = flujoAnual * 5 + patrimonio5 - efectivo;
      const payback = flujoAnual > 0 ? efectivo / flujoAnual : null;
      $('i-out').innerHTML = rows([
        [L.netaLbl, pct(neta), true],
        [L.brutaLbl, pct(bruta)],
        [L.flujoMes, money(flujoAnual / 12)],
        [L.efectivoInv, money(efectivo)],
        [L.cocLbl, efectivo > 0 ? pct(coc) : '—'],
        [L.v5Lbl, money(v5)],
        [L.patrimonio5, money(patrimonio5)],
        [L.retorno5, money(retorno5)],
        [L.payback, payback ? new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }).format(payback) + ' ' + L.years : L.noPayback]
      ]);
      $('i-warn').textContent = flujoAnual < 0 ? L.warnNeg : '';
      summary = [
        L.mailTitleI,
        `${L.precio}: ${money(precio)}`, `${L.arriendoLbl}: ${money(arriendo)}`, `${L.finLbl}: ${pct(fin, 0)}${fin ? ' · ' + pct(tasa, 2) + ' E.A. · ' + plazo + ' ' + L.years : ''}`,
        `${L.netaLbl}: ${pct(neta)}`, `${L.brutaLbl}: ${pct(bruta)}`, `${L.flujoMes}: ${money(flujoAnual / 12)}`,
        `${L.efectivoInv}: ${money(efectivo)}`, `${L.cocLbl}: ${efectivo > 0 ? pct(coc) : '—'}`,
        `${L.v5Lbl} (${pct(valor)}/${L.yearShort}): ${money(v5)}`, `${L.patrimonio5}: ${money(patrimonio5)}`, `${L.retorno5}: ${money(retorno5)}`
      ].join('\n');
    };

    const run = kind === 'hipo' ? calcHipo : calcInv;
    root.querySelectorAll('input,select').forEach(el => el.addEventListener('input', run));
    root.querySelectorAll('[data-rate]').forEach(b => b.addEventListener('click', () => {
      const t = $('h-tipo').value; $('h-tasa').value = String(CFG.rates[t][b.dataset.rate]).replace('.', L.dec); run();
    }));
    run();

    const form = document.querySelector('form.report-form');
    const err = form.querySelector('.err');
    const ok = form.querySelector('.ok');
    form.addEventListener('input', () => { err.textContent = ''; });
    form.addEventListener('submit', e => {
      const name = form.querySelector('[name=nombre]').value.trim();
      const phone = form.querySelector('[name=telefono]').value.trim();
      const email = form.querySelector('[name=correo]').value.trim();
      const consent = form.querySelector('[name=consent]').checked;
      const hp = form.querySelector('[name=website]').value;
      const msgs = [];
      if (!name) msgs.push(L.errName);
      if (!/^\+?[\d\s()-]{7,}$/.test(phone)) msgs.push(L.errPhone);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) msgs.push(L.errEmail);
      if (!consent) msgs.push(L.errConsent);
      if (msgs.length) { e.preventDefault(); err.textContent = msgs.join(' '); return; }
      if (hp) { e.preventDefault(); return; }
      run();
      if (CFG.zoho && CFG.zoho.action) {
        const parts = name.split(/\s+/);
        form.querySelector('[name="First Name"]').value = parts[0];
        form.querySelector('[name="Last Name"]').value = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
        form.querySelector('[name="Email"]').value = email;
        form.querySelector('[name="Mobile"]').value = phone;
        form.querySelector('[name="Description"]').value = summary;
        ok.innerHTML = L.okSent.replace('{email}', email.replace(/[<>&"]/g, ''));
        ok.style.display = 'block';
        setTimeout(() => form.reset(), 400);
        return;
      }
      e.preventDefault();
      const url = 'https://wa.me/' + CFG.wa + '?text=' + encodeURIComponent(L.waIntro.replace('{n}', name) + '\n' + summary + '\n' + L.waContact + ' ' + email + ' · ' + phone);
      ok.innerHTML = L.okWa + ' <a href="' + url + '" target="_blank" rel="noopener">' + L.okWaLink + '</a>';
      ok.style.display = 'block';
      try { window.open(url, '_blank', 'noopener'); } catch (_) {}
    });
  }
}
