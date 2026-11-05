// Shared mutable state and DOM helpers (loaded before everything else)
let S={...DEFAULTS},HOL=new Set(HOL0),Z=1;
const $=id=>document.getElementById(id);
const stage=$("stage");
const ids=Object.keys(DEFAULTS).filter(k=>k!=="month"&&$(k));
const HISTORY_LIMIT=100;
const PROGRESS_STORAGE_KEY="calendar-builder-progress";
const VALID_UNITS=new Set(["mm","cm","in","ft","px"]);
let history=[],historyIndex=-1;
let templateImageDataUrl=null;
let progressLoadWarning=null;
function saveProgress(){
  try{
    localStorage.setItem(PROGRESS_STORAGE_KEY,JSON.stringify({
      state:S,holidays:[...HOL],units:LENGTH_UNITS,templateImage:templateImageDataUrl
    }));
    $("saveMsg").textContent=progressLoadWarning
      ?`Couldn’t load previous progress (${progressLoadWarning}); a fresh layout was saved on this device.`
      :"Progress saved in this browser on this device.";
  }catch(err){
    $("saveMsg").textContent=`Changes are active, but couldn’t save locally: ${err.message||"browser storage unavailable"}`;
  }
}
function restoreSavedProgress(){
  try{
    const raw=localStorage.getItem(PROGRESS_STORAGE_KEY);
    if(!raw)return false;
    const saved=JSON.parse(raw);
    if(!saved||!saved.state||typeof saved.state!=="object"||Array.isArray(saved.state))throw new Error("saved progress has an invalid format");
    const restored={...DEFAULTS};
    Object.keys(DEFAULTS).forEach(key=>{
      if(!(key in saved.state))return;
      const value=saved.state[key],expected=typeof DEFAULTS[key];
      if(typeof value!==expected||(expected==="number"&&!Number.isFinite(value)))throw new Error(`saved setting “${key}” is invalid`);
      restored[key]=value;
    });
    if(!Number.isInteger(restored.month)||restored.month<0||restored.month>11)throw new Error("saved month is invalid");
    S=restored;
    if(Array.isArray(saved.holidays))HOL=new Set(saved.holidays.filter(key=>typeof key==="string"&&/^\d{1,2}-\d{1,2}$/.test(key)));
    if(saved.units&&typeof saved.units==="object"){
      Object.keys(LENGTH_UNITS).forEach(key=>{
        if(VALID_UNITS.has(saved.units[key]))LENGTH_UNITS[key]=saved.units[key];
      });
    }
    if(typeof saved.templateImage==="string"&&saved.templateImage.startsWith("data:image/")){
      templateImageDataUrl=saved.templateImage;
      $("templateImagePreview").src=templateImageDataUrl;
      $("templateImagePreview").style.display="block";
      $("removeTemplate").disabled=false;
      $("templateMsg").textContent="Restored saved template image · displayed across the full paper behind the calendar.";
    }
    return true;
  }catch(err){
    progressLoadWarning=err.message||"invalid browser data";
    $("saveMsg").textContent=`Couldn’t load saved progress: ${progressLoadWarning}`;
    return false;
  }
}
function currentSnapshot(){
  return {state:{...S},holidays:[...HOL],units:{...LENGTH_UNITS}};
}
function initializeHistory(){
  history=[{...currentSnapshot(),mergeKey:null}];historyIndex=0;
}
function recordHistory(mergeKey=null){
  if(historyIndex<0){initializeHistory();return}
  const snapshot=currentSnapshot(),current=history[historyIndex];
  const previous={state:current.state,holidays:current.holidays,units:current.units};
  if(JSON.stringify(snapshot)===JSON.stringify(previous))return;
  history.splice(historyIndex+1);
  if(mergeKey&&current.mergeKey===mergeKey){
    history[historyIndex]={...snapshot,mergeKey};
    saveProgress();
    return;
  }
  history.push({...snapshot,mergeKey});
  if(history.length>HISTORY_LIMIT)history.shift();
  historyIndex=history.length-1;
  saveProgress();
}
function finishHistoryGroup(){
  if(historyIndex>=0){
    history[historyIndex].mergeKey=null;
    saveProgress();
  }
}
function restoreHistory(index){
  if(index<0||index>=history.length||index===historyIndex)return;
  historyIndex=index;
  const snapshot=history[index];
  S={...snapshot.state};HOL=new Set(snapshot.holidays);LENGTH_UNITS={...snapshot.units};
  syncControls();render();saveProgress();
}
function undo(){restoreHistory(historyIndex-1)}
function redo(){restoreHistory(historyIndex+1)}
document.addEventListener("keydown",e=>{
  if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
  const key=e.key.toLowerCase();
  if(key!=="z"&&key!=="y")return;
  e.preventDefault();e.stopPropagation();
  if(key==="z"&&e.shiftKey)redo();
  else if(key==="z")undo();
  else if(key==="y")redo();
});
