/* ═══════════════════════════════════════════
   APPLICATION STATE
   Single shared state object. Summary / Mentor Performance / NPS
   Analysis each keep their OWN month filter and their OWN computed
   data bundle, so switching one tab's filter never touches another's.
═══════════════════════════════════════════ */
import {getLatestMonthKey} from '../config/months.js';

export const state={
  currentCollege:null,
  currentDetailPanel:'summary',
  deptFilter:'all',

  /* independent per-tab month filter selection ('all' or a month key) */
  monthFilters:{
    summary:getLatestMonthKey(),
    mentors:getLatestMonthKey(),
    nps:getLatestMonthKey(),
  },

  /* independent per-tab computed dashboard bundle:
     {rows, TABLE_DATA, MENTORS, DEPT_LIST, DEPT_STUDENT_COUNT, NPS_DATA} */
  data:{
    summary:null,
    mentors:null,
    nps:null,
  },

  /* per-tab "is this panel currently (re)loading" flag, for spinner/disable UI */
  loading:{
    summary:false,
    mentors:false,
    nps:false,
  },

  /* monotonically increasing request id per tab — used to discard stale
     async responses if the user changes the filter again before the
     first request finishes. */
  requestSeq:{
    summary:0,
    mentors:0,
    nps:0,
  },

  hitRatio:null, // cached Hit Ratio % for the current college

  trend:null, // TREND_DATA for the currently selected college (Trend tab)
};

export function nextRequestId(tab){
  state.requestSeq[tab]+=1;
  return state.requestSeq[tab];
}
export function isLatestRequest(tab,id){
  return state.requestSeq[tab]===id;
}
