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

const map = d3.select('#map');
const selectionStatus = document.getElementById('selection-status');
const stateToggle = document.getElementById('toggle-state-labels');
const capitalToggle = document.getElementById('toggle-capital-labels');
const quizLength = document.getElementById('quiz-length');
const quizTime = document.getElementById('quiz-time');
const startQuizButton = document.getElementById('start-quiz');
const stopQuizButton = document.getElementById('stop-quiz');
const quizStatus = document.getElementById('quiz-status');

let projection;
let geoPath;
let features = [];
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

  const compact = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '');

  return stateNameAliases[compact] ?? input;
}

function stateNameFromFeature(feature) {
  const props = feature.properties ?? {};
  const candidate =
    props.name ?? props.NAME_1 ?? props.state ?? props.State ?? props.land ?? props.LAND ?? props.GEN;
  return normalizeStateName(candidate);
}

function getMapDimensions() {
  const svgNode = map.node();
  const box = svgNode.getBoundingClientRect();
  return {
    width: Math.max(640, Math.round(box.width || 720)),
    height: 980
  };
}

function clearMap() {
  map.selectAll('*').remove();
  stateElements.clear();
  capitalElements.clear();
  stateLabelElements.clear();
  capitalLabelElements.clear();
}

function renderMap() {
  clearMap();

  const { width, height } = getMapDimensions();
  map.attr('viewBox', `0 0 ${width} ${height}`);

  projection = d3.geoMercator().fitSize([width - 20, height - 20], {
    type: 'FeatureCollection',
    features
  });
  geoPath = d3.geoPath(projection);

  const mapLayer = map.append('g').attr('transform', 'translate(10,10)');

  for (const feature of features) {
    const stateName = stateNameFromFeature(feature);
    if (!stateName || !capitals[stateName]) continue;

    const statePath = mapLayer
      .append('path')
      .attr('class', 'state')
      .attr('data-state', stateName)
      .attr('d', geoPath(feature))
      .attr('tabindex', 0)
      .attr('aria-label', stateName);

    const centroid = geoPath.centroid(feature);

    const stateLabel = mapLayer
      .append('text')
      .attr('class', 'state-label')
      .attr('x', centroid[0])
      .attr('y', centroid[1])
      .text(stateName);

    const [cx, cy] = projection([capitals[stateName].lon, capitals[stateName].lat]);

    const capitalDot = mapLayer
      .append('circle')
      .attr('class', 'capital-dot')
      .attr('data-state', stateName)
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', 4.5)
      .attr('tabindex', 0)
      .attr('aria-label', `${capitals[stateName].capital}, capital of ${stateName}`);

    const capitalLabel = mapLayer
      .append('text')
      .attr('class', 'capital-label')
      .attr('x', cx + 6)
      .attr('y', cy - 6)
      .text(capitals[stateName].capital);

    statePath
      .on('click', () => handleStatePick(stateName))
      .on('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleStatePick(stateName);
        }
      });

    capitalDot
      .on('click', () => handleCapitalPick(stateName))
      .on('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCapitalPick(stateName);
        }
      });

    stateElements.set(stateName, statePath);
    capitalElements.set(stateName, capitalDot);
    stateLabelElements.set(stateName, stateLabel);
    capitalLabelElements.set(stateName, capitalLabel);
  }

  updateLabelVisibility();
}

function updateLabelVisibility() {
  for (const el of stateLabelElements.values()) {
    el.style('display', stateToggle.checked ? 'block' : 'none');
  }

  for (const el of capitalLabelElements.values()) {
    el.style('display', capitalToggle.checked ? 'block' : 'none');
  }
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
  const names = Array.from(stateElements.keys());
  const order = [...names].sort(() => Math.random() - 0.5).slice(0, Math.min(totalQuestions, names.length));
  const half = Math.ceil(order.length / 2);

  const base = order.map((stateName, index) => {
    if (index < half) {
      return {
        type: 'capital',
        stateName,
        prompt: `Click the capital of ${stateName}.`
      };
    }

    return {
      type: 'state',
      stateName,
      prompt: `Click the state whose capital is ${capitals[stateName].capital}.`
    };
  });

  return base.sort(() => Math.random() - 0.5);
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
  for (const el of stateElements.values()) el.classed('correct wrong active selected', false);
  for (const el of capitalElements.values()) el.classed('correct wrong active selected', false);
}

function highlightCurrentAnswerArea() {
  resetMarks();
  if (!quizState.active) return;

  const question = quizState.questions[quizState.currentIndex];
  if (!question) return;

  if (question.type === 'capital') {
    stateElements.get(question.stateName)?.classed('active', true);
  } else {
    capitalElements.get(question.stateName)?.classed('active', true);
  }
}

function markAndAdvance(stateName, pickedType) {
  if (!quizState.active) {
    selectionStatus.textContent = `${stateName} — ${capitals[stateName].capital}`;
    stateElements.get(stateName)?.classed('selected', true);
    return;
  }

  const question = quizState.questions[quizState.currentIndex];
  if (!question || question.type !== pickedType) return;

  const isCorrect = question.stateName === stateName;

  if (pickedType === 'capital') {
    capitalElements.get(stateName)?.classed(isCorrect ? 'correct' : 'wrong', true);
    stateElements.get(question.stateName)?.classed('active', true);
  } else {
    stateElements.get(stateName)?.classed(isCorrect ? 'correct' : 'wrong', true);
    capitalElements.get(question.stateName)?.classed('active', true);
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
  if (!response.ok) {
    throw new Error(`Could not load germany-states.geojson (${response.status}).`);
  }

  const geojson = await response.json();
  if (geojson.type !== 'FeatureCollection') {
    throw new Error('germany-states.geojson must be a GeoJSON FeatureCollection.');
  }

  features = geojson.features.filter((feature) => {
    const stateName = stateNameFromFeature(feature);
    return stateName && capitals[stateName];
  });

  if (features.length !== 16) {
    throw new Error(`Expected 16 state features but found ${features.length}.`);
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
