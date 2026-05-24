const fs=require("fs");const {JSDOM}=require("jsdom");
let html=fs.readFileSync("index.html","utf8").replace('<script type="module">','<script>');
const errors=[];
const mk=()=>({request:async({method})=>method==="eth_requestAccounts"?["0x1234abcd000000000000000000000000face0001"]:null,on(){}});
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://blueroom.app/",
  beforeParse(w){ w.ethereum=mk(); w.HTMLElement.prototype.getBoundingClientRect=()=>({left:10,top:10,width:40,height:40,right:50,bottom:50}); if(!w.navigator.clipboard)w.navigator.clipboard={writeText(){}};
    w.addEventListener("eip6963:requestProvider",()=>{ [["MetaMask","io.metamask"],["Rabby Wallet","io.rabby"]].forEach((p,i)=>w.dispatchEvent(new w.CustomEvent("eip6963:announceProvider",{detail:{info:{uuid:"u"+i,name:p[0],rdns:p[1],icon:"data:,"},provider:mk()}}))); }); }});
const w=dom.window,d=w.document; w.addEventListener("error",e=>errors.push(""+(e.message||e.error))); w.addEventListener("unhandledrejection",()=>{});
const tick=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await tick(150);
  const navs=d.querySelectorAll(".navi").length;
  d.querySelector("#connectBtn").click(); await tick(80);
  const opts=[...d.querySelectorAll("#walletList .wopt")].map(b=>b.textContent.replace(/\s+/g," ").trim());
  const mm=[...d.querySelectorAll("#walletList .wopt")].find(b=>/MetaMask/.test(b.textContent)); mm&&mm.click(); await tick(500);
  const connected=d.querySelector("#connectBtn").textContent.trim();
  d.querySelector("#msgInput").value="gm"; d.querySelector("#sendBtn").click(); await tick(60);
  const msgs=d.querySelectorAll("#feed .msg").length;
  d.querySelector('.navi[data-view="agents"]').click(); await tick(40); const addForm=!!d.querySelector("#addInput");
  d.querySelector('.navi[data-view="profile"]').click(); await tick(40); const stats=d.querySelectorAll("#profileWrap .stat").length;
  console.log("nav:",navs,"| wallet opts:",opts.length,"| connected:",connected,"| feed:",msgs,"| agents form:",addForm,"| profile stats:",stats);
  console.log("page errors:",errors.length?errors:"NONE");
  console.log((!errors.length && connected==="● Connected" && opts.length>=4 && addForm && stats===3)?"OK — all good":"FAIL");
  w.close();process.exit(0);
})();
