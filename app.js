const states = [
  {
    id: 'SH',
    name: 'Schleswig-Holstein',
    capital: 'Kiel',
    path: 'M210 80 L285 70 L340 95 L332 145 L290 178 L232 170 L198 134 Z',
    label: [272, 122],
    capitalPos: [287, 97]
  },
  {
    id: 'MV',
    name: 'Mecklenburg-Vorpommern',
    capital: 'Schwerin',
    path: 'M340 95 L418 92 L490 118 L516 178 L488 217 L422 220 L356 186 L332 145 Z',
    label: [431, 160],
    capitalPos: [395, 148]
  },
  {
    id: 'HH',
    name: 'Hamburg',
    capital: 'Hamburg',
    path: 'M250 196 L271 194 L278 212 L263 225 L246 216 Z',
    label: [271, 236],
    capitalPos: [260, 208]
  },
  {
    id: 'HB',
    name: 'Bremen',
    capital: 'Bremen',
    path: 'M202 238 L218 232 L228 245 L222 262 L206 260 L197 248 Z',
    label: [214, 278],
    capitalPos: [213, 248]
  },
  {
    id: 'NI',
    name: 'Lower Saxony',
    capital: 'Hanover',
    path: 'M165 178 L232 170 L290 178 L332 145 L356 186 L352 264 L336 306 L292 342 L230 356 L168 325 L140 272 L145 214 Z',
    label: [245, 270],
    capitalPos: [275, 288]
  },
  {
    id: 'BB',
    name: 'Brandenburg',
    capital: 'Potsdam',
    path: 'M372 252 L438 236 L502 250 L534 302 L526 364 L495 412 L442 426 L394 390 L372 332 Z',
    label: [456, 327],
    capitalPos: [442, 334]
  },
  {
    id: 'BE',
    name: 'Berlin',
    capital: 'Berlin',
    path: 'M438 312 L452 308 L458 321 L448 336 L433 333 L430 321 Z',
    label: [468, 344],
    capitalPos: [444, 321]
  },
  {
    id: 'ST',
    name: 'Saxony-Anhalt',
    capital: 'Magdeburg',
    path: 'M312 234 L372 252 L372 332 L344 378 L304 368 L282 328 L286 274 Z',
    label: [328, 304],
    capitalPos: [323, 276]
  },
  {
    id: 'NW',
    name: 'North Rhine-Westphalia',
    capital: 'Düsseldorf',
    path: 'M90 244 L145 214 L140 272 L168 325 L152 378 L114 420 L76 400 L62 342 L70 282 Z',
    label: [112, 327],
    capitalPos: [106, 350]
  },
  {
    id: 'HE',
    name: 'Hesse',
    capital: 'Wiesbaden',
    path: 'M230 356 L292 342 L304 368 L298 430 L266 468 L228 464 L201 426 L202 382 Z',
    label: [255, 410],
    capitalPos: [241, 434]
  },
  {
    id: 'TH',
    name: 'Thuringia',
    capital: 'Erfurt',
    path: 'M304 368 L344 378 L372 410 L358 452 L316 466 L282 442 L298 430 Z',
    label: [329, 420],
    capitalPos: [319, 427]
  },
  {
    id: 'SN',
    name: 'Saxony',
    capital: 'Dresden',
    path: 'M372 410 L442 426 L470 458 L462 498 L430 528 L378 520 L348 486 L358 452 Z',
    label: [410, 475],
    capitalPos: [444, 487]
  },
  {
    id: 'RP',
    name: 'Rhineland-Palatinate',
    capital: 'Mainz',
    path: 'M138 432 L202 382 L201 426 L228 464 L212 510 L186 542 L146 538 L122 496 Z',
    label: [173, 479],
    capitalPos: [191, 500]
  },
  {
    id: 'SL',
    name: 'Saarland',
    capital: 'Saarbrücken',
    path: 'M118 548 L146 538 L152 566 L138 590 L112 582 L108 560 Z',
    label: [132, 607],
    capitalPos: [130, 571]
  },
  {
    id: 'BW',
    name: 'Baden-Württemberg',
    capital: 'Stuttgart',
    path: 'M152 566 L212 510 L248 526 L266 568 L252 620 L222 674 L170 684 L142 646 L138 590 Z',
    label: [205, 604],
    capitalPos: [222, 578]
  },
  {
    id: 'BY',
    name: 'Bavaria',
    capital: 'Munich',
    path: 'M248 526 L316 466 L348 486 L378 520 L430 528 L450 586 L434 654 L392 708 L318 734 L264 706 L222 674 L252 620 L266 568 Z',
    label: [337, 620],
    capitalPos: [318, 682]
  }
];

const map = document.getElementById('map');
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

function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function renderMap() {
  map.replaceChildren();

  const background = svgEl('path', {
    d: 'M190 70 L290 48 L415 64 L520 126 L560 220 L552 330 L520 424 L486 514 L458 612 L404 722 L324 770 L226 756 L150 702 L108 614 L84 500 L58 380 L66 278 L108 188 Z',
    class: 'country-outline'
  });
  map.appendChild(background);

  for (const state of states) {
    const statePath = svgEl('path', {
      d: state.path,
      class: 'state',
      'data-id': state.id,
      'aria-label': state.name,
      tabindex: '0'
    });

    statePath.addEventListener('click', () => handleStatePick(state.id));
    statePath.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleStatePick(state.id);
      }
    });

    const stateLabel = svgEl('text', {
      x: state.label[0],
      y: state.label[1],
      class: 'state-label'
    });
    stateLabel.textContent = state.name;

    const [lx, ly] = featureCentroid(feature);
    const stateLabel = svgEl('text', { class: 'state-label', x: lx, y: ly });
    stateLabel.textContent = stateName;

    const [cx, cy] = projection.project(capitals[stateName].lon, capitals[stateName].lat);
    const capitalDot = svgEl('circle', {
      cx: state.capitalPos[0],
      cy: state.capitalPos[1],
      r: 5,
      class: 'capital-dot',
      'data-id': state.id,
      'aria-label': `${state.capital}, capital of ${state.name}`,
      tabindex: '0'
    });

    capitalDot.addEventListener('click', () => handleCapitalPick(state.id));
    capitalDot.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCapitalPick(state.id);
      }
    });

    const capitalLabel = svgEl('text', {
      x: state.capitalPos[0] + 8,
      y: state.capitalPos[1] - 8,
      class: 'capital-label'
    });
    capitalLabel.textContent = state.capital;

    map.append(statePath, stateLabel, capitalDot, capitalLabel);

    stateNodes.set(state.id, statePath);
    capitalNodes.set(state.id, capitalDot);
    stateLabelNodes.push(stateLabel);
    capitalLabelNodes.push(capitalLabel);
  }

  if (capitals[input]) return input;

  const compact = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '');

  return stateNameAliases[compact] ?? input;
}

function updateLabelVisibility() {
  stateLabelElements.forEach((el) => {
    el.style.display = stateToggle.checked ? 'block' : 'none';
  });

  capitalLabelNodes.forEach((label) => {
    label.style.display = capitalToggle.checked ? 'block' : 'none';
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
  const order = [...states].sort(() => Math.random() - 0.5).slice(0, Math.min(totalQuestions, states.length));
  const half = Math.ceil(order.length / 2);

  const base = order.map((state, index) => {
    if (index < half) {
      return {
        type: 'capital',
        stateId: state.id,
        prompt: `Click the capital of ${state.name}.`
      };
    }

    return {
      type: 'state',
      stateId: state.id,
      prompt: `Click the state whose capital is ${state.capital}.`
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
    stateNodes.get(question.stateId)?.classList.add('active');
  } else {
    capitalNodes.get(question.stateId)?.classList.add('active');
  }
}

function markAndAdvance(stateId, pickedType) {
  if (!quizState.active) return;

  const question = quizState.questions[quizState.currentIndex];
  if (!question || question.type !== pickedType) return;

  const isCorrect = question.stateId === stateId;

  if (pickedType === 'capital') {
    capitalNodes.get(stateId)?.classList.add(isCorrect ? 'correct' : 'wrong');
    stateNodes.get(question.stateId)?.classList.add('active');
  } else {
    stateNodes.get(stateId)?.classList.add(isCorrect ? 'correct' : 'wrong');
    capitalNodes.get(question.stateId)?.classList.add('active');
  }

  if (isCorrect) quizState.score += 1;

  quizState.currentIndex += 1;
  updateQuizBanner();

  if (quizState.currentIndex >= quizState.questions.length) {
    setTimeout(() => stopQuiz(`Completed. Final score: ${quizState.score}/${quizState.questions.length}.`), 320);
    return;
  }

  setTimeout(() => {
    highlightCurrentAnswerArea();
    updateQuizBanner();
  }, 220);
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
