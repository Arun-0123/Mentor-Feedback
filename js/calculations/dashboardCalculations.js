/* ═══════════════════════════════════════════
   DASHBOARD CALCULATIONS — core, reusable engine
   ───────────────────────────────────────────
   Pure functions: raw feedback rows in → computed metrics out. No DOM,
   no fetches. Every panel (Summary / Mentor Performance / NPS Analysis)
   calls computeDashboardData() with whatever raw rows its own month
   filter resolved to (a single month, or the merged rows for "All"),
   so the exact same formulas run regardless of which month(s) are
   selected — nothing here ever averages pre-calculated monthly values.
═══════════════════════════════════════════ */

/** NPS metrics from a flat list of 1-10 scores. */
export function computeNpsData(npsScores){
  const total=npsScores.length;
  const promoters=npsScores.filter(s=>s>=9).length;
  const passives=npsScores.filter(s=>s>=7&&s<=8).length;
  const detractors=npsScores.filter(s=>s<=6).length;
  const npsIndex=total>0?Math.round((promoters/total-detractors/total)*100):null;
  const avg=total>0?npsScores.reduce((a,b)=>a+b,0)/total:0;
  const sorted=[...npsScores].sort((a,b)=>a-b);
  const median=total>0?(total%2===0?(sorted[total/2-1]+sorted[total/2])/2:sorted[Math.floor(total/2)]):0;
  const scoreFreq={};for(let i=1;i<=10;i++)scoreFreq[i]=0;
  npsScores.forEach(s=>{if(scoreFreq[s]!==undefined)scoreFreq[s]++;});
  return {scores:npsScores,promoters,passives,detractors,npsIndex,avg,median,total,scoreFreq};
}

/**
 * Computes every Summary / Mentor Performance / NPS Analysis metric from
 * a set of raw feedback rows (one month, or merged rows for "All").
 *
 * Returns: { TABLE_DATA, MENTORS, DEPT_LIST, DEPT_STUDENT_COUNT, NPS_DATA }
 */
export function computeDashboardData(rows){
  const TABLE_DATA=[];
  const deptStudentCount={};
  const mentorStats={},deptSet=new Set(),npsScores=[];

  rows.forEach(row=>{
    const dept=(row.department||'Unknown').trim();
    if(dept!=='Unknown'){
      deptStudentCount[dept]=(deptStudentCount[dept]||0)+1;
      deptSet.add(dept);
    }
    const npsRaw=row['nps_score']||row['NPS Score']||row['nps score']||row['NPSScore']||'';
    const npsVal=parseInt(npsRaw,10);
    if(!isNaN(npsVal)&&npsVal>=1&&npsVal<=10){npsScores.push(npsVal);}

    for(let i=1;i<=7;i++){
      const sn=row[`subject${i}_Name`],mn=row[`subject${i}_Mentor`],rt=parseFloat(row[`subject${i}_Rating`]);
      if(sn&&mn&&!isNaN(rt)&&rt>0){
        TABLE_DATA.push({dept,mentor:mn,subject:sn,rating:rt});
        if(!mentorStats[mn]){
          mentorStats[mn]={name:mn,depts:new Set([dept]),ratings:[],subjects:new Set(),qs:[{y:0,n:0},{y:0,n:0},{y:0,n:0},{y:0,n:0},{y:0,n:0}],deptQs:{},deptRatings:{}};
        }
        mentorStats[mn].depts.add(dept);mentorStats[mn].ratings.push(rt);mentorStats[mn].subjects.add(sn);
        if(!mentorStats[mn].deptQs[dept]){mentorStats[mn].deptQs[dept]=[{y:0,n:0},{y:0,n:0},{y:0,n:0},{y:0,n:0},{y:0,n:0}];}
        if(!mentorStats[mn].deptRatings[dept])mentorStats[mn].deptRatings[dept]=[];
        mentorStats[mn].deptRatings[dept].push(rt);
        for(let q=1;q<=5;q++){
          const ans=row[`subject${i}_Q${q}`]||'';
          if(ans==='Yes'){mentorStats[mn].qs[q-1].y++;mentorStats[mn].deptQs[dept][q-1].y++;}
          else if(ans==='No'){mentorStats[mn].qs[q-1].n++;mentorStats[mn].deptQs[dept][q-1].n++;}
        }
      }
    }
  });

  const NPS_DATA=computeNpsData(npsScores);

  const allRatings=TABLE_DATA.map(r=>r.rating);
  const globalMean=allRatings.length>0?allRatings.reduce((a,b)=>a+b,0)/allRatings.length:0;
  const totalAllResponses=allRatings.length;
  const mentorCount=Object.values(mentorStats).length||1;
  const C=totalAllResponses/mentorCount;

  let MENTORS=Object.values(mentorStats).map(m=>{
    const avg=m.ratings.reduce((a,b)=>a+b,0)/m.ratings.length;
    const totalResponses=m.ratings.length;
    const avgXResponses=avg*totalResponses;
    const bayesianScore=((globalMean*C)+(avg*totalResponses))/(C+totalResponses);
    return{name:m.name,depts:Array.from(m.depts),rating:parseFloat(avg.toFixed(2)),avgXResponses:parseFloat(avgXResponses.toFixed(2)),bayesianRating:parseFloat(bayesianScore.toFixed(7)),subjects:m.subjects.size,responses:totalResponses,qs:m.qs,deptQs:m.deptQs,deptRatings:m.deptRatings};
  }).sort((a,b)=>b.bayesianRating-a.bayesianRating);

  MENTORS.forEach((m,idx,arr)=>{
    if(idx===0){m.rank=1;}
    else if(m.bayesianRating===arr[idx-1].bayesianRating){m.rank=arr[idx-1].rank;}
    else{m.rank=idx+1;}
    m.percentile=MENTORS.length>1?Math.round((1-idx/(MENTORS.length-1))*100):100;
  });

  const DEPT_LIST=Array.from(deptSet).sort();

  return {TABLE_DATA,MENTORS,DEPT_LIST,DEPT_STUDENT_COUNT:deptStudentCount,NPS_DATA};
}

/** Mentors filtered (and re-ranked) by department — used by the dept filter chips. */
export function getFilteredMentors(MENTORS,filterDept){
  let list=!filterDept||filterDept==='all'?[...MENTORS]:MENTORS.filter(m=>m.depts.some(d=>d===filterDept));
  list.forEach((m,idx,arr)=>{
    if(idx===0){m.filteredRank=1;}
    else if(m.bayesianRating===arr[idx-1].bayesianRating){m.filteredRank=arr[idx-1].filteredRank;}
    else{m.filteredRank=idx+1;}
    m.filteredPercentile=list.length>1?Math.round((1-idx/(list.length-1))*100):100;
  });
  return list;
}

export function getMentorDeptQs(mentor,dept){if(!dept||dept==='all')return mentor.qs;return mentor.deptQs[dept]||[{y:0,n:0},{y:0,n:0},{y:0,n:0},{y:0,n:0},{y:0,n:0}];}
export function getMentorDeptRating(mentor,dept){if(!dept||dept==='all')return mentor.rating;const rs=mentor.deptRatings[dept];if(!rs||!rs.length)return mentor.rating;return parseFloat((rs.reduce((a,b)=>a+b,0)/rs.length).toFixed(2));}
export function getMentorDeptResponses(mentor,dept){if(!dept||dept==='all')return mentor.responses;const rs=mentor.deptRatings[dept];return rs?rs.length:0;}

/** Bayesian score for one mentor, scoped to a single department. */
export function calcDeptBayesian(MENTORS,mentor,dept){
  const deptMentors=MENTORS.filter(m=>m.depts.some(d=>d===dept));
  let deptTotalWeightedRating=0,deptTotalResponses=0,deptMentorCount=0;
  deptMentors.forEach(m=>{
    const rs=m.deptRatings[dept];
    if(rs&&rs.length){
      deptTotalWeightedRating+=rs.reduce((a,b)=>a+b,0);
      deptTotalResponses+=rs.length;
      deptMentorCount++;
    }
  });
  const deptGlobalMean=deptTotalResponses>0?deptTotalWeightedRating/deptTotalResponses:0;
  // C = average responses per mentor (correct Bayesian threshold)
  const C=deptMentorCount>0?deptTotalResponses/deptMentorCount:0;
  const mentorDeptRs=mentor.deptRatings[dept]||[];
  const mentorDeptResponses=mentorDeptRs.length;
  const mentorDeptAvg=mentorDeptResponses>0?mentorDeptRs.reduce((a,b)=>a+b,0)/mentorDeptResponses:deptGlobalMean;
  if(C===0||mentorDeptResponses===0)return mentorDeptAvg;
  return(deptGlobalMean*C+mentorDeptAvg*mentorDeptResponses)/(C+mentorDeptResponses);
}
