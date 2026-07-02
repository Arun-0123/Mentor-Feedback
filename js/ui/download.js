/* ═══════════════════════════════════════════
   DOWNLOAD — PDF report export
   Captures Summary / Mentor Performance / NPS Analysis / Trend Over Time
   panels into a single multi-page PDF via html2canvas + jsPDF.
═══════════════════════════════════════════ */
import {$} from '../utils/helpers.js';
import {state} from '../state/appState.js';

export async function downloadReport(){
  const btn=$('downloadBtn');
  btn.disabled=true;btn.textContent='⏳ Generating PDF…';
  const collegeName=state.currentCollege?.name||'Dashboard';
  const now=new Date().toLocaleString();

  try{
    const{jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const pageW=pdf.internal.pageSize.getWidth();
    const pageH=pdf.internal.pageSize.getHeight();
    const margin=10;
    const headerH=14;
    const usableH=pageH-headerH-4;

    function addHeader(){
      pdf.setFillColor(74,40,0);
      pdf.rect(0,0,pageW,headerH,'F');
      pdf.setFontSize(9);
      pdf.setTextColor(253,233,160);
      pdf.text('FacePrep Campus · Performance Dashboard',margin,9);
      pdf.text(collegeName,pageW/2,9,{align:'center'});
      pdf.text(now,pageW-margin,9,{align:'right'});
    }

    async function captureElement(el){
      el.style.display='flex';
      el.style.opacity='1';
      await new Promise(r=>setTimeout(r,400));
      return await html2canvas(el,{
        scale:1.5,useCORS:true,allowTaint:true,
        backgroundColor:'#fdf8ed',logging:false,windowWidth:1200
      });
    }

    async function addCanvasToPdf(canvas,isFirstPage){
      const imgW=pageW-margin*2;
      const imgH=(canvas.height*imgW)/canvas.width;
      const ratio=canvas.width/imgW;
      const sliceH=Math.floor(usableH*ratio);
      let yOffset=0;
      let firstSlice=true;

      while(yOffset<canvas.height){
        if(!isFirstPage||!firstSlice) pdf.addPage();
        addHeader();

        const thisSliceH=Math.min(sliceH,canvas.height-yOffset);
        const sliceCanvas=document.createElement('canvas');
        sliceCanvas.width=canvas.width;
        sliceCanvas.height=thisSliceH;
        const ctx=sliceCanvas.getContext('2d');
        ctx.fillStyle='#fdf8ed';
        ctx.fillRect(0,0,sliceCanvas.width,sliceCanvas.height);
        ctx.drawImage(canvas,0,-yOffset);
        const sliceData=sliceCanvas.toDataURL('image/jpeg',0.92);
        const sliceImgH=(thisSliceH*imgW)/canvas.width;
        pdf.addImage(sliceData,'JPEG',margin,headerH+2,imgW,sliceImgH);

        yOffset+=sliceH;
        firstSlice=false;
      }
    }

    // Hide all panels
    const allPanels=document.querySelectorAll('.panel');
    allPanels.forEach(p=>{p.style.display='none';p.classList.remove('active');});

    let isFirstPage=true;

    // === PAGE 1: Summary (metrics + charts) — force single page ===
    const summaryPanel=$('panel-summary');
    summaryPanel.style.display='flex';
    summaryPanel.style.opacity='1';
    await new Promise(r=>setTimeout(r,500));
    const summaryCanvas=await html2canvas(summaryPanel,{
      scale:1.2,useCORS:true,allowTaint:true,
      backgroundColor:'#fdf8ed',logging:false,windowWidth:1200
    });
    summaryPanel.style.display='none';

    addHeader();
    const imgW=pageW-margin*2;
    const summaryImgH=Math.min((summaryCanvas.height*imgW)/summaryCanvas.width, usableH);
    pdf.addImage(summaryCanvas.toDataURL('image/jpeg',0.92),'JPEG',margin,headerH+2,imgW,summaryImgH);
    isFirstPage=false;

    // === PAGE 2: Mentor Performance ===
    const mentorPanel=$('panel-mentors');
    const mentorCanvas=await captureElement(mentorPanel);
    mentorPanel.style.display='none';
    await addCanvasToPdf(mentorCanvas,false);

    // === PAGE 3: NPS — banner + hero cards + followup questions (all in one page) ===
    const npsPanel=$('panel-nps');
    npsPanel.style.display='flex';
    npsPanel.style.opacity='1';

    // Temporarily hide student voice card
    const svCard=$('studentVoiceCard');
    const svPrev=svCard.style.display;
    svCard.style.display='none';

    await new Promise(r=>setTimeout(r,400));
    const npsTopCanvas=await html2canvas(npsPanel,{
      scale:1.2,useCORS:true,allowTaint:true,
      backgroundColor:'#fdf8ed',logging:false,windowWidth:1200
    });
    svCard.style.display=svPrev;
    npsPanel.style.display='none';

    pdf.addPage();
    addHeader();
    const npsImgH=Math.min((npsTopCanvas.height*imgW)/npsTopCanvas.width, usableH);
    pdf.addImage(npsTopCanvas.toDataURL('image/jpeg',0.92),'JPEG',margin,headerH+2,imgW,npsImgH);

    // === PAGE 4: Trend Over Time ===
    const trendPanel=$('panel-trends');
    const trendCanvas=await captureElement(trendPanel);
    trendPanel.style.display='none';
    await addCanvasToPdf(trendCanvas,false);

    // Restore active panel
    allPanels.forEach(p=>p.style.display='none');
    const activePanelId='panel-'+state.currentDetailPanel;
    const ap=$(activePanelId);
    if(ap){ap.style.display='flex';ap.classList.add('active');}
    document.querySelector('.page-header').style.display=state.currentDetailPanel==='trends'?'none':'flex';

    const filename=`Report-${collegeName.replace(/[^a-z0-9]/gi,'-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    pdf.save(filename);

  }catch(err){
    console.error('PDF error:',err);
    alert('PDF generation failed: '+err.message);
  }finally{
    btn.disabled=false;
    btn.innerHTML='↓ <span>Download Report</span>';
  }
}
