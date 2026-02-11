const capitals = {
  'Baden-Württemberg': { capital: 'Stuttgart', lon: 9.1829, lat: 48.7758 },
  Bavaria: { capital: 'Munich', lon: 11.582, lat: 48.1351 },
  Berlin: { capital: 'Berlin', lon: 13.405, lat: 52.52 },
  Brandenburg: { capital: 'Potsdam', lon: 13.0645, lat: 52.3906 },
  Bremen: { capital: 'Bremen', lon: 8.8017, lat: 53.0793 },
  Hamburg: { capital: 'Hamburg', lon: 9.9937, lat: 53.5511 },
  Hesse: { capital: 'Wiesbaden', lon: 8.2398, lat: 50.0782 },
  'Lower Saxony': { capital: 'Hanover', lon: 9.732, lat: 52.3759 },
  'Mecklenburg-Vorpommern': { capital: 'Schwerin', lon: 11.4148, lat: 53.6355 },
  'North Rhine-Westphalia': { capital: 'Düsseldorf', lon: 6.7735, lat: 51.2277 },
  'Rhineland-Palatinate': { capital: 'Mainz', lon: 8.2473, lat: 50.0 },
  Saarland: { capital: 'Saarbrücken', lon: 6.9969, lat: 49.2402 },
  Saxony: { capital: 'Dresden', lon: 13.7373, lat: 51.0504 },
  'Saxony-Anhalt': { capital: 'Magdeburg', lon: 11.6276, lat: 52.1205 },
  'Schleswig-Holstein': { capital: 'Kiel', lon: 10.1228, lat: 54.3233 },
  Thuringia: { capital: 'Erfurt', lon: 11.0299, lat: 50.9848 }
};

const stateNameAliases = {
  BadenWuerttemberg: 'Baden-Württemberg',
  Bayern: 'Bavaria',
  Berlin: 'Berlin',
  Brandenburg: 'Brandenburg',
  Bremen: 'Bremen',
  Hamburg: 'Hamburg',
  Hessen: 'Hesse',
  Niedersachsen: 'Lower Saxony',
  MecklenburgVorpommern: 'Mecklenburg-Vorpommern',
  NordrheinWestfalen: 'North Rhine-Westphalia',
  RheinlandPfalz: 'Rhineland-Palatinate',
  Saarland: 'Saarland',
  Sachsen: 'Saxony',
  SachsenAnhalt: 'Saxony-Anhalt',
  SchleswigHolstein: 'Schleswig-Holstein',
  Thueringen: 'Thuringia',
  Thüringen: 'Thuringia'
};

const map = document.getElementById('map');
const selectionStatus = document.getElementById('selection-status');
const stateToggle = document.getElementById('toggle-state-labels');
const capitalToggle = document.getElementById('toggle-capital-labels');
const quizLength = document.getElementById('quiz-length');
const quizTime = document.getElementById('quiz-time');
const startQuizButton = document.getElementById('start-quiz');
const stopQuizButton = document.getElementById('stop-quiz');
const quizStatus = document.getElementById('quiz-status');

let geoFeatures = [];
let projection = null;

const stateElements = new Map();
const capitalElements = new Map();
const stateLabelElements = new Map();
const capitalLabelElements = new Map();

const quizState = {
  active: false,
  questions: [],
  currentIndex: 0,
  score: 0,
  deadline: 0,
  timerId: null
};

function normalizeStateName(raw) {
  const input = String(raw ?? '').trim();
  if (!input) return null;
  if (capitals[input]) return input;

  const compact = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, '');
  return stateNameAliases[compact] ?? input;
}

function stateNameFromFeature(feature) {
  const props = feature.properties ?? {};
  const candidate = props.name ?? props.NAME_1 ?? props.state ?? props.State ?? props.land ?? props.LAND ?? props.GEN;
  return normalizeStateName(candidate);
}

function mercatorRaw(lon, lat) {
  const lambda = (lon * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  return [lambda, Math.log(Math.tan(Math.PI / 4 + phi / 2))];
}

function flattenCoordinates(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function buildProjection(features, width, height, padding = 20) {
  const points = [];
  for (const feature of features) {
    for (const polygon of flattenCoordinates(feature.geometry)) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) {
          points.push(mercatorRaw(lon, lat));
        }
      }
    }
  }

  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const sx = (width - 2 * padding) / (maxX - minX);
  const sy = (height - 2 * padding) / (maxY - minY);
  const scale = Math.min(sx, sy);

  return {
    project(lon, lat) {
      const [x, y] = mercatorRaw(lon, lat);
      return [padding + (x - minX) * scale, padding + (maxY - y) * scale];
    }
  };
}

function polygonPath(geometry) {
  let path = '';
  for (const polygon of flattenCoordinates(geometry)) {
    for (const ring of polygon) {
      if (!ring.length) continue;
      const [x0, y0] = projection.project(ring[0][0], ring[0][1]);
      path += `M${x0.toFixed(2)} ${y0.toFixed(2)}`;
      for (let i = 1; i < ring.length; i += 1) {
        const [x, y] = projection.project(ring[i][0], ring[i][1]);
        path += `L${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      path += 'Z';
    }
  }
  return path;
}

function featureCentroid(feature) {
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (const polygon of flattenCoordinates(feature.geometry)) {
    for (const ring of polygon) {
      for (const [lon, lat] of ring) {
        const [x, y] = projection.project(lon, lat);
        sumX += x;
        sumY += y;
        count += 1;
      }
    }
  }
  return count ? [sumX / count, sumY / count] : [0, 0];
}

function clearMap() {
  map.replaceChildren();
  stateElements.clear();
  capitalElements.clear();
  stateLabelElements.clear();
  capitalLabelElements.clear();
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  return el;
}

function renderMap() {
  clearMap();

  const width = 720;
  const height = 980;
  map.setAttribute('viewBox', `0 0 ${width} ${height}`);
  projection = buildProjection(geoFeatures, width, height, 24);

  for (const feature of geoFeatures) {
    const stateName = stateNameFromFeature(feature);
    if (!stateName || !capitals[stateName]) continue;

    const statePath = svgEl('path', {
      class: 'state',
      d: polygonPath(feature.geometry),
      'data-state': stateName,
      tabindex: 0,
      'aria-label': stateName
    });

    const [lx, ly] = featureCentroid(feature);
    const stateLabel = svgEl('text', { class: 'state-label', x: lx, y: ly });
    stateLabel.textContent = stateName;

    const [cx, cy] = projection.project(capitals[stateName].lon, capitals[stateName].lat);
    const capitalDot = svgEl('circle', {
      class: 'capital-dot',
      'data-state': stateName,
      cx,
      cy,
      r: 4.5,
      tabindex: 0,
      'aria-label': `${capitals[stateName].capital}, capital of ${stateName}`
    });

    const capitalLabel = svgEl('text', { class: 'capital-label', x: cx + 6, y: cy - 6 });
    capitalLabel.textContent = capitals[stateName].capital;

    statePath.addEventListener('click', () => handleStatePick(stateName));
    statePath.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleStatePick(stateName);
      }
    });

    capitalDot.addEventListener('click', () => handleCapitalPick(stateName));
    capitalDot.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCapitalPick(stateName);
      }
    });

    map.append(statePath, stateLabel, capitalDot, capitalLabel);
    stateElements.set(stateName, statePath);
    capitalElements.set(stateName, capitalDot);
    stateLabelElements.set(stateName, stateLabel);
    capitalLabelElements.set(stateName, capitalLabel);
  }

  updateLabelVisibility();
}

function updateLabelVisibility() {
  stateLabelElements.forEach((el) => {
    el.style.display = stateToggle.checked ? 'block' : 'none';
  });

  capitalLabelElements.forEach((el) => {
    el.style.display = capitalToggle.checked ? 'block' : 'none';
  });
}

function applyPreset(preset) {
  const presets = {
    study: [true, true],
    states: [true, false],
    capitals: [false, true],
    hard: [false, false]
  };

  const selected = presets[preset];
  if (!selected) return;
  [stateToggle.checked, capitalToggle.checked] = selected;
  updateLabelVisibility();
}

function createQuestions(totalQuestions) {
  const names = [...stateElements.keys()];
  const order = [...names].sort(() => Math.random() - 0.5).slice(0, Math.min(totalQuestions, names.length));
  const half = Math.ceil(order.length / 2);

  return order
    .map((stateName, index) =>
      index < half
        ? { type: 'capital', stateName, prompt: `Click the capital of ${stateName}.` }
        : { type: 'state', stateName, prompt: `Click the state whose capital is ${capitals[stateName].capital}.` }
    )
    .sort(() => Math.random() - 0.5);
}

function startQuiz() {
  const totalQuestions = Number(quizLength.value);
  const totalSeconds = Number(quizTime.value);

  if (!Number.isFinite(totalQuestions) || totalQuestions < 1) {
    quizStatus.textContent = 'Question count must be at least 1.';
    return;
  }
  if (!Number.isFinite(totalSeconds) || totalSeconds < 15) {
    quizStatus.textContent = 'Time should be at least 15 seconds.';
    return;
  }

  quizState.active = true;
  quizState.questions = createQuestions(totalQuestions);
  quizState.currentIndex = 0;
  quizState.score = 0;
  quizState.deadline = Date.now() + totalSeconds * 1000;

  startQuizButton.disabled = true;
  stopQuizButton.disabled = false;

  if (quizState.timerId) clearInterval(quizState.timerId);
  quizState.timerId = setInterval(updateQuizBanner, 250);

  resetMarks();
  highlightCurrentAnswerArea();
  updateQuizBanner();
}

function stopQuiz(message = 'Quiz stopped.') {
  if (quizState.timerId) {
    clearInterval(quizState.timerId);
    quizState.timerId = null;
  }

  quizState.active = false;
  quizState.questions = [];
  quizState.currentIndex = 0;
  quizState.deadline = 0;

  startQuizButton.disabled = false;
  stopQuizButton.disabled = true;
  resetMarks();
  quizStatus.textContent = message;
}

function updateQuizBanner() {
  if (!quizState.active) return;

  const remainingMs = quizState.deadline - Date.now();
  if (remainingMs <= 0) {
    stopQuiz(`Time is up. Final score: ${quizState.score}/${quizState.questions.length}.`);
    return;
  }

  const question = quizState.questions[quizState.currentIndex];
  if (!question) {
    stopQuiz(`Completed. Final score: ${quizState.score}/${quizState.questions.length}.`);
    return;
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  quizStatus.textContent = `Q${quizState.currentIndex + 1}/${quizState.questions.length} • Score ${quizState.score} • ${remainingSeconds}s left • ${question.prompt}`;
}

function resetMarks() {
  stateElements.forEach((el) => el.classList.remove('correct', 'wrong', 'active', 'selected'));
  capitalElements.forEach((el) => el.classList.remove('correct', 'wrong', 'active', 'selected'));
}

function highlightCurrentAnswerArea() {
  resetMarks();
  if (!quizState.active) return;

  const question = quizState.questions[quizState.currentIndex];
  if (!question) return;

  if (question.type === 'capital') {
    stateElements.get(question.stateName)?.classList.add('active');
  } else {
    capitalElements.get(question.stateName)?.classList.add('active');
  }
}

function markAndAdvance(stateName, pickedType) {
  if (!quizState.active) {
    selectionStatus.textContent = `${stateName} — ${capitals[stateName].capital}`;
    resetMarks();
    stateElements.get(stateName)?.classList.add('selected');
    capitalElements.get(stateName)?.classList.add('selected');
    return;
  }

  const question = quizState.questions[quizState.currentIndex];
  if (!question || question.type !== pickedType) return;

  const isCorrect = question.stateName === stateName;

  if (pickedType === 'capital') {
    capitalElements.get(stateName)?.classList.add(isCorrect ? 'correct' : 'wrong');
    stateElements.get(question.stateName)?.classList.add('active');
  } else {
    stateElements.get(stateName)?.classList.add(isCorrect ? 'correct' : 'wrong');
    capitalElements.get(question.stateName)?.classList.add('active');
  }

  if (isCorrect) quizState.score += 1;

  quizState.currentIndex += 1;
  updateQuizBanner();

  if (quizState.currentIndex >= quizState.questions.length) {
    setTimeout(() => stopQuiz(`Completed. Final score: ${quizState.score}/${quizState.questions.length}.`), 300);
    return;
  }

  setTimeout(() => {
    highlightCurrentAnswerArea();
    updateQuizBanner();
  }, 180);
}

function handleStatePick(stateName) {
  markAndAdvance(stateName, 'state');
}

function handleCapitalPick(stateName) {
  markAndAdvance(stateName, 'capital');
}

async function loadGeoJson() {
  const response = await fetch('germany-states.geojson');
  if (!response.ok) throw new Error(`Could not load germany-states.geojson (${response.status}).`);

  const geojson = await response.json();
  if (geojson.type !== 'FeatureCollection') {
    throw new Error('germany-states.geojson must be a GeoJSON FeatureCollection.');
  }

  geoFeatures = geojson.features.filter((feature) => {
    const name = stateNameFromFeature(feature);
    return name && capitals[name];
  });

  if (geoFeatures.length !== 16) {
    throw new Error(`Expected 16 state features but found ${geoFeatures.length}.`);
  }

  renderMap();
}

stateToggle.addEventListener('change', updateLabelVisibility);
capitalToggle.addEventListener('change', updateLabelVisibility);

for (const button of document.querySelectorAll('[data-preset]')) {
  button.addEventListener('click', () => applyPreset(button.dataset.preset));
}

startQuizButton.addEventListener('click', startQuiz);
stopQuizButton.addEventListener('click', () => stopQuiz('Quiz stopped.'));

loadGeoJson().catch((error) => {
  quizStatus.textContent = error.message;
  selectionStatus.textContent = 'Map data missing or invalid. Add a valid germany-states.geojson with 16 states.';
});
