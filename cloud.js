'use strict';
// Public REST calls use narrow RPCs. Full study reads require authenticated RLS.
window.AfterCloud = (() => {
  const config = window.AFTER_CONFIG || {};
  const enabled = Boolean(config.supabaseUrl && config.publishableKey);
  const base = (config.supabaseUrl || '').replace(/\/$/,'');
  const VAULT = 'after-study-capabilities-v1', QUEUE = 'after-study-outbox-v1';
  const AUTH = 'after-researcher-auth-v1';
  let outbox = read(QUEUE,{}), vault = read(VAULT,{}), auth = read(AUTH,null);
  let timer, running = false, retryTimer, status = enabled ? 'ready' : 'local';
  const listeners = new Set();
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
  function emit(next){status=next;for(const cb of listeners)cb(status)}
  function onStatus(cb){listeners.add(cb);return()=>listeners.delete(cb)}
  async function request(path,body,token,method='POST',keepalive=false){
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const headers={apikey:config.publishableKey,'Content-Type':'application/json'};
      if(token)headers.Authorization='Bearer '+token;
      const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,keepalive});
      const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null}catch{data=null}
      if(!response.ok){const err=new Error(data?.message||data?.msg||data?.error_description||'The study service could not complete this request.');err.status=response.status;throw err}
      return data;
    }catch(e){if(e.name==='AbortError')throw new Error('Connection timed out. Please try again.');throw e}finally{clearTimeout(timeout)}
  }
  function secret(){const bytes=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  async function begin(id,build,previewVersion){
    if(!enabled)throw new Error('Central study storage is not configured.');
    let cap=vault[id];if(!cap){cap={secret:secret(),revision:0};vault[id]=cap;if(!write(VAULT,vault))throw new Error('Please allow browser storage to keep your anonymous study session safe.')}
    const data=await request('/rest/v1/rpc/after_begin_session',{p_id:id,p_secret:cap.secret,p_build:build,p_preview_variant:previewVersion||null});
    return data;
  }
  function queue(snapshot){
    if(!enabled||!vault[snapshot.id])return;
    const cap=vault[snapshot.id];cap.revision++;
    const payload=JSON.parse(JSON.stringify(snapshot));delete payload.perfStart;delete payload.endPerf;delete payload.hiddenSince;
    outbox[snapshot.id]={id:snapshot.id,revision:cap.revision,payload};
    write(VAULT,vault);write(QUEUE,outbox);emit('pending');
    clearTimeout(timer);timer=setTimeout(flush,650);
  }
  async function flush(){
    if(!enabled||running)return;clearTimeout(timer);clearTimeout(retryTimer);running=true;
    let failed=false;
    try{
      for(const item of Object.values(outbox)){
        const cap=vault[item.id];if(!cap)continue;
        emit('saving');
        try{
          await request('/rest/v1/rpc/after_save_session',{p_id:item.id,p_secret:cap.secret,p_revision:item.revision,p_payload:item.payload});
          if(outbox[item.id]?.revision===item.revision)delete outbox[item.id];
          write(QUEUE,outbox);
        }catch(e){failed=true;emit('offline');break}
      }
    }finally{running=false}
    if(failed){retryTimer=setTimeout(flush,5000)}else if(Object.keys(outbox).length){timer=setTimeout(flush,100)}else emit('saved');
  }
  function flushOnExit(){
    if(!enabled)return;
    for(const item of Object.values(outbox)){
      const cap=vault[item.id];if(!cap)continue;
      // Keep the durable outbox until a normal request acknowledges it.
      request('/rest/v1/rpc/after_save_session',{p_id:item.id,p_secret:cap.secret,p_revision:item.revision,p_payload:item.payload},null,'POST',true).catch(()=>{});
    }
  }
  async function initialise(){
    if(!enabled)return;
    const hash=new URLSearchParams(location.hash.slice(1));
    if(hash.get('access_token')&&hash.get('refresh_token')){
      auth={access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),expires_at:Date.now()+Number(hash.get('expires_in')||3600)*1000};
      write(AUTH,auth);history.replaceState(null,'',location.pathname+'?view=research');
    }
    if(hash.get('error_description')){
      const message=hash.get('error_description');history.replaceState(null,'',location.pathname+'?view=research');throw new Error(message);
    }
    if(Object.keys(outbox).length)flush();
  }
  async function token(){
    if(!auth)throw new Error('Researcher sign-in is required.');
    if(auth.expires_at<Date.now()+60000){
      try{const data=await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:auth.refresh_token});auth={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+data.expires_in*1000};write(AUTH,auth)}
      catch(e){auth=null;localStorage.removeItem(AUTH);throw new Error('Your sign-in has expired. Please sign in again.')}
    }
    return auth.access_token;
  }
  async function isResearcher(){if(!enabled||!auth)return false;return await request('/rest/v1/rpc/after_is_researcher',{},await token())===true}
  async function signIn(email){
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))throw new Error('Enter a valid email address.');
    const redirect=location.origin+location.pathname+'?view=research';
    await request('/auth/v1/otp?redirect_to='+encodeURIComponent(redirect),{email:email.trim().toLowerCase(),create_user:true});
  }
  async function verifyOtp(email,code){
    const data=await request('/auth/v1/verify',{email:email.trim().toLowerCase(),token:code.trim(),type:'email'});
    auth={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+data.expires_in*1000};write(AUTH,auth);
    if(!await isResearcher()){await signOut();throw new Error('This account does not have researcher access.')}
  }
  async function signOut(){if(auth){try{await request('/auth/v1/logout',{},await token())}catch{}}auth=null;localStorage.removeItem(AUTH)}
  async function results(){
    if(!await isResearcher())throw new Error('Researcher access is required.');
    const rows=await request('/rest/v1/after_study_sessions?select=id,participant_code,variant,kind,build,created_at,updated_at,revision,payload&order=created_at.asc&limit=1000',undefined,await token(),'GET');
    return rows.map(r=>({id:r.id,participantCode:r.participant_code,version:r.variant,kind:r.kind,build:r.build,startedAt:r.created_at,updatedAt:r.updated_at,events:[],outcome:'in_progress',locateMs:null,locateActiveMs:null,completionMs:null,completionActiveMs:null,taps:0,wrongTaskOpens:0,scrollPx:0,scrollEpisodes:0,...r.payload,serverCreatedAt:r.created_at,serverUpdatedAt:r.updated_at,serverRevision:r.revision}));
  }
  async function setCollection(accepting){return request('/rest/v1/rpc/after_set_collection',{p_accepting:accepting},await token())}
  function pendingCount(){return Object.keys(outbox).length}
  addEventListener('online',()=>flush());addEventListener('pagehide',flushOnExit);
  return {enabled,begin,queue,flush,onStatus,initialise,isResearcher,signIn,verifyOtp,signOut,results,setCollection,pendingCount,get status(){return status}};
})();
