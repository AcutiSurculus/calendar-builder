// Static settings: month/day names, paper constants, default state
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS={short:["SUN","MON","TUE","WED","THU","FRI","SAT"],narrow:["S","M","T","W","T","F","S"],full:["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"]};
const PXMM=96/25.4;
const DEFAULTS={year:2027,month:0,paper:"A4",orient:"portrait",cw:210,ch:297,x:5,y:40,margin:10,showMargins:true,snap:true,zoom:"fit",
  weekStart:0,showTitle:true,titleLayout:"stack",titleAlign:"center",showBar:true,labels:"short",barFontSize:16,barRadius:2, numAlign:"l",
  width:200,gapX:2.6,gapY:2.6,boxHeight:30,rad:3.7,bw:0.5,scaleY:1,num:30,font:"Baloo 2",primary:"#d50932",ink:"#111111",sun:"#111111",hol:"#d50932",
  cell:"#ffffff",line2:"#333333",transparent:true,bgc:"#ffffff",scale:3.125,exportAll:"single",exportTitle:true};
const HOL0=["1-1","4-9","5-1","6-12","8-30","11-30","12-25","12-30"];
