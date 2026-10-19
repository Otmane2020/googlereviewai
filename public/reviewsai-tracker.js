/* ReviewsAI Store first-party traffic tracker. No IP, cookies, or form data sent. */
(function(){
 "use strict";
 var script=document.currentScript;
 var site=script&&script.getAttribute("data-site");
 var endpoint=script&&script.getAttribute("data-endpoint");
 if(!/^rv_[a-f0-9]{32}$/.test(site||"")||!/^https:\/\//.test(endpoint||""))return;
 var key="reviewsai_session_"+site, last="";
 function sid(){
   var data=null;try{data=JSON.parse(sessionStorage.getItem(key)||"null");}catch(_){}
   if(!data||!data.id||Date.now()-data.time>1800000){
     data={id:(crypto.randomUUID?crypto.randomUUID().replace(/-/g,""):"s"+Math.random().toString(36).slice(2)+Date.now()),time:Date.now(),referrer:document.referrer};
   }
   data.time=Date.now();try{sessionStorage.setItem(key,JSON.stringify(data));}catch(_){}
   return data;
 }
 function host(s){try{return new URL(s).hostname.toLowerCase();}catch(_){return "";}}
 function track(type,name){
   var state=sid(), data={site:site,session_id:state.id,path:location.pathname.slice(0,512),event_type:type,
     event_name:name||null,referrer_host:host(state.referrer),utm_source:(new URLSearchParams(location.search)).get("utm_source")||""};
   try{fetch(endpoint,{method:"POST",mode:"cors",keepalive:true,headers:{"Content-Type":"text/plain"},body:JSON.stringify(data)}).catch(function(){});}catch(_){}
 }
 function page(){var path=location.pathname+location.search;if(path===last)return;last=path;track("page_view");}
 page();window.addEventListener("popstate",page);window.addEventListener("hashchange",page);
 ["pushState","replaceState"].forEach(function(name){var original=history[name];history[name]=function(){var result=original.apply(this,arguments);setTimeout(page,0);return result;};});
 document.addEventListener("click",function(event){
   var node=event.target&&event.target.closest&&event.target.closest("a[href]");
   if(!node)return;
   var url=node.getAttribute("href")||"";
   if(/^tel:/i.test(url))track("conversion","phone_click");
   if(/^mailto:/i.test(url))track("conversion","email_click");
 });
 window.reviewsai={track:function(name){if(/^[a-z0-9_-]{2,60}$/i.test(name||""))track("conversion",name);}};
})();
