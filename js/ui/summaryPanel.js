/* ═══════════════════════════════════════════
   SUMMARY PANEL
   Metric cards + Mentor Rankings chart + NPS gauge. Driven entirely by
   this tab's OWN month filter (state.monthFilters.summary).
═══════════════════════════════════════════ */
import {$,getNpsColor,getNpsLabel,animateCounter} from '../utils/helpers.js';
import {state,nextRequestId,isLatestRequest} from '../state/appState.js';
import {getCollegeRowsForSelection} from '../data/collegeDataService.js';
import {getHitRatio} from '../data/hitRatioService.js';
import {computeDashboardData} from '../calculations/dashboardCalculations.js';
import {renderMonthFilterChips} from './filters.js';
import {renderTopMentorsChart} from './charts.js';

let needleAnimRAF=null;

export function initSummaryFilters(onReload){
  renderMonthFilterChips($('summaryMonthFilterRow'),'summary',()=>reloadSummary(onReload));
}

/** (Re)loads raw rows for the current college + this tab's month filter, then renders. */
export async function reloadSummary(onDone){
  const college=state.currentCollege;
  if(!college)return;
  const reqId=nextRequestId('summary');
  state.loading.summary=true;
  try{
    const rows=await getCollegeRowsForSelection(state.monthFilters.summary,college);
    if(!isLatestRequest('summary',reqId))return; // a newer filter change superseded this request
    const computed=computeDashboardData(rows);
    state.data.summary={rows,...computed};
    renderSummaryPanel();
  }catch(err){
    console.error('Summary load failed:',err);
    if(isLatestRequest('summary',reqId))renderSummaryError();
  }finally{
    if(isLatestRequest('summary',reqId))state.loading.summary=false;
    if(onDone)onDone();
  }
}

function renderSummaryError(){
  $('avgRating').textContent='—';
  $('mentorCount').textContent='—';
  $('subjectCount').textContent='—';
  $('subjectSub').textContent='Failed to load data for this month';
}

export function renderSummaryPanel(){
  const bundle=state.data.summary;
  if(!bundle)return;
  const {TABLE_DATA,MENTORS,DEPT_LIST,NPS_DATA}=bundle;

  const tot=TABLE_DATA.length;
  const avgR=tot>0?TABLE_DATA.reduce((s,r)=>s+r.rating,0)/tot:0;
  $('avgRating').textContent=avgR>0?`${avgR.toFixed(1)} / 5`:'—';

  $('hitRatioSub').textContent=`${bundle.rows.length} responses · ${DEPT_LIST.length} depts`;
  renderHitRatio();

  $('mentorCount').textContent=MENTORS.length;
  $('mentorSub').textContent=`Across ${DEPT_LIST.length} departments`;

  const topMentor=MENTORS[0]||null;
  if(topMentor){
    $('subjectCount').textContent=topMentor.name;
    $('subjectSub').textContent=`Bayesian: ${topMentor.bayesianRating.toFixed(2)} · Avg: ${topMentor.rating.toFixed(1)}`;
  }else{
    $('subjectCount').textContent='—';
    $('subjectSub').textContent='No data';
  }

  renderTopMentorsChart(MENTORS);
  renderNPSSummary(NPS_DATA);

  if(state.currentDetailPanel==='summary'&&state.currentCollege){
    $('pageSub').textContent=`${state.currentCollege.name} · ${DEPT_LIST.length} depts · ${MENTORS.length} mentors`;
  }
}

async function renderHitRatio(){
  const college=state.currentCollege;
  if(!college)return;
  const hit=await getHitRatio(college.name);
  if(state.currentCollege!==college)return; // college changed while awaiting
  $('hitRatioMetric').textContent=hit!==null?`${hit.toFixed(1)}%`:'—';
}

function animateNPSNeedle(targetDeg,duration){
  duration=duration||1500;
  const group=$('npsNeedleGroup');
  if(needleAnimRAF){cancelAnimationFrame(needleAnimRAF);needleAnimRAF=null;}
  const startDeg=-90,startTime=performance.now();
  function easeOutCubic(t){return 1-Math.pow(1-t,3);}
  function step(now){
    const elapsed=now-startTime,progress=Math.min(elapsed/duration,1);
    group.setAttribute('transform',`rotate(${startDeg+(targetDeg-startDeg)*easeOutCubic(progress)},100,100)`);
    if(progress<1){needleAnimRAF=requestAnimationFrame(step);}
    else{
      needleAnimRAF=null;let wobbleStart=null;
      function wobble(ts){
        if(!wobbleStart)wobbleStart=ts;
        const t=Math.min((ts-wobbleStart)/600,1);
        const offset=Math.sin(t*Math.PI*4)*2*(1-t);
        group.setAttribute('transform',`rotate(${targetDeg+offset},100,100)`);
        if(t<1)needleAnimRAF=requestAnimationFrame(wobble);
        else{group.setAttribute('transform',`rotate(${targetDeg},100,100)`);needleAnimRAF=null;}
      }
      needleAnimRAF=requestAnimationFrame(wobble);
    }
  }
  needleAnimRAF=requestAnimationFrame(step);
}

function renderNPSSummary(NPS_DATA){
  const{promoters,passives,detractors,npsIndex,total}=NPS_DATA;
  const scoreBigEl=$('npsScoreBig');scoreBigEl.style.color=getNpsColor(npsIndex);
  if(npsIndex!==null)animateCounter(scoreBigEl,npsIndex,1200,'');else scoreBigEl.textContent='—';
  $('npsScoreLabel').textContent=total>0?getNpsLabel(npsIndex):'No NPS data in sheet';
  $('npsBadge').textContent=total>0?`${total} responses`:'No data';
  const promoPct=total>0?Math.round(promoters/total*100):0,passPct=total>0?Math.round(passives/total*100):0,detrPct=total>0?Math.round(detractors/total*100):0;
  $('npsPromotersCount').textContent=total>0?promoters:'—';$('npsPassivesCount').textContent=total>0?passives:'—';$('npsDetractorsCount').textContent=total>0?detractors:'—';
  $('npsPromotersPct').textContent=total>0?`${promoPct}% · score 9–10`:'score 9–10';$('npsPassivesPct').textContent=total>0?`${passPct}% · score 7–8`:'score 7–8';$('npsDetractorsPct').textContent=total>0?`${detrPct}% · score 1–6`:'score 1–6';
  if(npsIndex!==null){
    const targetDeg=((npsIndex+100)/200)*180-90;animateNPSNeedle(targetDeg,1500);
    const arcLen=251.2,filled=((npsIndex+100)/200)*arcLen;
    const arc=$('npsArcFill');arc.setAttribute('stroke',getNpsColor(npsIndex));arc.style.transition='none';arc.style.strokeDashoffset=arcLen;arc.getBoundingClientRect();arc.style.transition='stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1)';arc.style.strokeDashoffset=(arcLen-filled).toFixed(1);
    const pr=$('npsPulseRing');pr.setAttribute('stroke',getNpsColor(npsIndex));pr.style.animation='none';pr.getBoundingClientRect();pr.style.animation='ringPulse 2s ease-in-out infinite';pr.style.animationDelay='1.5s';
  }else{
    if(needleAnimRAF){cancelAnimationFrame(needleAnimRAF);needleAnimRAF=null;}
    $('npsNeedleGroup').setAttribute('transform','rotate(-90,100,100)');
  }
}
