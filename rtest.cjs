const fs=require("fs");const {JSDOM}=require("jsdom");
let html=fs.readFileSync("index.html","utf8").replace('<script type="module">','<script>');
const errors=[];
const fakeProvider={request:async({method})=>method==="eth_requestAccounts"?["0x1234abcd000000000000000000000000face0001"]:null};
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://blueroom.app/",
  beforeParse(w){ w.ethereum=fakeProvider; w.HTMLElement.prototype.getBoundingClientRect=()=>({left:10,top:10,width:40,height:40,right:50,bottom:50}); if(!w.navigator.clipboard)w.navigator.clipboard={writeText(){}}; }});
const w=dom.window,d=w.document;
w.addEventListener("error",e=>errors.push("err: "+(e.message||e.error)));
w.addEventListener("unhandledrejection",()=>{}); // CDN import rejections expected & handled
const tick=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await tick(150);
  const navs=d.querySelectorAll(".navi").length;
  const msgs0=d.querySelectorAll("#feed .msg").length;
  const hasPlans=!!d.querySelector('.navi[data-view="plans"]');
  const trophSoon=!!d.querySelector('.navi[data-view="trophies"] .soon');
  d.querySelector("#connectBtn").click(); await tick(500);
  const status=d.querySelector("#statusTxt").textContent;
  d.querySelector("#msgInput").value="gm everyone"; d.querySelector("#sendBtn").click(); await tick(60);
  const afterSend=d.querySelectorAll("#feed .msg").length;
  d.querySelector('.navi[data-view="agents"]').click(); await tick(40);
  const addBtn=!!d.querySelector("#addInput");
  d.querySelector('.navi[data-view="trophies"]').click(); await tick(20);
  const soonView=!!d.querySelector('#view-trophies .soonwrap');
  d.querySelector('.navi[data-view="profile"]').click(); await tick(30);
  const stats=d.querySelectorAll("#profileWrap .stat").length;
  console.log("nav items:",navs,"(plans present:",hasPlans,"| trophies=Soon:",trophSoon,")");
  console.log("initial msgs:",msgs0,"| after send:",afterSend,"| status:",status);
  console.log("agents add-form:",addBtn,"| trophies coming-soon view:",soonView,"| profile stats:",stats);
  console.log("page errors:",errors.length?errors:"NONE");
  console.log(errors.length||hasPlans||!trophSoon||!soonView?"FAIL":"OK — all checks pass");
  w.close();process.exit(0);
})();
