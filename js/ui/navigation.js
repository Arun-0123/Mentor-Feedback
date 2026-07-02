/* ═══════════════════════════════════════════
   NAVIGATION — college dropdown + sidebar tabs
   No landing/overview mode: the app opens directly into a college's
   Summary tab. Selecting a different college simply reloads whichever
   tab is currently visible (and invalidates the others so they reload
   lazily next time they're opened).
═══════════════════════════════════════════ */
import {$} from '../utils/helpers.js';
import {state} from '../state/appState.js';
import {COLLEGES,DEDICATED_TREND_SHEETS} from '../config/colleges.js';

let onCollegeChangeCb=null,onPanelShownCb=null;

export function initNavigation({onCollegeChange,onPanelShown}){
  onCollegeChangeCb=onCollegeChange;
  onPanelShownCb=onPanelShown;

  buildDropdown();

  $('hamburgerBtn').addEventListener('click',toggleMobileSidebar);
  $('sidebarOverlay').addEventListener('click',toggleMobileSidebar);
  $('collegeSelectBtn').addEventListener('click',toggleDropdown);

  $('navSummary').addEventListener('click',()=>showDetailPanel('summary',$('navSummary')));
  $('navMentors').addEventListener('click',()=>showDetailPanel('mentors',$('navMentors')));
  $('navNps').addEventListener('click',()=>showDetailPanel('nps',$('navNps')));
  $('navTrends').addEventListener('click',()=>showDetailPanel('trends',$('navTrends')));
}

function buildDropdown(){
  const dd=$('collegeDropdown');
  dd.innerHTML='';
  COLLEGES.forEach((c,i)=>{
    const hasTrend=!!DEDICATED_TREND_SHEETS[c.name];
    const el=document.createElement('div');
    el.className='college-dropdown-item'+(hasTrend?' has-trend':'');
    el.id=`dditem-${i}`;
    el.innerHTML=`<span class="item-dot"></span>${c.name}`;
    el.onclick=()=>selectCollege(i);
    dd.appendChild(el);
  });
}

export function toggleMobileSidebar(){
  $('mainSidebar').classList.toggle('open');
  $('sidebarOverlay').classList.toggle('open');
  $('hamburgerBtn').classList.toggle('open');
}
export function closeMobileSidebar(){
  $('mainSidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('open');
  $('hamburgerBtn').classList.remove('open');
}

function toggleDropdown(){
  const dd=$('collegeDropdown'),btn=$('collegeSelectBtn');
  const isOpen=dd.classList.contains('open');
  dd.classList.toggle('open',!isOpen);
  btn.classList.toggle('open',!isOpen);
  if(!isOpen)document.addEventListener('click',closeDropdownOutside,{once:true,capture:true});
}
function closeDropdownOutside(e){
  if(!$('collegeDropdownWrap').contains(e.target)){
    $('collegeDropdown').classList.remove('open');
    $('collegeSelectBtn').classList.remove('open');
  }
}

export function selectCollege(idx){
  state.currentCollege=COLLEGES[idx];
  document.querySelectorAll('.college-dropdown-item').forEach(el=>el.classList.remove('active'));
  const item=$(`dditem-${idx}`);if(item)item.classList.add('active');
  $('collegeBtnLabel').textContent=state.currentCollege.name;
  $('logoInstitutionName').textContent=state.currentCollege.name;
  $('collegeDropdown').classList.remove('open');
  $('collegeSelectBtn').classList.remove('open');
  closeMobileSidebar();
  if(onCollegeChangeCb)onCollegeChangeCb(state.currentCollege);
}

export function showDetailPanel(id,el){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  $('panel-'+id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(el)el.classList.add('active');
  state.currentDetailPanel=id;
  const meta={summary:['Performance Analytics','Overview'],mentors:['Mentor Analytics','Performance'],nps:['NPS Analytics','NPS Score Distribution'],trends:['','']};
  $('pageEyebrow').textContent=meta[id][0];
  $('pageTitle').textContent=meta[id][1];
  $('pageSub').textContent=state.currentCollege?state.currentCollege.name:'—';
  document.querySelector('.page-header').style.display=id==='trends'?'none':'flex';
  $('deptFilterRow').style.visibility=id==='mentors'?'visible':'hidden';
  closeMobileSidebar();
  if(onPanelShownCb)onPanelShownCb(id);
}
