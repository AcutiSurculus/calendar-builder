// Side panel: month buttons, form inputs, quick-position buttons, reset
/* controls */
const mw=$("months");
MONTHS.forEach((m,i)=>{const b=document.createElement("button");b.textContent=m.slice(0,3);b.onclick=()=>{S.month=i;recordHistory();render()};mw.appendChild(b)});
const lengthKeys=new Set(LENGTH_KEYS);
const THEME_STORAGE_KEY="calendar-builder-theme";
function syncTheme(){
  const dark=document.documentElement.dataset.theme==="dark";
  $("brandLogo").src=dark?$("brandLogo").dataset.darkSrc:$("brandLogo").dataset.lightSrc;
  $("themeToggle").textContent=dark?"Light mode":"Dark mode";
  $("themeToggle").setAttribute("aria-label",`Switch to ${dark?"light":"dark"} mode`);
  $("themeToggle").setAttribute("aria-pressed",String(dark));
}
try{
  const savedTheme=localStorage.getItem(THEME_STORAGE_KEY);
  if(savedTheme==="light"||savedTheme==="dark")document.documentElement.dataset.theme=savedTheme;
}catch(err){
  $("themeMsg").textContent=`Couldn’t load the saved theme preference: ${err.message||"storage unavailable"}`;
}
syncTheme();
$("themeToggle").onclick=()=>{
  const theme=document.documentElement.dataset.theme==="dark"?"light":"dark";
  document.documentElement.dataset.theme=theme;
  syncTheme();
  try{
    localStorage.setItem(THEME_STORAGE_KEY,theme);
    $("themeMsg").textContent="";
  }catch(err){
    $("themeMsg").textContent=`Theme changed, but couldn’t save the preference: ${err.message||"storage unavailable"}`;
  }
};
$("openTutorial").onclick=()=> $("tutorialDialog").showModal();
$("closeTutorial").onclick=()=> $("tutorialDialog").close();
$("tutorialDialog").addEventListener("click",event=>{
  if(event.target===$("tutorialDialog"))$("tutorialDialog").close();
});
$("templateImage").addEventListener("change",()=>{
  const file=$("templateImage").files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onerror=()=>{
    $("templateImage").value="";
    $("templateMsg").textContent=`Couldn’t read that image: ${reader.error&&reader.error.message||"file read failed"}`;
  };
  reader.onload=()=>{
    if(typeof reader.result!=="string"){
      $("templateMsg").textContent="Couldn’t read that image. Choose a valid image file.";
      return;
    }
    const dataUrl=reader.result,image=new Image();
    image.onload=()=>{
      const preview=$("templateImagePreview");
      preview.src=dataUrl;preview.style.display="block";
      templateImageDataUrl=dataUrl;
      $("removeTemplate").disabled=false;
      $("templateMsg").textContent=`${file.name} · displayed across the full paper behind the calendar.`;
      saveProgress();
    };
    image.onerror=()=>{
      $("templateImage").value="";
      $("templateMsg").textContent="Couldn’t load that image. Choose a valid image file.";
    };
    image.src=dataUrl;
  };
  reader.readAsDataURL(file);
});
$("removeTemplate").onclick=()=>{
  $("templateImagePreview").removeAttribute("src");
  $("templateImagePreview").style.display="none";
  $("templateImage").value="";
  $("removeTemplate").disabled=true;
  $("templateMsg").textContent="Image is placed behind the calendar across the full paper.";
  templateImageDataUrl=null;
  saveProgress();
};
function syncControls(){
  ids.forEach(k=>{const el=$(k);if(typeof S[k]==="boolean")el.checked=S[k];else el.value=lengthKeys.has(k)?S[k]/unitFactor(k):S[k]});
  $("export").textContent=S.exportAll==="all"?"Download ZIP":"Download PNG";
}
function setNumericControl(key,input){
  const value=input.valueAsNumber,slider=$(key),isLength=lengthKeys.has(key);
  if(!Number.isFinite(value)){
    updateLengthControls(true);
    return;
  }
  const factor=isLength?unitFactor(key):1;
  const min=parseFloat(slider.min)*factor,max=parseFloat(slider.max)*factor;
  S[key]=Math.max(min,Math.min(max,value*factor));
  recordHistory(`control:${key}`);
  finishHistoryGroup();
  render();
}
ids.forEach(k=>{
  const el=$(k);
  el.addEventListener(el.tagName==="SELECT"?"change":"input",()=>{
    let v;
    if(typeof DEFAULTS[k]==="boolean")v=el.checked;
    else if(typeof DEFAULTS[k]==="number"){v=parseFloat(el.value);if(isNaN(v))return}
    else v=el.value;
    if(lengthKeys.has(k))v*=unitFactor(k);
    if(["paper","orient","cw","ch"].includes(k)){
      const ow=dims()[0];S[k]=v;const r=dims()[0]/ow;
      S.width=+(S.width*r).toFixed(1);S.x=+(S.x*r).toFixed(1);S.y=+(S.y*r).toFixed(1);
    }else S[k]=v;
    if(k==="font"){
      const fontName=v.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/[\r\n]/g,"");
      document.fonts.load(`700 20px "${fontName}"`).then(render).catch(err=>{
        $("fontMsg").textContent=`Couldn’t load “${v}”: ${err.message||"font unavailable"}`;
      });
    }
    recordHistory(`control:${k}`);
    render();
  });
  if(el.tagName!=="SELECT")el.addEventListener("change",finishHistoryGroup);
});
RANGE_KEYS.forEach(key=>{
  const input=$(`${key}Input`);
  input.addEventListener("change",()=>setNumericControl(key,input));
  input.addEventListener("keydown",event=>{
    if(event.key==="Enter")input.blur();
  });
});
function setUnit(key,unit){
  if(LENGTH_UNITS[key]===unit)return;
  LENGTH_UNITS[key]=unit;
  recordHistory(`unit:${key}`);
  updateLengthControls(true);
  render();
}
const sliderToggle=$("toggleSliders");
sliderToggle.addEventListener("click",()=>{
  const visible=document.body.classList.toggle("show-sliders");
  sliderToggle.textContent=visible?"Hide optional sliders":"Show optional sliders";
  sliderToggle.setAttribute("aria-expanded",String(visible));
});
const unitMenu=$("unitMenu");
let unitMenuReturnFocus=null;
let unitMenuTarget="paper";
function openUnitMenu(event){
  if(!(event.target instanceof Element))return;
  const target=event.target;
  const measurement=target.closest(".length-label, input[type=range], input[type=number]");
  if(target.closest("#paperPreview"))unitMenuTarget="paper";
  else if(measurement){
    unitMenuTarget=measurement.dataset.lengthKey|| (measurement.matches(".length-label")?measurement.htmlFor:measurement.id);
    if(unitMenuTarget==="widthInput")unitMenuTarget="width";
    if(unitMenuTarget==="boxHeightInput")unitMenuTarget="boxHeight";
    if(!LENGTH_KEYS.includes(unitMenuTarget))return;
  }else return;
  event.preventDefault();
  unitMenuReturnFocus=document.activeElement;
  unitMenu.hidden=false;
  const bounds=unitMenu.getBoundingClientRect();
  unitMenu.style.left=`${Math.max(8,Math.min(event.clientX,innerWidth-bounds.width-8))}px`;
  unitMenu.style.top=`${Math.max(8,Math.min(event.clientY,innerHeight-bounds.height-8))}px`;
  unitMenu.querySelector(`[data-unit="${LENGTH_UNITS[unitMenuTarget]}"]`).focus();
}
document.addEventListener("contextmenu",openUnitMenu);
unitMenu.addEventListener("click",event=>{
  const option=event.target.closest("[data-unit]");
  if(!option)return;
  setUnit(unitMenuTarget,option.dataset.unit);
  unitMenu.hidden=true;
  if(unitMenuReturnFocus instanceof HTMLElement)unitMenuReturnFocus.focus();
});
document.addEventListener("pointerdown",event=>{
  if(!unitMenu.hidden&&!unitMenu.contains(event.target))unitMenu.hidden=true;
});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!unitMenu.hidden){
    unitMenu.hidden=true;
    if(unitMenuReturnFocus instanceof HTMLElement)unitMenuReturnFocus.focus();
  }
});
$("loadFonts").onclick=async()=>{
  const msg=$("fontMsg"),button=$("loadFonts");
  if(typeof window.queryLocalFonts!=="function"){
    msg.textContent="Installed-font discovery isn’t supported by this browser. You can still use the listed web and system fonts.";
    return;
  }
  button.disabled=true;msg.textContent="Checking installed fonts…";
  try{
    const fonts=await window.queryLocalFonts();
    const families=[...new Set(fonts.map(font=>font.family).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const select=$("font"),selected=S.font,known=new Set(Array.from(select.options,option=>option.value));
    families.forEach(family=>{
      if(known.has(family))return;
      const option=document.createElement("option");option.value=family;option.textContent=family;select.appendChild(option);
    });
    select.value=selected;
    msg.textContent=families.length?`Loaded ${families.length} installed font families.`:"No installed fonts were returned.";
  }catch(err){
    msg.textContent=`Couldn’t access installed fonts: ${err.message||"permission denied"}`;
  }finally{
    button.disabled=false;
  }
};
$("cx").onclick=()=>{S.x=+((dims()[0]-S.width)/2).toFixed(1);recordHistory();render()};
$("cy").onclick=()=>{S.y=+((dims()[1]-stage.offsetHeight/PXMM)/2).toFixed(1);recordHistory();render()};
$("fit").onclick=()=>{S.width=+(dims()[0]-2*S.margin).toFixed(1);S.x=S.margin;recordHistory();render()};
$("reset").onclick=()=>{S={...DEFAULTS};HOL=new Set(HOL0);syncControls();recordHistory();render();$("msg").textContent=""};
addEventListener("resize",()=>render());
