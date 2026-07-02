/* ═══════════════════════════════════════════
   DASHBOARD-WIDE CONSTANTS
═══════════════════════════════════════════ */

/* Dedicated Google Sheet that holds the pre-calculated Hit Ratio figure
   per college. This is intentionally separate from MONTHLY_SHEETS: the
   monthly feedback template has no "expected responses" column, so Hit
   Ratio is maintained in this standalone sheet rather than derived from
   raw feedback rows. */
export const HIT_RATIO_SHEET_ID='19HsWARl8RFNZ6nc-bUCBKKEN39JkQVxCBfbNCUSe2_4';
export const HIT_RATIO_GID='2051331186';

/* Trend tab fallback cycle labels, used only when a college has no
   dedicated trend sheet and no cycle column in its raw data. */
export const FIXED_CYCLES=['Sep 2025','Oct 2025','Nov 2025','Dec 2025','Jan 2026','Feb 2026','Mar 2026','Apr 2026'];
export const MONTH_ALIAS_MAP={
  'sep 2025':'Sep 2025','september 2025':'Sep 2025','sep-2025':'Sep 2025','sep':'Sep 2025',
  'sept 2025':'Sep 2025','sept-2025':'Sep 2025','sept':'Sep 2025',
  'oct 2025':'Oct 2025','october 2025':'Oct 2025','oct-2025':'Oct 2025','oct':'Oct 2025',
  'nov 2025':'Nov 2025','november 2025':'Nov 2025','nov-2025':'Nov 2025','nov':'Nov 2025',
  'dec 2025':'Dec 2025','december 2025':'Dec 2025','dec-2025':'Dec 2025','dec':'Dec 2025',
  'jan 2026':'Jan 2026','january 2026':'Jan 2026','jan-2026':'Jan 2026','jan':'Jan 2026',
  'feb 2026':'Feb 2026','february 2026':'Feb 2026','feb-2026':'Feb 2026','feb':'Feb 2026',
  'mar 2026':'Mar 2026','march 2026':'Mar 2026','mar-2026':'Mar 2026','mar':'Mar 2026',
  'apr 2026':'Apr 2026','april 2026':'Apr 2026','apr-2026':'Apr 2026','apr':'Apr 2026'
};

/* Mentor feedback questions (Q1–Q5, Yes/No), shared by mentor table,
   dept stats panel and the mentor detail modal. */
export const MM_QUESTIONS=['Sessions were clear and well-structured','Professional behavior during sessions','Effective in solving problems with examples','Supported doubt clearing and student queries','Sessions improved understanding and skills'];
export const Q_LABELS=['Session clarity','Professional behavior','Problem-solving with examples','Doubt clearing & support','Skill improvement'];

export const Q_DEFS=[
  {key:'Q1',label:'Session delivery & structure',  w_strength:25,w_tei:30,w_ssi:20},
  {key:'Q2',label:'Professional behavior',          w_strength:10,w_tei:0, w_ssi:20},
  {key:'Q3',label:'Problem solving & explanation',  w_strength:30,w_tei:35,w_ssi:20},
  {key:'Q4',label:'Doubt clearing & student support',w_strength:20,w_tei:25,w_ssi:20},
  {key:'Q5',label:'Learning effectiveness',         w_strength:15,w_tei:10,w_ssi:20}
];

export const Q_ANALYSIS_TEXT=[
  {hp:'Students highly appreciated the mentor\'s session delivery, clarity, and structured teaching approach.',mp:'Students provided positive feedback regarding the mentor\'s session organization and clarity.',n:'Student feedback indicates moderate satisfaction with the mentor\'s session delivery and structure.',mn:'Students identified improvement opportunities in the mentor\'s session clarity and teaching structure.',hn:'Students reported major concerns regarding the mentor\'s session organization and clarity of explanation.'},
  {hp:'Students strongly appreciated the mentor\'s professionalism and classroom conduct.',mp:'The mentor maintained good professional behavior during the sessions.',n:'Students reported stable professional conduct with minor areas for improvement.',mn:'Students observed certain concerns related to professional behavior and classroom interaction.',hn:'Students highlighted significant concerns regarding the mentor\'s professional conduct during sessions.'},
  {hp:'Students highly valued the mentor\'s ability to explain concepts and solve problems effectively using examples.',mp:'Students positively rated the mentor\'s problem-solving and explanation capabilities.',n:'Student feedback indicates moderate satisfaction with the mentor\'s explanation quality.',mn:'Students suggested improvements in concept explanation and practical examples.',hn:'Students reported major concerns regarding problem-solving support and concept explanation clarity.'},
  {hp:'Students highly appreciated the mentor\'s support in resolving doubts and handling queries effectively.',mp:'The mentor was positively rated for student support and doubt clarification.',n:'Students expressed moderate satisfaction with the mentor\'s responsiveness to doubts and questions.',mn:'Students identified improvement opportunities in doubt clarification and student interaction.',hn:'Students reported inadequate support in resolving doubts and handling academic queries.'},
  {hp:'Students reported strong improvement in understanding and skill development through the mentor\'s sessions.',mp:'Students positively rated the learning effectiveness of the mentor\'s sessions.',n:'Student feedback indicates moderate improvement in learning outcomes and skill development.',mn:'Students suggested improvements in learning effectiveness and practical understanding.',hn:'Students reported limited improvement in learning outcomes from the mentor\'s sessions.'}
];

/* NPS follow-up Yes/No questions (nps_fu1..4 columns). */
export const NPS_FOLLOWUP_QUESTIONS=[
  {id:'campus',   col:'nps_fu1_campusSatisfied',  label:'Campus experience',    question:'Satisfied with overall campus experience — classroom, infrastructure & Wi-Fi?'},
  {id:'classroom',col:'nps_fu2_classroomSatisfied',label:'Classroom engagement', question:'Satisfied with classroom engagement — faculty quality & content relevance?'},
  {id:'skill',    col:'nps_fu3_skillDev',          label:'Skill development',    question:'Happy with skill development progress so far?'},
  {id:'placement',col:'nps_fu4_placement',         label:'Placement opportunities',question:'Happy with placement opportunities available?'}
];

/* Student Voice (Q6/Q7 open-ended AI summary) — Groq API. */
export const GROQ_API_KEY='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';
export const GROQ_MODEL='llama-3.3-70b-versatile';
