(() => {
  'use strict';
  const root = document.querySelector('[data-release-lab]');
  if (!root) return;
  const buttons = [...root.querySelectorAll('[data-scenario]')];
  const panels = [...root.querySelectorAll('[data-scenario-panel]')];
  const names = {inventory:'01 / INVENTORY',delivery:'02 / DELIVERY',drift:'03 / DRIFT'};
  const signals = {inventory:'UNKNOWN ≠ ABSENT',delivery:'BUILD ≠ RELEASE',drift:'DESIRED ≠ LIVE'};
  const status = root.querySelector('.release-lab-status');
  const signal = root.querySelector('[data-signal-label]');
  function select(name) {
    if (!Object.hasOwn(names,name)) return;
    root.dataset.activeScenario = name;
    buttons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.scenario === name)));
    panels.forEach(panel => { panel.hidden = panel.dataset.scenarioPanel !== name; });
    status.textContent = names[name];
    signal.textContent = signals[name];
  }
  buttons.forEach((button,index) => {
    button.addEventListener('click',() => select(button.dataset.scenario));
    button.addEventListener('keydown',event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length-1 : (index+(event.key === 'ArrowRight'?1:-1)+buttons.length)%buttons.length;
      buttons[next].focus();
      select(buttons[next].dataset.scenario);
    });
  });
  select('inventory');
})();