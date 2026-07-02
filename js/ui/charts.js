/* ═══════════════════════════════════════════
   CHARTS
   All Chart.js instance creation/updates live here so every panel
   shares one chart configuration style (colors, fonts, tooltip theme).
═══════════════════════════════════════════ */
import {$} from '../utils/helpers.js';

Chart.defaults.font.family='Inter';
Chart.defaults.color='#8a6020';

/* ── Summary tab — Mentor Rankings (Bayesian) bar chart ── */
let topMentorsChartInst=null;

export function renderTopMentorsChart(MENTORS){
  const top=MENTORS.slice(0,Math.min(15,MENTORS.length));
  const wrap=$('topMentorsWrap');
  const chartH=Math.max(200,top.length*38);
  wrap.style.height=chartH+'px';

  if(topMentorsChartInst){
    topMentorsChartInst.data.labels=top.map(m=>m.name);
    topMentorsChartInst.data.datasets[0].data=top.map(m=>m.bayesianRating);
    topMentorsChartInst.data.datasets[0].backgroundColor=top.map((m,i)=>i===0?'#5c3600':i===top.length-1?'#f5c842':'#c48a00');
    topMentorsChartInst.update();
  }else{
    topMentorsChartInst=new Chart($('topMentorsChart'),{
      type:'bar',
      data:{labels:top.map(m=>m.name),datasets:[{data:top.map(m=>m.bayesianRating),backgroundColor:top.map((m,i)=>i===0?'#5c3600':i===top.length-1?'#f5c842':'#c48a00'),borderRadius:5,borderSkipped:false,barThickness:22}]},
      options:{
        indexAxis:'y',responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:ctx=>{const m=top[ctx.dataIndex];return`Bayesian: ${ctx.parsed.x.toFixed(2)} | Avg: ${m.rating.toFixed(1)}/5 (${m.subjects} subjects, ${m.responses} responses)`;}}},
          datalabels:{anchor:'end',align:'end',color:'#2a1800',font:{weight:'bold',size:11},formatter:v=>v.toFixed(2)}
        },
        scales:{
          x:{min:0,max:5,ticks:{stepSize:1,font:{size:10},callback:v=>v.toFixed(1)},grid:{color:'rgba(120,80,10,0.07)'},border:{display:false}},
          y:{ticks:{font:{size:11},autoSkip:false},grid:{display:false},border:{display:false}}
        },
        layout:{padding:{right:40}}
      },
      plugins:[ChartDataLabels]
    });
  }
  $('topMentorsBadge').textContent=top.length>0?`Top ${top.length}`:'No data';
}

/* ── Trend tab charts ── */
let trendRatingInst=null,trendNpsInst=null,trendHitRatioInst=null,trendSegInst=null;

export function renderTrendCharts(TREND_DATA){
  const{cycles,cycleStats}=TREND_DATA;
  const labels=cycles;
  const ratings=cycles.map(c=>cycleStats[c].ratingAvg);
  const npss=cycles.map(c=>cycleStats[c].npsIndex);
  const hitRatios=cycles.map(c=>cycleStats[c].hitRatio);
  const proms=cycles.map(c=>cycleStats[c].promoterPct);
  const passes=cycles.map(c=>cycleStats[c].passivePct);
  const detrs=cycles.map(c=>cycleStats[c].detractorPct);

  const baseOpts={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},datalabels:{display:false},tooltip:{backgroundColor:'rgba(42,24,0,0.92)',titleColor:'#fde9a0',bodyColor:'#f5e9c8',borderColor:'#c48a00',borderWidth:1,padding:10}},scales:{x:{ticks:{font:{size:11},color:'#8a6020'},grid:{display:false},border:{display:false}},y:{ticks:{font:{size:10},color:'#8a6020'},grid:{color:'rgba(120,80,10,0.07)'},border:{display:false}}}};

  if(trendRatingInst){trendRatingInst.destroy();trendRatingInst=null;}
  if(trendNpsInst){trendNpsInst.destroy();trendNpsInst=null;}
  if(trendHitRatioInst){trendHitRatioInst.destroy();trendHitRatioInst=null;}
  if(trendSegInst){trendSegInst.destroy();trendSegInst=null;}

  trendRatingInst=new Chart($('trendRatingChart'),{type:'line',data:{labels,datasets:[{label:'Avg Rating',data:ratings,borderColor:'#c48a00',backgroundColor:'rgba(196,138,0,0.10)',borderWidth:2.5,fill:true,tension:0.4,pointBackgroundColor:'#fff',pointBorderColor:'#c48a00',pointRadius:5,pointHoverRadius:7}]},options:{...baseOpts,layout:{padding:{top:24}},scales:{...baseOpts.scales,y:{...baseOpts.scales.y,min:0,max:5,ticks:{...baseOpts.scales.y.ticks,stepSize:1,callback:v=>v.toFixed(2)}}},plugins:{...baseOpts.plugins,datalabels:{display:true,anchor:'end',align:'top',color:'#5c3600',font:{weight:'bold',size:10},formatter:v=>v!==null?v.toFixed(2):''},tooltip:{...baseOpts.plugins.tooltip,callbacks:{label:ctx=>`Avg Rating: ${ctx.parsed.y!==null?ctx.parsed.y.toFixed(2):'—'}`}}}},plugins:[ChartDataLabels]});

  trendNpsInst=new Chart($('trendNpsChart'),{type:'line',data:{labels,datasets:[{label:'NPS',data:npss,borderColor:'#5c3600',backgroundColor:'rgba(92,54,0,0.08)',borderWidth:2.5,fill:true,tension:0.4,pointBackgroundColor:'#fff',pointBorderColor:'#5c3600',pointRadius:5,pointHoverRadius:7}]},options:{...baseOpts,layout:{padding:{top:24}},plugins:{...baseOpts.plugins,datalabels:{display:true,anchor:'end',align:'top',color:'#5c3600',font:{weight:'bold',size:10},formatter:v=>v!==null?(v>0?'+':'')+v:''},tooltip:{...baseOpts.plugins.tooltip,callbacks:{label:ctx=>{const v=ctx.parsed.y;return`NPS: ${v>0?'+':''}${v??'—'}`;}}}}},plugins:[ChartDataLabels]});

  const hasHitRatioData=hitRatios.some(v=>v!==null&&v!==undefined);
  if(hasHitRatioData){
    trendHitRatioInst=new Chart($('trendHitRatioChart'),{type:'line',data:{labels,datasets:[{label:'Hit Ratio %',data:hitRatios,borderColor:'#10b981',backgroundColor:'rgba(16,185,129,0.10)',borderWidth:2.5,fill:true,tension:0.4,pointBackgroundColor:'#fff',pointBorderColor:'#10b981',pointRadius:5,pointHoverRadius:7}]},options:{...baseOpts,layout:{padding:{top:24}},scales:{...baseOpts.scales,y:{...baseOpts.scales.y,min:0,max:120,ticks:{...baseOpts.scales.y.ticks,stepSize:20,callback:v=>v+'%'}}},plugins:{...baseOpts.plugins,datalabels:{display:true,anchor:'end',align:'top',color:'#065f46',font:{weight:'bold',size:10},formatter:v=>v!==null?v.toFixed(1)+'%':''},tooltip:{...baseOpts.plugins.tooltip,callbacks:{label:ctx=>`Hit Ratio: ${ctx.parsed.y!==null?ctx.parsed.y.toFixed(1)+'%':'—'}`}}}},plugins:[ChartDataLabels]});
  }else{
    const canvas=$('trendHitRatioChart');const ctx2d=canvas.getContext('2d');canvas.width=canvas.offsetWidth||400;canvas.height=240;ctx2d.clearRect(0,0,canvas.width,canvas.height);ctx2d.fillStyle='#c09840';ctx2d.font='13px Inter,sans-serif';ctx2d.textAlign='center';ctx2d.fillText('Add hit_ratio column to trend sheet for real data',canvas.width/2,120);
  }

  trendSegInst=new Chart($('trendSegChart'),{type:'line',data:{labels,datasets:[{label:'Promoters %',data:proms,borderColor:'#10b981',backgroundColor:'rgba(16,185,129,0.08)',borderWidth:2,fill:false,tension:0.4,pointBackgroundColor:'#fff',pointBorderColor:'#10b981',pointRadius:4,pointHoverRadius:6},{label:'Passives %',data:passes,borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,0.08)',borderWidth:2,fill:false,tension:0.4,pointBackgroundColor:'#fff',pointBorderColor:'#f59e0b',pointRadius:4,pointHoverRadius:6},{label:'Detractors %',data:detrs,borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.08)',borderWidth:2,fill:false,tension:0.4,pointBackgroundColor:'#fff',pointBorderColor:'#ef4444',pointRadius:4,pointHoverRadius:6}]},options:{...baseOpts,interaction:{mode:'index',intersect:false},scales:{...baseOpts.scales,y:{...baseOpts.scales.y,min:0,max:100,ticks:{...baseOpts.scales.y.ticks,callback:v=>v+'%'}}},plugins:{...baseOpts.plugins,legend:{display:false},datalabels:{display:false}}},plugins:[ChartDataLabels]});
}
