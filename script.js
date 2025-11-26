(function () {
  'use strict';

  const display = document.getElementById('display');
  const startBtn = document.getElementById('startBtn');
  const lapBtn = document.getElementById('lapBtn');
  const resetBtn = document.getElementById('resetBtn');
  const lapsContainer = document.getElementById('laps');
  const lapsCount = document.getElementById('lapsCount');
  const card = document.querySelector('.card');

  let running = false;
  let startTime = 0;
  let elapsedBefore = 0;
  let rafId = null;
  let laps = [];

  function formatTime(ms) {
    const totalMs = Math.floor(ms);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = totalMs % 1000;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  function update() {
    if (!running) return;
    const now = performance.now();
    const elapsed = elapsedBefore + (now - startTime);
    display.textContent = formatTime(elapsed);
    rafId = requestAnimationFrame(update);
  }

  function updateButtonStates() {
    const hasTime = elapsedBefore > 0;
    const hasLaps = laps.length > 0;

    lapBtn.disabled = !running;
    resetBtn.disabled = !running && !hasTime && !hasLaps;
  }

  function start() {
    if (running) return;
    
    running = true;
    startTime = performance.now();
    rafId = requestAnimationFrame(update);
    
    startBtn.textContent = 'Pause';
    startBtn.classList.remove('btn-start');
    startBtn.setAttribute('aria-label', 'Pause stopwatch');
    card.classList.add('running');
    
    updateButtonStates();
  }

  function pause() {
    if (!running) return;
    
    running = false;
    elapsedBefore += performance.now() - startTime;
    
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    
    startBtn.textContent = 'Resume';
    startBtn.classList.add('btn-start');
    startBtn.setAttribute('aria-label', 'Resume stopwatch');
    card.classList.remove('running');
    
    updateButtonStates();
  }

  function reset() {
    running = false;
    startTime = 0;
    elapsedBefore = 0;
    
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    
    display.textContent = '00:00.000';
    startBtn.textContent = 'Start';
    startBtn.classList.add('btn-start');
    startBtn.setAttribute('aria-label', 'Start stopwatch');
    card.classList.remove('running');
    
    laps = [];
    renderLaps();
    updateButtonStates();
  }

  function lap() {
    if (!running) return;
    
    const currentMs = elapsedBefore + (performance.now() - startTime);
    const previousCumulativeMs = laps.length > 0 ? laps[laps.length - 1].cumulativeMs : 0;
    const lapTime = currentMs - previousCumulativeMs;
    
    const entry = {
      index: laps.length + 1,
      time: formatTime(lapTime),
      cumulative: formatTime(currentMs),
      cumulativeMs: currentMs,
      lapMs: lapTime
    };
    
    laps.push(entry);
    renderLaps();
    highlightFastestSlowest();
  }

  function highlightFastestSlowest() {
    if (laps.length < 2) return;
    
    const lapTimes = laps.map(l => l.lapMs);
    const fastest = Math.min(...lapTimes);
    const slowest = Math.max(...lapTimes);

    const lapElements = lapsContainer.querySelectorAll('li');
    lapElements.forEach((el, idx) => {
      const reversedIdx = laps.length - 1 - idx;
      el.classList.remove('fastest', 'slowest');
      
      if (fastest !== slowest) {
        if (laps[reversedIdx].lapMs === fastest) {
          el.classList.add('fastest');
        }
        if (laps[reversedIdx].lapMs === slowest) {
          el.classList.add('slowest');
        }
      }
    });
  }

  function renderLaps() {
    lapsContainer.innerHTML = '';
    
    for (let i = laps.length - 1; i >= 0; i--) {
      const l = laps[i];
      const li = document.createElement('li');
      li.innerHTML = `
        <span><strong>Lap ${l.index}</strong></span>
        <span>${l.time} <span class="small">(${l.cumulative})</span></span>
      `;
      lapsContainer.appendChild(li);
    }
    
    lapsCount.textContent = laps.length;
  }

  startBtn.addEventListener('click', () => {
    running ? pause() : start();
  });

  lapBtn.addEventListener('click', lap);
  resetBtn.addEventListener('click', reset);

  window.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const tag = active ? active.tagName : '';
    const isEditable = active && active.isContentEditable === true;
    
    if (tag === 'INPUT' || tag === 'TEXTAREA' || isEditable) {
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      running ? pause() : start();
    }
    
    if (e.key.toLowerCase() === 'l') {
      e.preventDefault();
      lap();
    }
    
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      reset();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) {
      pause();
    }
  });

  updateButtonStates();
})();