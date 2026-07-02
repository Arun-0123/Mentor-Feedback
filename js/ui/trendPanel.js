/* ═══════════════════════════════════════════
   TREND OVER TIME PANEL
   Unchanged behaviour from the previous implementation — self-contained,
   independent of the new per-tab month filters. Loads a dedicated trend
   sheet when the college has one configured, otherwise builds a trend
   from a cycle column in the raw sheet (or a simulated preview trend as
   a last resort), seeded from the college's most recently configured
   month of data.
═══════════════════════════════════════════ */
import {$,getNpsColor} from '../utils/helpers.js';
import {state} from '../state/appState.js';
import {DEDICATED_TREND_SHEETS} from '../config/colleges.js';
import {getLatestMonthKey} from '../config/months.js';
import {getCollegeRowsForSelection} from '../data/collegeDataService.js';
import {computeDashboardData} from '../calculations/dashboardCalculations.js';
import {loadDedicatedTrendSheet,buildCycleMapFromRows,computeTrendData} from '../calculations/trendCalculations.js';
import {renderTrendCharts} from './charts.js';

/** Loads TREND_DATA for the given college and stores it in state.trend. */
export async function loadTrendForCollege(college){
  state.trend=null;
  if(!college)return;
  const hasDedicated=!!DEDICATED_TREND_SHEETS[college.name];
  if(hasDedicated){
    try{
      const dedicated=await loadDedicatedTrendSheet(college.name);
      if(dedicated&&state.currentCollege===college){
        state.trend=dedicated;
        if(state.currentDetailPanel==='trends')renderTrendPanel();
        return;
      }
    }catch(e){console.warn('Dedicated trend sheet failed:',e);}
  }
  // Fallback: build from the latest configured month's raw rows.
  const latestMonth=getLatestMonthKey();
  if(!latestMonth)return;
  try{
    const rows=await getCollegeRowsForSelection(latestMonth,college);
    if(state.currentCollege!==college)return;
    const seed=computeDashboardData(rows);
    const {cycleMap,hasCycle}=buildCycleMapFromRows(rows);
    state.trend=computeTrendData(cycleMap,hasCycle,rows.length,seed);
    state.trend.hasDedicatedConfig=hasDedicated; // dedicated sheet was configured but failed to load
    if(state.currentDetailPanel==='trends')renderTrendPanel();
  }catch(e){
    console.error('Trend fallback load failed:',e);
  }
}

function buildTrendCycleButtons(){
  const TREND_DATA=state.trend;const{cycles}=TREND_DATA;const wrap=$('trendCycleBtns');
  if(!cycles.length){wrap.innerHTML='';return;}
  wrap.innerHTML='';
  cycles.forEach((c,i)=>{
    const btn=document.createElement('button');
    btn.className='trend-cycle-btn'+(i===cycles.length-1?' active':'');
    btn.textContent=c;
    btn.onclick=()=>selectTrendCycle(c,btn);
    wrap.appendChild(btn);
  });
}
function selectTrendCycle(cycle,btn){
  document.querySelectorAll('.trend-cycle-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderTrendKpis(cycle);
}
function getTrendDateRange(){
  const TREND_DATA=state.trend;
  const cycles=TREND_DATA?TREND_DATA.cycles:null;
  if(!cycles||!cycles.length)return'Sep 2025 – Apr 2026';
  const first=cycles[0];const last=cycles[cycles.length-1];
  return first===last?first:`${first} – ${last}`;
}

export function renderTrendPanel(){
  const TREND_DATA=state.trend;
  if(!TREND_DATA)return;
  const{cycles,hasCycleCol,hasDedicatedSheet,hasDedicatedConfig}=TREND_DATA;
  const collegeName=state.currentCollege?state.currentCollege.name:'';
  const hasConfig=hasDedicatedConfig!==undefined?hasDedicatedConfig:!!DEDICATED_TREND_SHEETS[collegeName];
  const srcIndicator=$('trendSourceIndicator');
  if(hasDedicatedSheet){srcIndicator.style.display='none';srcIndicator.innerHTML='';$('trendHeroSub').textContent=`Live trend data from dedicated sheet · ${cycles.length} months tracked`;}
  else if(hasConfig){srcIndicator.style.display='inline-flex';srcIndicator.innerHTML=`<span class="trend-source-badge simulated">Sheet load failed — showing simulated</span>`;$('trendHeroSub').textContent=`Could not load dedicated trend sheet — showing simulated preview data`;}
  else if(hasCycleCol){srcIndicator.style.display='none';$('trendHeroSub').textContent=`Tracking ${cycles.length} months with real cycle data from your sheet`;}
  else{srcIndicator.style.display='none';$('trendHeroSub').textContent=`Preview mode — simulated trend for Sep 2025–Apr 2026.`;}

  const _tdr=getTrendDateRange();
  const _eyebrow=$('trendEyebrow');if(_eyebrow)_eyebrow.textContent=`Historical Analytics · ${_tdr}`;
  const _heroTitle=$('trendHeroTitle');if(_heroTitle)_heroTitle.textContent=`Trend Over Time · ${_tdr}`;
  const _rct=$('trendRatingCardTitle');if(_rct)_rct.textContent=`Average Rating Trend · ${_tdr}`;
  const _tct=$('trendTableCardTitle');if(_tct)_tct.textContent=`Month-by-Month Summary Table · ${_tdr}`;
  $('trendRatingBadge').textContent=`${cycles.length} months`;$('trendNpsBadge').textContent=`${cycles.length} months`;$('trendHitRatioBadge').textContent=`${cycles.length} months`;$('trendSegBadge').textContent=`${cycles.length} months`;$('trendTableBadge').textContent=`${cycles.length} months`;

  buildTrendCycleButtons();
  if(!cycles.length)return;
  renderTrendKpis(cycles[cycles.length-1]);
  renderTrendCharts(TREND_DATA);
  renderTrendCycleTable();
}

function renderTrendKpis(cycle){
  const TREND_DATA=state.trend;
  const{cycles,cycleStats}=TREND_DATA;const curr=cycleStats[cycle];if(!curr)return;const idx=cycles.indexOf(cycle);const prev=idx>0?cycleStats[cycles[idx-1]]:null;
  function setKpi(valId,deltaId,cycleId,val,prevVal,fmt){
    $(valId).textContent=val!==null&&val!==undefined?fmt(val):'—';
    const d=$(deltaId),cy=$(cycleId);cy.textContent=`Latest: ${cycle}`;
    if(prev&&val!==null&&val!==undefined&&prevVal!==null&&prevVal!==undefined){
      const diff=val-prevVal;const sign=diff>=0?'+':'';const cls=diff>0.005?'up':diff<-0.005?'down':'flat';
      d.className=`trend-kpi-delta ${cls}`;d.textContent=`${sign}${fmt(diff)} vs ${cycles[idx-1]}`;
    }else{d.className='trend-kpi-delta flat';d.textContent='First month';}
  }
  setKpi('tkpiRating','tkpiRatingDelta','tkpiRatingCycle',curr.ratingAvg,prev?.ratingAvg,v=>v.toFixed(2));
  setKpi('tkpiNps','tkpiNpsDelta','tkpiNpsCycle',curr.npsIndex,prev?.npsIndex,v=>(v>0?'+':'')+v);
  setKpi('tkpiHitRatio','tkpiHitRatioDelta','tkpiHitRatioCycle',curr.hitRatio,prev?.hitRatio,v=>v!==null?v.toFixed(1)+'%':'—');
  setKpi('tkpiPromo','tkpiPromoDelta','tkpiPromoCycle',curr.promoterPct,prev?.promoterPct,v=>parseFloat(v).toFixed(2)+'%');
}

function renderTrendCycleTable(){
  const TREND_DATA=state.trend;
  const{cycles,cycleStats}=TREND_DATA;
  if(!cycles.length){$('trendCycleTableBody').innerHTML='<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--ink3);">No data</td></tr>';return;}
  $('trendCycleTableBody').innerHTML=cycles.map((c,idx)=>{
    const s=cycleStats[c];const prevKey=idx>0?cycles[idx-1]:null;const prev=prevKey?cycleStats[prevKey]:null;
    function deltaPill(curr,prevVal,fmt){if(!prev||curr===null||curr===undefined||prevVal===null||prevVal===undefined)return'<span class="delta-pill flat">—</span>';const d=curr-prevVal;const sign=d>=0?'+':'';const cls=d>0.01?'up':d<-0.01?'down':'flat';return`<span class="delta-pill ${cls}">${sign}${fmt(d)}</span>`;}
    const hitRatioDisplay=s.hitRatio!==null&&s.hitRatio!==undefined?`<span style="color:#065f46;font-weight:600;">${s.hitRatio.toFixed(1)}%</span>`:'<span style="color:var(--ink4);">—</span>';
    return`<tr><td style="font-weight:600;color:var(--gold-dark);">${c}</td><td style="font-family:var(--font-display);font-size:15px;">${s.responses||'—'}</td><td style="font-family:var(--font-display);font-size:15px;color:var(--gold-dark);">${s.ratingAvg!==null&&s.ratingAvg!==undefined?s.ratingAvg.toFixed(2):'—'}</td><td>${deltaPill(s.ratingAvg,prev?.ratingAvg,v=>v.toFixed(2))}</td><td style="font-family:var(--font-display);font-size:15px;color:${getNpsColor(s.npsIndex)};">${s.npsIndex!==null&&s.npsIndex!==undefined?(s.npsIndex>0?'+':'')+s.npsIndex:'—'}</td><td>${deltaPill(s.npsIndex,prev?.npsIndex,v=>(v>0?'+':'')+Math.round(v))}</td><td>${hitRatioDisplay}</td><td>${deltaPill(s.hitRatio,prev?.hitRatio,v=>v.toFixed(1)+'%')}</td><td>${s.promoterPct!==null&&s.promoterPct!==undefined?s.promoterPct+'%':'—'}</td><td>${s.detractorPct!==null&&s.detractorPct!==undefined?s.detractorPct+'%':'—'}</td><td>${s.mentorCount||'—'}</td></tr>`;
  }).join('');
}
