/* ═══════════════════════════════════════════
   GOOGLE SHEETS CONFIGURATION — COLLEGES
   One entry per college. `gid` is the worksheet tab id for that
   college inside EVERY monthly spreadsheet (see months.js) — the
   monthly spreadsheets are copies of the same template, so the
   sheet-tab layout (and therefore each college's gid) stays identical
   from month to month.
═══════════════════════════════════════════ */
export const COLLEGES = [
  {name:"Kamaraj College",gid:"0"},{name:"Kamaraj Women's College",gid:"1140723423"},
  {name:"SDNB Vaishnav College for Women",gid:"340022065"},{name:"Patrician College of Arts & Science",gid:"1890731138"},
  {name:"TERF's College of Arts and Science",gid:"1010908578"},{name:"Sree Saraswathi Thyagaraja College",gid:"1363163794"},
  {name:"TJS College of Arts and Science",gid:"1776412956"},{name:"Bharathidasan College of Arts & Science",gid:"2085937367"},
  {name:"Nagarathinam Angalammal Arts & Science College",gid:"407392563"},
  {name:"Vinayaga Mission's Research Foundation School of Arts & Science",gid:"1231492996"},
  {name:"Sri Amaraavathi College of Arts & Science",gid:"1223988020"},{name:"Takshashila University",gid:"1833417744"},
  {name:"Study World Group of Institution",gid:"1261765001"},{name:"Rathinam College of Arts & Science",gid:"1707229573"},
  {name:"Noorul Islam Centre for Higher Education (NICHE)",gid:"1044442080"},{name:"AMET University",gid:"1257152100"},
  {name:"Joy University",gid:"185512483"},{name:"Sasurie College of Arts and Science",gid:"1553065051"},
  {name:"Alliance University",gid:"361218329"},{name:"Kristu Jayanti College",gid:"2101380937"},
  {name:"S-VYASA University",gid:"29895230"},{name:"Asian School of Business",gid:"1108050649"}
];

/* Dedicated per-college historical trend sheets — used only by the
   "Trend Over Time" tab (unchanged from the previous implementation). */
export const DEDICATED_TREND_SHEETS = {
  'Rathinam College of Arts & Science':{sheetId:'1nDMDazG090HPikkrSohUYXmYfZiO-MaREitGlJHwoKc',gids:['0','1707229573']},
  'Kamaraj College':{sheetId:'1Km7BgYceWvJB-npvqHQNDZsANDHA3vMx-IQcxwzSHvQ',gids:['0']},
  "Kamaraj Women's College":{sheetId:'1tm3GP00cWkrttscRBem51yzGvsgwTmAKAUc_hQiOoh4',gids:['0']},
  'SDNB Vaishnav College for Women':{sheetId:'12wS05DKTaiYpNsVDHGAJ3Um-7UOXtIb-fyTBwzg9hyM',gids:['0']},
  'Patrician College of Arts & Science':{sheetId:'1zc4BbANC3hz21YkpJAqa6ZM8vayo9s7KA8mHwNJeVZA',gids:['0']},
  "TERF's College of Arts and Science":{sheetId:'1eRqSECQ5GiVIvmnU8LQlWUS086rybYoVkRXfuzSchpU',gids:['0']},
  'Sree Saraswathi Thyagaraja College':{sheetId:'1fn_nVNHw8WHqjHTiuAp671ckTRwJ6WXXfdI_VsckP9o',gids:['0']},
  'TJS College of Arts and Science':{sheetId:'1j7JKepMCgyY11wd9w8b86dX8ogeRjkpW51oY1tYItGQ',gids:['0']},
  'Bharathidasan College of Arts & Science':{sheetId:'1AUBiDoUvE0bNm1sPFHlrZBAm1shMhEiL4D6QPOAbToo',gids:['0']},
  'Nagarathinam Angalammal Arts & Science College':{sheetId:'13c57XwLAYe8hBIfoGXqsmoQm7ACO1CwxRIcr9SNJA_o',gids:['0']},
  "Vinayaga Mission's Research Foundation School of Arts & Science":{sheetId:'1v9nkuZjzVLBk_avrOKBGrU-dWjfHA47hrXZAfIyy4aw',gids:['0']},
  'Sri Amaraavathi College of Arts & Science':{sheetId:'1TrSEMdtRXBMmjdTb0lb6E4eRCnKTiBAp3ub_CCFrNxc',gids:['0']},
  'Takshashila University':{sheetId:'1J8eE1EBGG2Hy3fNjGZd5SBFDaeTYPhc_Ck_GBbmSUwk',gids:['0']},
  'Study World Group of Institution':{sheetId:'1cEe2tx81xgABLQyspVB2dWAYep7hi_vSUsLJRH0PNFA',gids:['0']},
  'Noorul Islam Centre for Higher Education (NICHE)':{sheetId:'1USRMJpLmFl_Z7H06e7jpqWi_yWb5Fgk6As0HQcYz11w',gids:['0']},
  'AMET University':{sheetId:'1SDx1EyxmhhkQ8CK8w0H5W6Y2j2ihFBIGOkDYMWjkSAA',gids:['0']},
  'Joy University':{sheetId:'1L9D6-AH-kxTqFInHVaHYx4PeXjOZrTXrCCk-tVgtjrM',gids:['0']},
  'Sasurie College of Arts and Science':{sheetId:'1o6-tnTgHLTYF6xmbsVGaEYKKUubkFnBdfT3dzZZR8C4',gids:['0']},
  'Alliance University':{sheetId:'1UXmS5pgi7Qi6fgcD73vuBo-IUURegG5lxU8iIhSuI88',gids:['0']},
  'Kristu Jayanti College':{sheetId:'1eMIS_Tw36VNveDHgeVetxqtOLkxpFnf4MwkvsjImyWU',gids:['0']},
  'S-VYASA University':{sheetId:'16qL6QKGG48-Bt9r4cHYP9mtpQFQDTH2WfKbdmBk_UiI',gids:['0']},
  'Asian School of Business':{sheetId:'1vw_fZ_5RkWNLbe0Y5pTdkplwVZYl2TVZ0LvI4ogezK8',gids:['0']}
};

/* Fuzzy college-name matching — used to map a name found in an external
   sheet (e.g. the hit-ratio sheet) back to a COLLEGES entry even if the
   spelling/punctuation differs slightly. */
export function normCollegeName(s){
  return (s||'').toLowerCase()
    .replace(/\b(deemed to be university|deemed university|university|college|institute|institution|school|arts and science|arts & science|of|and|&|the)\b/g,'')
    .replace(/[^a-z0-9]/g,'').trim();
}
export function findCollegeIndex(sheetName){
  let idx=COLLEGES.findIndex(c=>c.name===sheetName);if(idx>=0)return idx;
  idx=COLLEGES.findIndex(c=>c.name.toLowerCase()===sheetName.toLowerCase());if(idx>=0)return idx;
  const normSheet=normCollegeName(sheetName);
  idx=COLLEGES.findIndex(c=>normCollegeName(c.name)===normSheet);if(idx>=0)return idx;
  idx=COLLEGES.findIndex(c=>{const nc=normCollegeName(c.name);return nc.includes(normSheet)||normSheet.includes(nc);});
  return idx;
}
