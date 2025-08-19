/*
  LyricForge – Generador Automático de Canciones
  Motor de generación basado en plantillas y variaciones probabilísticas.
  Sustituible por un backend/LLM en el futuro.
*/

const state = {
  lastConfig: null,
  lastLyricText: '',
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {
  const form = $('#song-form');
  const genreSel = $('#genre');
  const emotionSel = $('#emotion');
  const themeInput = $('#theme');
  const output = $('#output');

  const btnCopy = $('#btn-copy');
  const btnSave = $('#btn-save');
  const btnShare = $('#btn-share');
  const btnRegenerate = $('#btn-regenerate');
  const ctaGenerate = $('#cta-generate');
  const year = $('#year');

  if (year) year.textContent = String(new Date().getFullYear());

  if (ctaGenerate) {
    ctaGenerate.addEventListener('click', () => {
      document.location.hash = '#crear';
      $('#genre').focus();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const config = {
      genre: genreSel.value,
      emotion: emotionSel.value,
      theme: (themeInput.value || '').trim(),
    };
    state.lastConfig = config;
    toggleBusy(output, true);
    disableActions(true);
    await wait(400); // micro-loading for UX
    const lyric = generateLyric(config);
    state.lastLyricText = lyricToText(lyric);
    renderLyric(output, lyric);
    disableActions(false);
    btnRegenerate.disabled = false;
    document.location.hash = '#result';
    toggleBusy(output, false);
  });

  btnRegenerate.addEventListener('click', () => {
    if (!state.lastConfig) return;
    toggleBusy(output, true);
    const lyric = generateLyric(state.lastConfig);
    state.lastLyricText = lyricToText(lyric);
    renderLyric(output, lyric);
    toggleBusy(output, false);
  });

  btnCopy.addEventListener('click', async () => {
    if (!state.lastLyricText) return;
    try {
      await navigator.clipboard.writeText(state.lastLyricText);
      flashButton(btnCopy, '¡Copiada!');
    } catch {
      fallbackCopyText(state.lastLyricText);
    }
  });

  btnSave.addEventListener('click', () => {
    if (!state.lastLyricText) return;
    const blob = new Blob([state.lastLyricText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const { genre, emotion } = state.lastConfig || { genre: 'Cancion', emotion: 'Emocion' };
    const fileName = `LyricForge-${genre}-${emotion}.txt`.replace(/\s+/g, '_');
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  btnShare.addEventListener('click', async () => {
    if (!state.lastLyricText) return;
    const { genre, emotion, theme } = state.lastConfig || {};
    const title = `LyricForge: ${genre} ${emotion}${theme ? ' – ' + theme : ''}`;
    const text = state.lastLyricText;
    const url = location.href.split('#')[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch { /* cancel */ }
    } else {
      // fallback: open Twitter intent
      const shareText = encodeURIComponent(`${title}\n\n` + text.slice(0, 200) + '...');
      const shareUrl = 'https://twitter.com/intent/tweet?text=' + shareText;
      window.open(shareUrl, '_blank');
    }
  });

  function disableActions(disabled) {
    btnCopy.disabled = disabled;
    btnSave.disabled = disabled;
    btnShare.disabled = disabled;
  }
});

function toggleBusy(container, isBusy) {
  container.setAttribute('aria-busy', String(isBusy));
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function flashButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  button.disabled = true;
  setTimeout(() => { button.textContent = original; button.disabled = false; }, 900);
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

// ---------- Generador de letras ----------

function generateLyric(config) {
  const { genre, emotion, theme } = config;
  const mood = emotion.toLowerCase();
  const topic = theme || pickRandom([
    'amor', 'esperanza', 'noche', 'fiesta', 'libertad', 'superación', 'viaje', 'soledad', 'reencuentro', 'destino'
  ]);

  const voice = pickVoiceForGenre(genre, mood);
  const imagery = pickImageryForEmotion(mood);

  const title = buildTitle(genre, mood, topic);

  const verse1 = buildVerse({ voice, imagery, topic, mood, intensity: 0.6 });
  const pre = buildPreChorus({ voice, imagery, topic, mood, intensity: 0.75 });
  const chorus = buildChorus({ voice, imagery, topic, mood, title, intensity: 1.0 });
  const verse2 = buildVerse({ voice, imagery, topic, mood, intensity: 0.8, alt: true });
  const hook = buildHook({ voice, topic, title });
  const chorus2 = maybeVaryChorus(chorus);
  const outro = buildOutro({ voice, imagery, topic, mood });

  return {
    title,
    sections: [
      { key: 'ESTROFA 1', lines: verse1 },
      { key: 'PUENTE', lines: pre },
      { key: 'CORO', lines: chorus },
      { key: 'ESTROFA 2', lines: verse2 },
      { key: 'ESTRIBILLO', lines: hook },
      { key: 'CORO', lines: chorus2 },
      { key: 'FINAL', lines: outro },
    ],
  };
}

function renderLyric(container, lyric) {
  const frag = document.createDocumentFragment();
  container.innerHTML = '';

  const h3 = document.createElement('h3');
  h3.className = 'section__title';
  h3.textContent = `Título: ${lyric.title}`;
  frag.appendChild(h3);

  lyric.sections.forEach(section => {
    const titleEl = document.createElement('div');
    titleEl.className = 'section-title';
    titleEl.textContent = `[${section.key}]`;
    frag.appendChild(titleEl);

    const block = document.createElement('div');
    block.className = 'lyric-block';
    section.lines.forEach(line => {
      const p = document.createElement('div');
      p.className = 'lyric-line';
      p.textContent = line;
      block.appendChild(p);
    });
    frag.appendChild(block);
  });

  container.appendChild(frag);
}

function lyricToText(lyric) {
  const lines = [`Título: ${lyric.title}`, ''];
  for (const sec of lyric.sections) {
    lines.push(`[${sec.key}]`);
    lines.push(...sec.lines);
    lines.push('');
  }
  return lines.join('\n');
}

function pickVoiceForGenre(genre, mood) {
  const map = {
    Pop: ['melodía brillante', 'hook pegadizo', 'voces aireadas'],
    Rock: ['guitarras crujientes', 'batería intensa', 'voz rasgada'],
    Rap: ['flow afilado', 'rimas internas', 'bajo pesado'],
    'Reguetón': ['dem bow', 'cadencia sensual', 'club vibe'],
    Balada: ['piano íntimo', 'voz cercana', 'tempo lento'],
    Electrónica: ['sintetizadores etéreos', 'drop envolvente', 'hi-hats nítidos'],
    Cristiana: ['armonías corales', 'mensaje de fe', 'luz y esperanza'],
    Indie: ['texturas lo-fi', 'metáforas suaves', 'melancolía dulce'],
  };
  const base = map[genre] || ['melodía', 'ritmo', 'voz'];
  return base.concat(mood.includes('osc') ? ['sombras profundas'] : mood.includes('épica') ? ['cinesco expansivo'] : []);
}

function pickImageryForEmotion(mood) {
  const imageryMap = {
    alegre: ['neón', 'risas', 'amanecer', 'cielo abierto', 'palmas'],
    feliz: ['luz dorada', 'verano', 'olas', 'danza', 'brillos'],
    oscura: ['lluvia', 'noche', 'espejos rotos', 'susurros', 'niebla'],
    dramática: ['tormenta', 'velas', 'puertas cerradas', 'truenos', 'silencios'],
    romántica: ['miradas', 'manos entrelazadas', 'estrellas', 'besos', 'rosas'],
    motivacional: ['cumbres', 'maratón', 'aliento', 'horizonte', 'victoria'],
    triste: ['invierno', 'habitaciones vacías', 'fotografías', 'adiós', 'eco'],
    épica: ['montañas', 'tambores', 'banderas', 'relámpagos', 'coro lejano'],
  };
  return imageryMap[mood] || imageryMap['alegre'];
}

function buildTitle(genre, mood, topic) {
  const patterns = [
    `${capitalize(topic)} en ${genre}`,
    `${capitalize(topic)} ${mood}`,
    `Himno a ${topic}`,
    `Bajo las ${topic}`,
    `Entre ${topic} y destino`,
  ];
  return pickRandom(patterns);
}

function buildVerse({ voice, imagery, topic, mood, intensity, alt = false }) {
  return [
    line(`${pickRandom(imagery)} en mi ventana, ${topic} que no se va`),
    line(`pasos que buscan ${pickRandom(['ritmo', 'calma', 'fuerza'])} en la ciudad`),
    line(`${pickRandom(voice)} me sostienen cuando el mundo va a temblar`),
    line(alt ? `si caigo, me levanto: ${pickRandom(['no me rindo', 'sigo vivo', 'voy a más'])}` : `te encuentro en cada nota, vuelvo a empezar`),
  ];
}

function buildPreChorus({ voice, imagery, topic, mood }) {
  return [
    line(`y cuando dudo, escucho ${pickRandom(voice)}`),
    line(`se abre el cielo, ${pickRandom(imagery)} me vuelve a guiar`),
  ];
}

function buildChorus({ voice, imagery, topic, mood, title }) {
  return [
    line(`${title}! lo canto fuerte, que me oiga la ciudad`),
    line(`si estás conmigo, ${topic} se vuelve libertad`),
    line(`${pickRandom(imagery)} marcan el compás`),
    line(`sube el volumen, hoy nada nos detendrá`),
  ];
}

function maybeVaryChorus(chorus) {
  const varied = [...chorus];
  if (Math.random() > 0.5) {
    varied[1] = chorus[1].replace('libertad', pickRandom(['fuego', 'verdad', 'eternidad']));
  }
  return varied;
}

function buildHook({ voice, topic, title }) {
  const hookWord = pickRandom([title.split(' ')[0], topic, 'oh-oh', 'ey-ey']);
  return [
    line(`${hookWord} ${hookWord} ${hookWord}`),
    line(`quédate en mi voz, no te vas`),
  ];
}

function buildOutro({ voice, imagery, topic, mood }) {
  return [
    line(`se apagan las luces, queda ${topic} vibrando`),
    line(`último latido: ${pickRandom(imagery)}`),
  ];
}

// helpers de texto
function line(text) { return capitalizeFirst(text.trim()); }
function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
function capitalizeFirst(text) { return text.replace(/(^|[\.!?]\s+)([a-zñáéíóú])/g, (m, p, c) => p + c.toUpperCase()); }
function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }

