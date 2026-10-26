// IBE MOTION · stap-voor-stap vragenlijst met overzicht, PDF-download en "plan je call".
// Antwoorden blijven op het apparaat van de invuller (localStorage) tot ze de PDF downloaden en naar Bob sturen.
//
// IBEForm(el, { key, title, sub, steps: [{ title, intro, fields: [...] }], pdfName, done: { title, text } })
// Veldtypes: text, email, tel, url, date, textarea, choice (een keuze), chips (meerdere), styles (kaarten met kleurstalen),
//            range ({min,max,step,unit}), tasks (rijen: taak, wie, uur per week)
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const opt = (o) => (typeof o === 'string' ? { v: o, label: o } : o);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  function valueText(f, v) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
    if (f.type === 'tasks') return v.filter((r) => r.taak).map((r) => `${r.taak}${r.wie ? ' (' + r.wie + ')' : ''}: ${r.uur || '?'} uur per week`).join('\n');
    if (f.type === 'range') return `${v}${f.unit ? ' ' + f.unit : ''}`;
    if (f.type === 'date') { try { return new Date(v + 'T12:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return v; } }
    const map = (x) => { const o = (f.options || []).map(opt).find((o) => o.v === x); return o ? o.label : x; };
    return Array.isArray(v) ? v.map(map).join(', ') : map(v);
  }

  function IBEForm(root, cfg) {
    const steps = cfg.steps;
    let data = store.get(cfg.key) || {};
    let step = Math.min(data.__step || 0, steps.length);
    const save = () => { data.__step = step; store.set(cfg.key, data); };

    function field(f) {
      const v = data[f.id];
      const head = `<label class="f-label" for="f_${f.id}">${esc(f.label)}${f.required ? ' <i>*</i>' : ''}</label>${f.help ? `<p class="f-help">${esc(f.help)}</p>` : ''}`;
      if (['text', 'email', 'tel', 'url', 'date', 'number'].includes(f.type))
        return `<div class="f${f.half ? ' half' : ''}">${head}<input class="f-in" id="f_${f.id}" data-id="${f.id}" type="${f.type}" value="${esc(v || '')}" placeholder="${esc(f.placeholder || '')}" ${f.type === 'number' ? 'inputmode="decimal"' : ''} autocomplete="${f.auto || 'off'}"></div>`;
      if (f.type === 'textarea')
        return `<div class="f">${head}<textarea class="f-in" id="f_${f.id}" data-id="${f.id}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || '')}">${esc(v || '')}</textarea></div>`;
      if (f.type === 'choice' || f.type === 'chips') {
        const multi = f.type === 'chips', sel = multi ? v || [] : v;
        return `<div class="f${f.half ? ' half' : ''}">${head}<div class="f-opts ${f.cards ? 'cards' : ''}" role="${multi ? 'group' : 'radiogroup'}">${f.options.map(opt).map((o) => {
          const on = multi ? sel.includes(o.v) : sel === o.v;
          return `<button type="button" class="f-opt ${on ? 'on' : ''}" data-pick="${f.id}" data-v="${esc(o.v)}" data-multi="${multi ? 1 : ''}" aria-pressed="${on}"><b>${esc(o.label)}</b>${o.desc ? `<small>${esc(o.desc)}</small>` : ''}</button>`;
        }).join('')}</div>${f.other ? `<input class="f-in f-other" data-id="${f.id}__anders" value="${esc(data[f.id + '__anders'] || '')}" placeholder="${esc(f.other)}">` : ''}</div>`;
      }
      if (f.type === 'styles') {
        const multi = !!f.multi, sel = multi ? v || [] : v;
        return `<div class="f">${head}<div class="f-styles">${f.options.map((o) => {
          const on = multi ? sel.includes(o.v) : sel === o.v;
          return `<button type="button" class="f-style ${on ? 'on' : ''}" data-pick="${f.id}" data-v="${esc(o.v)}" data-multi="${multi ? 1 : ''}" aria-pressed="${on}">
            <span class="sw">${o.sw.map((c) => `<i style="background:${c}"></i>`).join('')}</span><b>${esc(o.label)}</b><small>${esc(o.desc || '')}</small></button>`;
        }).join('')}</div></div>`;
      }
      if (f.type === 'range') {
        const val = v != null ? v : f.value;
        if (data[f.id] == null) data[f.id] = val;
        return `<div class="f">${head}<div class="f-range"><input type="range" id="f_${f.id}" data-id="${f.id}" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${val}"><output data-out="${f.id}">${val} ${esc(f.unit || '')}</output></div></div>`;
      }
      if (f.type === 'tasks') {
        const rows = (v && v.length ? v : [{}, {}, {}]);
        const total = rows.reduce((a, r) => a + (parseFloat(String(r.uur || '').replace(',', '.')) || 0), 0);
        return `<div class="f">${head}<div class="f-tasks" data-tasks="${f.id}">
          <div class="t-head"><span>Taak</span><span>Wie doet het</span><span>Uur per week</span><span></span></div>
          ${rows.map((r, i) => `<div class="t-row" data-i="${i}">
            <input class="f-in" data-t="taak" value="${esc(r.taak || '')}" placeholder="${i === 0 ? 'Bijv. offertes maken' : ''}">
            <input class="f-in" data-t="wie" value="${esc(r.wie || '')}" placeholder="${i === 0 ? 'Bijv. Sanne, binnendienst' : ''}">
            <input class="f-in" data-t="uur" value="${esc(r.uur || '')}" inputmode="decimal" placeholder="${i === 0 ? '6' : ''}">
            <button type="button" class="t-del" data-tdel="${i}" aria-label="Rij weghalen">×</button></div>`).join('')}
          <div class="t-foot"><button type="button" class="f-add" data-tadd="${f.id}">+ Taak toevoegen</button><span>Totaal <b data-ttotal>${total.toLocaleString('nl-NL')}</b> uur per week</span></div>
        </div></div>`;
      }
      return '';
    }

    function summaryHTML() {
      return steps.map((s) => {
        const rows = s.fields.map((f) => [f, valueText(f, data[f.id]), data[f.id + '__anders']]).filter((r) => r[1] || r[2]);
        if (!rows.length) return '';
        return `<div class="s-block"><h4>${esc(s.title)}</h4>${rows.map(([f, t, a]) => `<div class="s-row"><span>${esc(f.label)}</span><p>${esc([t, a].filter(Boolean).join(', ')).replace(/\n/g, '<br>')}</p></div>`).join('')}</div>`;
      }).join('') || '<p class="f-help">Nog niets ingevuld.</p>';
    }

    function render() {
      const last = step >= steps.length;
      const pct = Math.round((Math.min(step, steps.length) / steps.length) * 100);
      const s = steps[step];
      root.innerHTML = `
        <div class="w-top">
          <div class="w-steps">${steps.map((x, i) => `<button type="button" class="w-dot ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}" data-go="${i}" title="${esc(x.title)}"><span>${i + 1}</span><em>${esc(x.short || x.title)}</em></button>`).join('')}
            <button type="button" class="w-dot ${last ? 'on' : ''}" data-go="${steps.length}"><span>✓</span><em>Overzicht</em></button></div>
          <div class="w-bar"><i style="width:${pct}%"></i></div>
        </div>
        ${last ? `
          <div class="w-body">
            <p class="w-kicker">Klaar</p>
            <h3 class="w-title">${esc(cfg.done.title)}</h3>
            <p class="w-intro">${esc(cfg.done.text)}</p>
            <div class="w-summary">${summaryHTML()}</div>
            <div class="w-actions end">
              <button type="button" class="btn ghost" data-go="${steps.length - 1}">Terug</button>
              <button type="button" class="btn" data-pdf>Download als PDF</button>
              ${(cfg.extra || []).map((x, i) => `<button type="button" class="btn" data-extra="${i}">${esc(x.label)}</button>`).join('')}
              <button type="button" class="btn primary" data-call>${esc(cfg.callLabel || 'Plan je call')}</button>
            </div>
            <p class="w-note">Je antwoorden blijven op dit apparaat. Download de PDF en stuur hem naar <a href="mailto:${esc(window.IBE_CONFIG.mail)}">${esc(window.IBE_CONFIG.mail)}</a> of via WhatsApp. Kies daarna een moment voor de call.</p>
          </div>` : `
          <div class="w-body">
            <p class="w-kicker">Stap ${step + 1} van ${steps.length}</p>
            <h3 class="w-title">${esc(s.title)}</h3>
            ${s.intro ? `<p class="w-intro">${esc(s.intro)}</p>` : ''}
            <div class="w-fields">${s.fields.map(field).join('')}</div>
            <div class="w-actions">
              ${step > 0 ? '<button type="button" class="btn ghost" data-prev>Vorige</button>' : '<span></span>'}
              <button type="button" class="btn primary" data-next>${step === steps.length - 1 ? 'Naar het overzicht' : 'Volgende'}</button>
            </div>
            <p class="w-err" hidden></p>
          </div>`}`;
    }

    function readTasks(box) {
      return Array.from(box.querySelectorAll('.t-row')).map((r) => ({ taak: r.querySelector('[data-t=taak]').value.trim(), wie: r.querySelector('[data-t=wie]').value.trim(), uur: r.querySelector('[data-t=uur]').value.trim() }));
    }

    function validate() {
      const s = steps[step]; if (!s) return true;
      const miss = s.fields.filter((f) => f.required && !valueText(f, data[f.id]));
      const err = root.querySelector('.w-err');
      if (miss.length) { err.hidden = false; err.textContent = 'Vul nog even in: ' + miss.map((f) => f.label.replace(/\?$/, '')).join(', ') + '.'; return false; }
      return true;
    }

    function go(n) {
      step = Math.max(0, Math.min(steps.length, n)); save();
      // even de leeuw-loader tussen twee stappen (ibe-fx.js), anders meteen door
      const body = root.querySelector('.w-body');
      if (window.IBELoader && body) {
        const d = document.createElement('div'); d.className = 'fx-load'; d.style.minHeight = Math.min(body.offsetHeight, 420) + 'px';
        d.append(IBELoader.make('denken', 34), step >= steps.length ? 'Overzicht maken' : 'Volgende stap');
        body.replaceChildren(d); setTimeout(render, 380);
      } else render();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    root.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.id) {
        data[t.dataset.id] = t.type === 'range' ? Number(t.value) : t.value;
        if (t.type === 'range') { const o = root.querySelector(`[data-out="${t.dataset.id}"]`); const f = steps[step].fields.find((x) => x.id === t.dataset.id); if (o) o.textContent = `${t.value} ${f.unit || ''}`; }
        save();
      }
      const box = t.closest('[data-tasks]');
      if (box) {
        data[box.dataset.tasks] = readTasks(box); save();
        const tot = data[box.dataset.tasks].reduce((a, r) => a + (parseFloat(String(r.uur).replace(',', '.')) || 0), 0);
        box.querySelector('[data-ttotal]').textContent = tot.toLocaleString('nl-NL');
      }
    });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.pick) {
        const id = b.dataset.pick, v = b.dataset.v;
        if (b.dataset.multi) { const a = data[id] || []; data[id] = a.includes(v) ? a.filter((x) => x !== v) : a.concat(v); b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on')); }
        else { data[id] = data[id] === v ? '' : v; b.parentElement.querySelectorAll('[data-pick]').forEach((x) => { x.classList.toggle('on', x === b && data[id] === v); x.setAttribute('aria-pressed', x.classList.contains('on')); }); }
        save(); return;
      }
      if (b.dataset.tadd) { const id = b.dataset.tadd; data[id] = readTasks(b.closest('[data-tasks]')).concat({}); save(); render(); return; }
      if (b.dataset.tdel != null) { const box = b.closest('[data-tasks]'); const rows = readTasks(box); rows.splice(Number(b.dataset.tdel), 1); data[box.dataset.tasks] = rows.length ? rows : [{}]; save(); render(); return; }
      if (b.hasAttribute('data-next')) { if (validate()) go(step + 1); return; }
      if (b.hasAttribute('data-prev')) return go(step - 1);
      if (b.dataset.go != null) { const n = Number(b.dataset.go); if (n <= step || validate()) go(n); return; }
      if (b.hasAttribute('data-pdf')) return pdf(b);
      if (b.hasAttribute('data-call')) { IBEForm.call(data, { wa: !!cfg.callWa, topic: cfg.callTopic }); if (window.IBELoader) IBELoader.busy(b, 'Agenda openen', 'luisteren', 1600); return; }
      if (b.dataset.extra != null) return cfg.extra[Number(b.dataset.extra)].onClick(data, steps);
    });

    function pdf(btn) {
      if (window.IBELoader && btn) { IBELoader.busy(btn, 'PDF maken', 'maken', 1300); setTimeout(makePdf, 650); } else makePdf();
    }
    function makePdf() {
      const sections = steps.map((s) => ({ title: s.title, rows: s.fields.map((f) => [f.label, [valueText(f, data[f.id]), data[f.id + '__anders']].filter(Boolean).join(', ')]).filter((r) => r[1]) })).filter((s) => s.rows.length);
      const who = data[cfg.whoField || 'bedrijf'] || data.naam || '';
      IBEPdf.make({ title: cfg.title, sub: cfg.sub, who, sections, filename: `${cfg.pdfName}${who ? ' - ' + who : ''}.pdf` });
    }

    render();
    return { data: () => data };
  }

  // Call inplannen: Calendly als die in config.js staat, anders WhatsApp met een kort bericht.
  IBEForm.call = function (data, o) {
    const c = window.IBE_CONFIG || {};
    data = data || {}; o = o || {};
    if (c.calendly && !o.wa) {
      const u = new URL(c.calendly);
      if (data.naam) u.searchParams.set('name', data.naam);
      if (data.email) u.searchParams.set('email', data.email);
      window.open(u.toString(), '_blank', 'noopener');
    } else {
      const txt = `Hoi Bob, ${o.topic || `ik wil graag een call inplannen${data.bedrijf ? ' voor ' + data.bedrijf : ''}. ${c.callTopic || ''}`}`.trim();
      window.open(`https://wa.me/${c.wa}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    }
  };

  window.IBEForm = IBEForm;
  window.IBEForm.valueText = valueText;
})();

// PDF in IBE MOTION-stijl (jsPDF, met printvenster als terugval).
window.IBEPdf = {
  make({ title, sub, who, sections, filename, intro }) {
    const ascii = (s) => String(s || '').replace(/[–—]/g, '-').replace(/≈/g, 'ongeveer ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/×/g, 'x').replace(/✓/g, 'v');
    if (!(window.jspdf && window.jspdf.jsPDF)) { alert('De PDF-maker kon niet laden. Ik open het printvenster, kies daar "Bewaar als PDF".'); window.print(); return; }
    const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    const M = 48, PW = 595, PH = 842, maxW = PW - M * 2;
    let y = 0;
    const header = () => {
      doc.setFillColor(6, 7, 10); doc.rect(0, 0, PW, 92, 'F');
      doc.setFillColor(210, 64, 76); doc.rect(0, 92, PW, 3, 'F');
      doc.setTextColor(216, 195, 165); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setCharSpace(2);
      doc.text('IBE MOTION', M, 34); doc.setCharSpace(0);
      doc.setTextColor(236, 238, 243); doc.setFontSize(19); doc.text(ascii(title), M, 60);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(164, 170, 183);
      const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(ascii([sub, who, datum].filter(Boolean).join('  ·  ')), M, 78);
      y = 124;
    };
    const ensure = (h) => { if (y + h > PH - 56) { doc.addPage(); header(); } };
    header();
    if (intro) { doc.setFontSize(10.5); doc.setTextColor(60, 64, 72); const l = doc.splitTextToSize(ascii(intro), maxW); ensure(l.length * 14); doc.text(l, M, y); y += l.length * 14 + 10; }
    sections.forEach((s) => {
      ensure(48);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(210, 64, 76); doc.setCharSpace(1.2);
      doc.text(ascii(s.title).toUpperCase(), M, y); doc.setCharSpace(0);
      doc.setDrawColor(225, 220, 212); doc.line(M, y + 7, PW - M, y + 7); y += 24;
      s.rows.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(17, 19, 26);
        const ll = doc.splitTextToSize(ascii(label), maxW);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
        const vl = doc.splitTextToSize(ascii(val), maxW);
        ensure(ll.length * 13 + vl.length * 14 + 14);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(17, 19, 26); doc.text(ll, M, y); y += ll.length * 13 + 2;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(70, 74, 82); doc.text(vl, M, y); y += vl.length * 14 + 12;
      });
      y += 8;
    });
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFontSize(8.5); doc.setTextColor(140, 144, 152);
      doc.text(ascii(`IBE MOTION · ${(window.IBE_CONFIG || {}).mail || ''} · ${(window.IBE_CONFIG || {}).phone || ''}`), M, PH - 28);
      doc.text(`${i} / ${n}`, PW - M, PH - 28, { align: 'right' });
    }
    doc.save(ascii(filename || 'IBE MOTION.pdf'));
  },
};
