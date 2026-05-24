const fs=require("fs");const {JSDOM}=require("jsdom");
let html=fs.readFileSync("index.html","utf8").replace('<script type="module">','<script>');
const errors=[];
const mk=n=>({request:async({method})=>method==="eth_requestAccounts"?["0x1234abcd000000000000000000000000face0001"]:null,on(){}});
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://blueroom.app/",
  beforeParse(w){ w.ethereum=mk(); w.HTMLElement.prototype.getBoundingClientRect=()=>({left:10,top:10,width:40,height:40,right:50,bottom:50}); if(!w.navigator.clipboard)w.navigator.clipboard={writeText(){}};
    w.addEventListener("eip6963:requestProvider",()=>{ [["MetaMask","io.metamask"],["Rabby Wallet","io.rabby"]].forEach((p,i)=>w.dispatchEvent(new w.CustomEvent("eip6963:announceProvider",{detail:{info:{uuid:"u"+i,name:p[0],rdns:p[1],icon:"data:,"},provider:mk()}}))); });
  }});
const w=dom.window,d=w.document; w.addEventListener("error",e=>errors.push(""+(e.message||e.error))); w.addEventListener("unhandledrejection",()=>{});
const tick=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await tick(150);
  d.querySelector("#connectBtn").click(); await tick(80);
  const opts=[...d.querySelectorAll("#walletList .wopt")].map(b=>b.textContent.replace(/\s+/g," ").trim());
  // clicking WalletConnect with no projectId should just toast (no crash)
  const wc=[...d.querySelectorAll("#walletList .wopt")].find(b=>/WalletConnect/.test(b.textContent)); if(wc) wc.click(); await tick(40);
  // connect via Rabby to confirm flow still good
  const rb=[...d.querySelectorAll("#walletList .wopt")].find(b=>/Rabby/.test(b.textContent)); if(rb) rb.click(); await tick(300);
  console.log("wallet options:",JSON.stringify(opts));
  console.log("connected:",d.querySelector("#connectBtn").textContent.trim());
  console.log("page errors:",errors.length?errors:"NONE");
  const ok=["MetaMask","Rabby","Coinbase","WalletConnect"].every(name=>opts.some(o=>o.includes(name))) && !errors.length;
  console.log(ok?"OK — MetaMask + Rabby + Coinbase + WalletConnect all present":"FAIL");
  w.close();process.exit(0);
})();
