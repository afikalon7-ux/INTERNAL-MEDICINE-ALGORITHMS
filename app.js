if (typeof mermaid !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    flowchart: { htmlLabels: true, curve: 'basis', padding: 20, nodeSpacing: 50, rankSpacing: 60 },
    themeVariables: {
      primaryColor: '#4E9DA0', primaryTextColor: '#fff',
      primaryBorderColor: '#2E7477', lineColor: '#546E7A',
      background: '#ffffff', mainBkg: '#4E9DA0',
      fontSize: '15px'
    }
  });
}

const SPECIALTY_NAMES = {
  all:'All Algorithms', cardiology:'Cardiology', gastroenterology:'Gastroenterology',
  nephrology:'Nephrology', endocrinology:'Endocrinology', hematology:'Hematology',
  infectious:'Infectious Diseases', rheumatology:'Rheumatology',
  pulmonology:'Pulmonology', criticalcare:'Critical Care'
};
const SPECIALTY_COLORS = {
  cardiology:'#E74C3C', gastroenterology:'#F39C12', nephrology:'#3498DB',
  endocrinology:'#9B59B6', hematology:'#C0392B', infectious:'#27AE60',
  rheumatology:'#795548', pulmonology:'#00BCD4', criticalcare:'#E67E22'
};

let currentSpecialty = 'all';
let currentAlgoId = null;
let searchTimeout = null;

function getFiltered(specialty, query) {
  return ALGORITHMS.filter(a => {
    const matchSpec = specialty === 'all' || a.specialty === specialty;
    if (!query) return matchSpec;
    const q = query.toLowerCase();
    return matchSpec && (
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      (a.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });
}

function renderCards() {
  const query = document.getElementById('search-box').value.trim();
  const list = getFiltered(currentSpecialty, query);
  const grid = document.getElementById('algo-grid');
  const empty = document.getElementById('empty-state');
  grid.innerHTML = '';
  if (!list.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  list.forEach(a => {
    const color = SPECIALTY_COLORS[a.specialty] || '#4E9DA0';
    const tags = (a.tags || []).slice(0,4).map(t => `<span class="tag">${t}</span>`).join('');
    const summary = a.summary.length > 90 ? a.summary.slice(0,90) + '…' : a.summary;
    const card = document.createElement('div');
    card.className = 'algo-card';
    card.style.borderLeftColor = color;
    card.innerHTML = `<h3>${a.title}</h3><p>${summary}</p><div class="card-tags">${tags}</div><div class="card-citation">${a.citation}</div>`;
    card.addEventListener('click', () => openModal(a.id));
    grid.appendChild(card);
  });
}

async function openModal(id) {
  const algo = ALGORITHMS.find(a => a.id === id);
  if (!algo) return;
  currentAlgoId = id;
  const color = SPECIALTY_COLORS[algo.specialty] || '#4E9DA0';

  document.getElementById('modal-title').textContent = algo.title;
  document.getElementById('modal-summary').textContent = algo.summary;
  document.getElementById('modal-citation').textContent = algo.citation;

  const badge = document.getElementById('modal-specialty-badge');
  badge.textContent = SPECIALTY_NAMES[algo.specialty] || algo.specialty;
  badge.style.background = color;

  const fnDiv = document.getElementById('modal-footnotes');
  const fnSection = document.getElementById('footnotes-section');
  if (algo.footnotes && algo.footnotes.length) {
    fnDiv.innerHTML = algo.footnotes.map(f => `<div class="footnote"><sup>${f.num}</sup>${f.text}</div>`).join('');
    fnSection.style.display = 'block';
  } else {
    fnSection.style.display = 'none';
  }

  const notes = localStorage.getItem('notes-' + id) || '';
  document.getElementById('modal-notes').value = notes;

  document.getElementById('diagram-container').innerHTML = '';
  document.getElementById('loading').style.display = 'flex';
  document.getElementById('modal-overlay').classList.add('open');

  try {
    if (typeof mermaid === 'undefined') throw new Error('Mermaid library not loaded — check internet connection.');
    const diagId = 'diag-' + id.replace(/[^a-z0-9]/gi, '-') + '-' + Date.now();
    const { svg } = await mermaid.render(diagId, algo.mermaid);
    document.getElementById('diagram-container').innerHTML = svg;
  } catch(e) {
    document.getElementById('diagram-container').innerHTML =
      `<div style="color:#E05252;padding:20px;font-size:13px">⚠️ Diagram render error.<br><pre style="font-size:11px;margin-top:8px;white-space:pre-wrap">${e.message}</pre></div>`;
  }
  document.getElementById('loading').style.display = 'none';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  currentAlgoId = null;
}

function updateCounts() {
  const specialties = ['all','cardiology','gastroenterology','nephrology','endocrinology','hematology','infectious','rheumatology','pulmonology','criticalcare'];
  specialties.forEach(s => {
    const count = s === 'all' ? ALGORITHMS.length : ALGORITHMS.filter(a => a.specialty === s).length;
    const el = document.getElementById('count-' + s);
    if (el) el.textContent = count;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateCounts();
  renderCards();

  document.querySelectorAll('.specialty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.specialty-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSpecialty = btn.dataset.specialty;
      document.getElementById('topbar-title').textContent = SPECIALTY_NAMES[currentSpecialty] || currentSpecialty;
      renderCards();
    });
  });

  document.getElementById('search-box').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(renderCards, 200);
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  document.getElementById('modal-notes').addEventListener('input', e => {
    if (currentAlgoId) localStorage.setItem('notes-' + currentAlgoId, e.target.value);
  });

  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    const s = document.getElementById('sidebar');
    if (s.style.display === 'none') {
      s.style.display = 'flex';
    } else {
      s.style.display = 'none';
    }
  });

  document.getElementById('info-toggle').addEventListener('click', () => {
    const p = document.getElementById('info-panel');
    if (p.style.display === 'none') {
      p.style.display = 'flex';
    } else {
      p.style.display = 'none';
    }
  });
});
