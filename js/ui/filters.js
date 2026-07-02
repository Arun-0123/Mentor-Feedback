/* ═══════════════════════════════════════════
   FILTERS
   ───────────────────────────────────────────
   Two independent filter UIs, both built on the existing `.filter-chip`
   style:
     • Month filter — rendered on Summary / Mentor Performance / NPS
       Analysis, each with its own state (state.monthFilters[tab]) so
       selecting a month on one tab never affects the others.
     • Department filter — Mentor Performance tab only (unchanged from
       the previous implementation).
═══════════════════════════════════════════ */
import {getSortedMonthKeys,ALL_MONTHS_KEY} from '../config/months.js';
import {state} from '../state/appState.js';

/**
 * Renders the "All + every configured month" chip row into containerEl
 * for the given tab, and wires clicks to call onSelect(monthKey).
 */
export function renderMonthFilterChips(containerEl,tab,onSelect){
  if(!containerEl)return;
  const months=getSortedMonthKeys();
  const active=state.monthFilters[tab];

  containerEl.innerHTML='';
  const label=document.createElement('span');
  label.className='filter-row-label';
  label.textContent='Month';
  containerEl.appendChild(label);

  const makeChip=(labelText,value)=>{
    const btn=document.createElement('button');
    btn.className='filter-chip'+(active===value?' active':'');
    btn.textContent=labelText;
    btn.onclick=()=>{
      if(state.monthFilters[tab]===value)return;
      state.monthFilters[tab]=value;
      containerEl.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      onSelect(value);
    };
    return btn;
  };

  containerEl.appendChild(makeChip('All',ALL_MONTHS_KEY));
  months.forEach(m=>containerEl.appendChild(makeChip(m,m)));
}

/** Renders the dept filter chip row (Mentor Performance tab). */
export function renderDeptFilterChips(containerEl,DEPT_LIST,onSelect){
  if(!containerEl)return;
  containerEl.innerHTML='';
  const makeChip=(labelText,value)=>{
    const btn=document.createElement('button');
    btn.className='filter-chip'+(state.deptFilter===value?' active':'');
    btn.textContent=labelText;
    btn.onclick=()=>{
      state.deptFilter=value;
      containerEl.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      onSelect(value);
    };
    return btn;
  };
  containerEl.appendChild(makeChip('All','all'));
  DEPT_LIST.forEach(dept=>containerEl.appendChild(makeChip(dept,dept)));
}
