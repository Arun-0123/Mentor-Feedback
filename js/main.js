/* ═══════════════════════════════════════════
   MAIN — application entry point
   Wires navigation, filters and panels together. The app opens
   directly into a college's Summary tab (no landing/overview page):
   each tab loads its own data lazily the first time it's opened, and
   independently whenever its own month filter changes.
═══════════════════════════════════════════ */
import {$} from './utils/helpers.js';
import {state} from './state/appState.js';
import {COLLEGES} from './config/colleges.js';
import {clearCollegeDataCache} from './data/collegeDataService.js';
import {clearHitRatioCache} from './data/hitRatioService.js';
import {initNavigation,selectCollege} from './ui/navigation.js';
import {initSummaryFilters,reloadSummary} from './ui/summaryPanel.js';
import {initMentorFilters,reloadMentors,closeMentorModal} from './ui/mentorPanel.js';
import {initNpsFilters,reloadNps,runStudentVoice} from './ui/npsPanel.js';
import {loadTrendForCollege,renderTrendPanel} from './ui/trendPanel.js';
import {downloadReport} from './ui/download.js';

function showLoadingOverlay(text){
  $('loadingText').textContent=text;
  $('errorMessage').classList.remove('show');
  $('loadingOverlay').classList.remove('hidden');
}
function hideLoadingOverlay(){
  setTimeout(()=>$('loadingOverlay').classList.add('hidden'),300);
}
function showLoadingError(){
  $('errorMessage').classList.add('show');
}

/** Loads whichever tab is requested, but only if it isn't already loaded for the current college. */
async function ensureTabLoaded(id){
  const college=state.currentCollege;
  if(!college)return;
  if(id==='trends'){
    if(!state.trend)await loadTrendForCollege(college);
    else renderTrendPanel();
    return;
  }
  if(state.data[id])return; // already loaded for this college
  showLoadingOverlay(`Loading ${labelFor(id)} for ${college.name}...`);
  try{
    if(id==='summary')await reloadSummary();
    if(id==='mentors')await reloadMentors();
    if(id==='nps')await reloadNps();
    $('lastUpdated').textContent=new Date().toLocaleTimeString();
    hideLoadingOverlay();
  }catch(err){
    console.error(err);
    showLoadingError();
  }
}
function labelFor(id){return {summary:'Summary',mentors:'Mentor Performance',nps:'NPS Analysis'}[id]||id;}

function invalidateCollegeData(){
  state.data.summary=null;
  state.data.mentors=null;
  state.data.nps=null;
  state.trend=null;
}

async function onCollegeChange(college){
  invalidateCollegeData();
  await ensureTabLoaded(state.currentDetailPanel);
}

function onPanelShown(id){
  ensureTabLoaded(id);
}

async function refreshData(){
  const btn=$('refreshBtn');
  btn.classList.add('spinning');btn.disabled=true;
  clearCollegeDataCache();
  clearHitRatioCache();
  invalidateCollegeData();
  try{
    await ensureTabLoaded(state.currentDetailPanel);
  }finally{
    setTimeout(()=>{btn.classList.remove('spinning');btn.disabled=false;},600);
  }
}

function wireStaticEvents(){
  $('mentorModalOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeMentorModal();});
  document.querySelector('.mm-close-btn').addEventListener('click',closeMentorModal);
  $('downloadBtn').addEventListener('click',downloadReport);
  $('refreshBtn').addEventListener('click',refreshData);
  $('svRegenBtn').addEventListener('click',()=>runStudentVoice());
}

document.addEventListener('DOMContentLoaded',async()=>{
  wireStaticEvents();

  initNavigation({onCollegeChange,onPanelShown});
  initSummaryFilters(()=>{});
  initMentorFilters(()=>{});
  initNpsFilters(()=>{});

  // Open directly into the main dashboard — default to the first configured college.
  if(COLLEGES.length){
    selectCollege(0);
  }else{
    $('loadingOverlay').classList.add('hidden');
  }
});
