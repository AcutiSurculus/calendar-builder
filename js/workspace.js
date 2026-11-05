// Paper geometry, zoom, margin guides, placement of the calendar block on the paper
const MM_PER_UNIT={mm:1,cm:10,in:25.4,ft:304.8,px:25.4/96};
const LENGTH_KEYS=["cw","ch","x","y","margin","width","boxHeight","gapX","gapY","rad","bw","barRadius"];
const RANGE_KEYS=["margin","barFontSize","barRadius","width","boxHeight","gapX","gapY","rad","bw","num"];
let LENGTH_UNITS=Object.fromEntries([...LENGTH_KEYS,"paper"].map(key=>[key,"mm"]));
function unitFactor(key){return MM_PER_UNIT[LENGTH_UNITS[key]||"mm"]}
function formatLength(mm,key){
  const unit=LENGTH_UNITS[key]||"mm",value=mm/MM_PER_UNIT[unit];
  const digits=unit==="mm"?1:unit==="cm"?2:unit==="in"?3:unit==="ft"?4:1;
  return `${Number(value.toFixed(digits))} ${unit}`;
}
function updateLengthControls(force=false){
  document.querySelectorAll(".length-label").forEach(label=>{
    const key=label.htmlFor,unit=LENGTH_UNITS[key]||"mm";
    label.textContent=`${label.dataset.label} (${unit})`;
  });
  document.querySelectorAll(".unit-suffix").forEach(suffix=>suffix.textContent=LENGTH_UNITS[suffix.dataset.unitKey]||"mm");
  LENGTH_KEYS.forEach(key=>{
    const input=$(key);if(!input)return;
    const factor=unitFactor(key),unit=LENGTH_UNITS[key]||"mm";
    if(input.type==="range"){
      const bounds=lengthBounds(key);
      input.min=bounds[0]/factor;input.max=bounds[1]/factor;input.step=bounds[2]/factor;
    }else if(key==="cw"||key==="ch"){
      input.min=50/factor;input.max=1500/factor;input.step=1/factor;
    }else if(key==="x"||key==="y"){
      input.step=0.5/factor;
    }
    if(force||document.activeElement!==input)input.value=Number((S[key]/factor).toFixed(unit==="ft"?5:3));
  });
  RANGE_KEYS.forEach(key=>{
    const slider=$(key),input=$(`${key}Input`);
    const isLength=LENGTH_KEYS.includes(key),factor=isLength?unitFactor(key):1;
    input.min=slider.min;input.max=slider.max;input.step=slider.step;
    if(force||document.activeElement!==input){
      const precision=isLength&&LENGTH_UNITS[key]==="ft"?5:3;
      input.value=Number((S[key]/factor).toFixed(precision));
    }
  });
}
function lengthBounds(key){
  return {margin:[0,40,1],width:[40,Math.max(dims()[0]*1.2,S.width),0.5],boxHeight:[10,Math.max(60,S.boxHeight),0.5],
    gapX:[0,Math.max(12,S.gapX),0.1],gapY:[0,Math.max(12,S.gapY),0.1],rad:[0,Math.max(12,S.rad),0.1],bw:[0,Math.max(3,S.bw),0.1],
    barRadius:[0,Math.max(30,S.barRadius),0.5]}[key];
}
function dims(){
  const P={A5:[148,210],A4:[210,297],A3:[297,420],Letter:[215.9,279.4],Legal:[215.9,355.6],Tabloid:[279.4,431.8],Custom:[S.cw,S.ch]};
  const [w,h]=P[S.paper];return S.orient==="landscape"?[h,w]:[w,h];
}
function place(){
  const f=$("frame");
  stage.style.left=S.x*PXMM+"px";stage.style.top=S.y*PXMM+"px";
  f.style.left=stage.style.left;f.style.top=stage.style.top;
  f.style.width=stage.offsetWidth+"px";f.style.height=stage.offsetHeight+"px";
  f.style.transform=stage.style.transform;f.style.transformOrigin="top left";
}
function stageSizeMm(){
  const bounds=stageBoundsMm();
  return {width:bounds.width,height:bounds.height};
}
function stageBoundsMm(){
  const rect=stage.getBoundingClientRect(),scalerRect=$("scaler").getBoundingClientRect();
  return {left:(rect.left-scalerRect.left)/Z/PXMM,top:(rect.top-scalerRect.top)/Z/PXMM,
    width:rect.width/Z/PXMM,height:rect.height/Z/PXMM};
}
function syncPos(){
  updateLengthControls();
}
function renderWorkspace(){
  const [pw,ph]=dims(),Wp=Math.round(pw*PXMM),Hp=Math.round(ph*PXMM);
  Z=S.zoom==="fit"?Math.max(.1,Math.min(($("ws").clientWidth-30)/Wp,(innerHeight-170)/Hp,2)):parseFloat(S.zoom);
  const sc=$("scaler");
  sc.style.width=Wp+"px";sc.style.height=Hp+"px";sc.style.transform=`scale(${Z})`;sc.style.setProperty("--iz",1/Z);
  $("sizer").style.width=Wp*Z+"px";$("sizer").style.height=Hp*Z+"px";
  const pp=$("paperPreview");pp.style.width=Wp+"px";pp.style.height=Hp+"px";
  pp.style.background=S.transparent?"transparent":S.bgc;
  $("chk").style.display=S.transparent?"block":"none";
  $("customRows").style.display=S.paper==="Custom"?"":"none";
  const mg=$("mg"),m=S.margin*PXMM;
  mg.style.cssText=`left:${m}px;top:${m}px;right:${m}px;bottom:${m}px;display:${S.showMargins?"block":"none"}`;
  updateLengthControls();
}

function updateInfo(){
  const [pw,ph]=dims(),dpi=S.scale*96;
  $("info").textContent=`${S.paper} ${S.orient} · ${formatLength(pw,"paper")} × ${formatLength(ph,"paper")} · exports ${Math.round(pw/25.4*dpi)} × ${Math.round(ph/25.4*dpi)} px`;
}
