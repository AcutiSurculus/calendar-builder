// Builds the calendar block (title, weekday bar, date grid) inside #stage
function renderCalendar(){
  renderCalendarContent(stage,S.month,S.year,S.showTitle);
  document.querySelectorAll("#months button").forEach((b,i)=>b.setAttribute("aria-pressed",i===S.month));
}

function renderCalendarContent(target,month,year,showTitle){
  const wpx=S.width*PXMM,k=wpx/760;
  target.style.width=wpx+"px";target.style.fontSize=k*16+"px";
  const fontName=S.font.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/[\r\n]/g,"");
  target.style.fontFamily=`"${fontName}","Segoe UI",Arial,sans-serif`;
  const transforms=[];
  if(S.scaleY!==1)transforms.push(`scaleY(${S.scaleY})`);
  target.style.transform=transforms.join(" ");
  target.style.transformOrigin="top left";
  const set=(n,v)=>target.style.setProperty(n,v);
  set("--gap-x",S.gapX*PXMM+"px");set("--gap-y",S.gapY*PXMM+"px");set("--box-height",S.boxHeight*PXMM+"px");
  set("--bar-font-size",S.barFontSize*k+"px");set("--bar-radius",S.barRadius*PXMM+"px");
  set("--rad",S.rad*PXMM+"px");set("--bw",S.bw*PXMM+"px");set("--num",S.num*k+"px");
  set("--cell",S.cell);set("--line2",S.line2);set("--ink",S.ink);set("--sun",S.sun);set("--hol",S.hol);

  const lead=(new Date(year,month,1).getDay()-S.weekStart+7)%7;
  const n=new Date(year,month+1,0).getDate();
  let h="";
  if(showTitle){
    const y=`<span class="y">${year}</span>`,mo=`<span class="m">${MONTHS[month]}</span>`,line=S.titleLayout==="line";
    h+=`<h2 class="t ${line?"line":""}" style="color:${S.primary};text-align:${S.titleAlign}">${line?mo+y:y+mo}</h2>`;
  }
  if(S.showBar){
    const lab=DAYS[S.labels];let b="";
    for(let i=0;i<7;i++)b+=`<span>${lab[(i+S.weekStart)%7]}</span>`;
    h+=`<div class="bar" style="background:${S.primary};color:#fff">${b}</div>`;
  }
  h+='<div class="grid">'+'<div class="d e"></div>'.repeat(lead);
  for(let d=1;d<=n;d++){
    const dow=new Date(year,month,d).getDay(),c=["d",S.numAlign];
    if(dow===0)c.push("sun");
    if(HOL.has((month+1)+"-"+d))c.push("hol");
    h+=`<div class="${c.join(" ")}" data-d="${d}">${d}</div>`;
  }
  target.innerHTML=h+"</div>";
}
