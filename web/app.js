const states = [
  { id: 'SH', name: 'Schleswig-Holstein', capital: 'Kiel', center: [320, 90], points: '210,40 430,40 450,150 220,165' },
  { id: 'MV', name: 'Mecklenburg-Vorpommern', capital: 'Schwerin', center: [560, 130], points: '450,60 700,75 700,215 470,215 450,150' },
  { id: 'HH', name: 'Hamburg', capital: 'Hamburg', center: [360, 205], points: '335,182 383,182 383,220 335,220' },
  { id: 'HB', name: 'Bremen', capital: 'Bremen', center: [255, 255], points: '228,233 278,233 278,273 228,273' },
  { id: 'NI', name: 'Lower Saxony', capital: 'Hanover', center: [300, 320], points: '145,180 470,180 485,470 145,455' },
  { id: 'BB', name: 'Brandenburg', capital: 'Potsdam', center: [620, 355], points: '500,230 735,230 735,470 520,470' },
  { id: 'BE', name: 'Berlin', capital: 'Berlin', center: [620, 330], points: '602,312 640,312 640,350 602,350' },
  { id: 'ST', name: 'Saxony-Anhalt', capital: 'Magdeburg', center: [495, 380], points: '405,280 550,280 570,470 420,470' },
  { id: 'NW', name: 'North Rhine-Westphalia', capital: 'Düsseldorf', center: [125, 475], points: '20,345 245,345 245,620 20,620' },
  { id: 'HE', name: 'Hesse', capital: 'Wiesbaden', center: [305, 565], points: '235,470 415,470 405,690 230,690' },
  { id: 'TH', name: 'Thuringia', capital: 'Erfurt', center: [510, 575], points: '430,470 610,470 610,675 425,675' },
  { id: 'SN', name: 'Saxony', capital: 'Dresden', center: [650, 645], points: '560,470 780,470 780,760 580,780' },
  { id: 'RP', name: 'Rhineland-Palatinate', capital: 'Mainz', center: [170, 700], points: '20,620 250,620 250,860 20,860' },
  { id: 'SL', name: 'Saarland', capital: 'Saarbrücken', center: [85, 840], points: '20,820 130,820 130,910 20,910' },
  { id: 'BW', name: 'Baden-Württemberg', capital: 'Stuttgart', center: [285, 855], points: '140,690 440,690 470,1070 130,1070' },
  { id: 'BY', name: 'Bavaria', capital: 'Munich', center: [610, 890], points: '430,675 810,675 810,1070 455,1070' }
];

const mapEl = document.getElementById('map');
const stateToggle = document.getElementById('toggle-state-labels');
const capitalToggle = document.getElementById('toggle-capital-labels');
const quizStatus = document.getElementById('quiz-status');
const quizLength = document.getElementById('quiz-length');
const quizTime = document.getElementById('quiz-time');
const startQuizButton = document.getElementById('start-quiz');
const stopQuizButton = document.getElementById('stop-quiz');

const stateNodes = new Map();
const capitalNodes = new Map();
const stateLabelNodes = [];
const capitalLabelNodes = [];

const quizState = {
  active: false,
  questions: [],
  currentIndex: 0,
  score: 0,
  deadline: null,
  timerId: null
};

function renderMap() {
  mapEl.innerHTML = '';

  for (const state of states) {
    const polygon = svgEl('polygon', {
      points: state.points,
      class: 'state',
      'data-id': state.id,
      'aria-label': state.name
    });

    polygon.addEventListener('click', () => handleStatePick(state.id));
    mapEl.appendChild(polygon);
    stateNodes.set(state.id, polygon);

    const stateLabel = svgEl('text', {
      x: state.center[0],
      y: state.center[1] - 18,
      class: 'state-label',
      'data-id': state.id
    });
    stateLabel.textContent = state.name;
    mapEl.appendChild(stateLabel);
    stateLabelNodes.push(stateLabel);

    const capitalDot = svgEl('circle', {
      cx: state.center[0],
      cy: state.center[1] + 10,
      r: 10,
      class: 'capital-dot',
      'data-id': state.id,
      'aria-label': state.capital
    });
    capitalDot.addEventListener('click', () => handleCapitalPick(state.id));
    mapEl.appendChild(capitalDot);
    capitalNodes.set(state.id, capitalDot);

    const capitalLabel = svgEl('text', {
      x: state.center[0],
      y: state.center[1] + 42,
      class: 'capital-label',
      'data-id': state.id
    });
    capitalLabel.textContent = state.capital;
    mapEl.appendChild(capitalLabel);
    capitalLabelNodes.push(capitalLabel);
  }

  updateLabelVisibility();
}

function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function updateLabelVisibility() {
  stateLabelNodes.forEach((label) => {
    label.style.display = stateToggle.checked ? 'block' : 'none';
  });
  capitalLabelNodes.forEach((label) => {
    label.style.display = capitalToggle.checked ? 'block' : 'none';
  });
}

function applyPreset(preset) {
  if (preset === 'study') {
    stateToggle.checked = true;
    capitalToggle.checked = true;
  }
  if (preset === 'states') {
    stateToggle.checked = true;
    capitalToggle.checked = false;
  }
  if (preset === 'capitals') {
    stateToggle.checked = false;
    capitalToggle.checked = true;
  }
  if (preset === 'hard') {
    stateToggle.checked = false;
    capitalToggle.checked = false;
  }
  updateLabelVisibility();
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

  const shuffled = [...states].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(totalQuestions, states.length));
  const questions = picked.map((state) => {
    const askForCapital = Math.random() > 0.5;
    return askForCapital
      ? {
          type: 'capital',
          stateId: state.id,
          prompt: `Click the capital of ${state.name}.`
        }
      : {
          type: 'state',
          stateId: state.id,
          prompt: `Click the state whose capital is ${state.capital}.`
        };
  });

  resetMarks();
  quizState.active = true;
  quizState.questions = questions;
  quizState.currentIndex = 0;
  quizState.score = 0;
  quizState.deadline = Date.now() + totalSeconds * 1000;

  startQuizButton.disabled = true;
  stopQuizButton.disabled = false;

  if (quizState.timerId) clearInterval(quizState.timerId);
  quizState.timerId = setInterval(updateQuizBanner, 250);
  updateQuizBanner();
  highlightCurrentAnswerArea();
}

function stopQuiz(message = 'Quiz stopped.') {
  if (quizState.timerId) {
    clearInterval(quizState.timerId);
    quizState.timerId = null;
  }

  quizState.active = false;
  quizState.questions = [];
  quizState.currentIndex = 0;
  quizState.deadline = null;
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

  const q = quizState.questions[quizState.currentIndex];
  if (!q) {
    stopQuiz(`Completed. Final score: ${quizState.score}/${quizState.questions.length}.`);
    return;
  }

  const remaining = Math.ceil(remainingMs / 1000);
  quizStatus.textContent = `Q${quizState.currentIndex + 1}/${quizState.questions.length} • Score ${quizState.score} • ${remaining}s left • ${q.prompt}`;
}

function resetMarks() {
  stateNodes.forEach((node) => node.classList.remove('correct', 'wrong', 'active'));
  capitalNodes.forEach((node) => node.classList.remove('correct', 'wrong', 'active'));
}

function highlightCurrentAnswerArea() {
  resetMarks();
  if (!quizState.active) return;

  const q = quizState.questions[quizState.currentIndex];
  if (!q) return;

  if (q.type === 'capital') {
    capitalNodes.get(q.stateId)?.classList.add('active');
  } else {
    stateNodes.get(q.stateId)?.classList.add('active');
  }
}

function markAndAdvance(targetId, pickedType) {
  if (!quizState.active) return;

  const q = quizState.questions[quizState.currentIndex];
  if (!q || q.type !== pickedType) return;

  const isCorrect = q.stateId === targetId;
  const stateNode = stateNodes.get(targetId);
  const capitalNode = capitalNodes.get(targetId);

  if (pickedType === 'capital') {
    capitalNode?.classList.remove('active');
    capitalNode?.classList.add(isCorrect ? 'correct' : 'wrong');
  } else {
    stateNode?.classList.remove('active');
    stateNode?.classList.add(isCorrect ? 'correct' : 'wrong');
  }

  if (isCorrect) quizState.score += 1;

  quizState.currentIndex += 1;
  updateQuizBanner();

  if (quizState.currentIndex >= quizState.questions.length) {
    setTimeout(() => stopQuiz(`Completed. Final score: ${quizState.score}/${quizState.questions.length}.`), 350);
    return;
  }

  setTimeout(() => {
    highlightCurrentAnswerArea();
    updateQuizBanner();
  }, 260);
}

function handleStatePick(stateId) {
  markAndAdvance(stateId, 'state');
}

function handleCapitalPick(stateId) {
  markAndAdvance(stateId, 'capital');
}

stateToggle.addEventListener('change', updateLabelVisibility);
capitalToggle.addEventListener('change', updateLabelVisibility);

for (const button of document.querySelectorAll('[data-preset]')) {
  button.addEventListener('click', () => applyPreset(button.dataset.preset));
}

startQuizButton.addEventListener('click', startQuiz);
stopQuizButton.addEventListener('click', () => stopQuiz('Quiz stopped.'));

renderMap();
