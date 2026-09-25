/* RusWeo 3.0 Phase 1: one Web App, multiple containers.
   Native Android bridge always wins over Telegram's JS object. */
(function(){
  'use strict';

  function nativeBridge(){
    try{
      var b=window.UruWayAndroid||null;
      if(!b||typeof b.getPlatform!=='function')return null;
      var p=String(b.getPlatform()||'').toLowerCase();
      return p==='android'?b:null;
    }catch(e){return null}
  }

  function telegram(){
    if(nativeBridge())return null;
    try{
      return window.Telegram&&window.Telegram.WebApp
        ? window.Telegram.WebApp
        : null;
    }catch(e){return null}
  }

  function platform(){
    if(nativeBridge())return 'android';
    if(telegram())return 'telegram';
    return 'browser';
  }

  function session(){
    try{
      return String(localStorage.getItem('uruway_auth_session')||'').trim();
    }catch(e){return ''}
  }

  function initData(){
    var tg=telegram();
    try{
      return String(tg&&tg.initData||'').trim();
    }catch(e){return ''}
  }

  function openExternal(url){
    url=String(url||'').trim();
    if(!url)return false;

    var b=nativeBridge();
    try{
      if(b&&typeof b.openExternal==='function'){
        b.openExternal(url);
        return true;
      }
    }catch(e){}

    var tg=telegram();
    try{
      if(tg&&/^https:\/\/t\.me\//i.test(url)&&
         typeof tg.openTelegramLink==='function'){
        tg.openTelegramLink(url);
        return true;
      }
      if(tg&&/^https?:\/\//i.test(url)&&
         typeof tg.openLink==='function'){
        tg.openLink(url);
        return true;
      }
    }catch(e){}

    try{
      window.open(url,'_blank','noopener');
      return true;
    }catch(e){
      try{
        location.href=url;
        return true;
      }catch(_){
        return false;
      }
    }
  }

  function authContext(){
    return {
      platform:platform(),
      init_data:initData(),
      session_token:session()
    };
  }

  window.RusWeo=window.RusWeo||{};
  window.RusWeo.platform={
    get:platform,
    isAndroid:function(){return platform()==='android'},
    isTelegram:function(){return platform()==='telegram'},
    nativeBridge:nativeBridge,
    telegram:telegram
  };
  window.RusWeo.auth={
    getContext:authContext,
    getSession:session,
    getTelegramInitData:initData
  };
  window.RusWeo.openExternal=openExternal;

  try{
    document.documentElement.dataset.rusweoPlatform=platform();
  }catch(e){}
})();

/* ============================================================
   RusWeo CHAT V91
   Shared chat geometry + live client refresh.
   This patch changes CHAT ONLY.
   - client chat stays above the fixed bottom RusWeo navigation;
   - keyboard cannot hide the compose row;
   - driver chat is compact and lifted from the bottom;
   - client chat refreshes automatically while it is open.
   ============================================================ */
(function(){
  'use strict';

  var CLIENT_POLL_MS=2500;
  var clientOrderId='';
  var clientPollTimer=0;
  var clientJsonpBusy=false;
  var clientHooked=false;

  function addStyle(){
    if(document.getElementById('rusweo-chat-v91-style'))return;

    var style=document.createElement('style');
    style.id='rusweo-chat-v91-style';
    style.textContent=[
      '/* CLIENT CHAT: compact sheet above the shared bottom navigation. */',
      '#rw2ChatSheet .rw2-chat-card{',
      '  bottom:var(--rw-chat-client-bottom,76px)!important;',
      '  height:var(--rw-chat-client-height,min(54dvh,460px))!important;',
      '  max-height:var(--rw-chat-client-height,min(54dvh,460px))!important;',
      '  left:10px!important;',
      '  right:10px!important;',
      '  width:min(calc(100% - 20px),680px)!important;',
      '  border-radius:22px!important;',
      '  padding-bottom:0!important;',
      '  overflow:hidden!important;',
      '}',
      '#rw2ChatSheet .rw2-chat-messages{',
      '  flex:1 1 auto!important;',
      '  min-height:0!important;',
      '  overscroll-behavior:contain!important;',
      '  -webkit-overflow-scrolling:touch!important;',
      '}',
      '#rw2ChatSheet .rw2-chat-compose{',
      '  flex:0 0 auto!important;',
      '  position:relative!important;',
      '  z-index:4!important;',
      '  padding:9px 10px 10px!important;',
      '}',
      '#rw2ChatSheet .rw2-chat-compose textarea{',
      '  min-height:44px!important;',
      '  max-height:88px!important;',
      '}',
      '',
      '/* DRIVER CHAT: same idea — compact and visibly above the bottom edge. */',
      '#chatOverlay.chat-overlay{',
      '  padding:18px 12px var(--rw-chat-driver-bottom,26px)!important;',
      '}',
      '#chatOverlay .chat-sheet{',
      '  height:var(--rw-chat-driver-height,min(60dvh,520px))!important;',
      '  max-height:var(--rw-chat-driver-height,min(60dvh,520px))!important;',
      '  margin:0 auto!important;',
      '  border-radius:24px!important;',
      '}',
      '#chatOverlay .chat-messages{',
      '  flex:1 1 auto!important;',
      '  min-height:0!important;',
      '  overscroll-behavior:contain!important;',
      '  -webkit-overflow-scrolling:touch!important;',
      '}',
      '#chatOverlay .chat-compose{',
      '  flex:0 0 auto!important;',
      '  background:#fff!important;',
      '}',
      '@media(max-width:430px){',
      '  #rw2ChatSheet .rw2-chat-card{left:7px!important;right:7px!important;width:calc(100% - 14px)!important}',
      '  #chatOverlay .chat-sheet{width:100%!important}',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function viewportData(){
    var innerH=Math.max(
      1,
      Number(window.innerHeight||0),
      Number(document.documentElement&&document.documentElement.clientHeight||0)
    );
    var vv=window.visualViewport||null;
    var visibleH=vv?Math.max(1,Number(vv.height||innerH)):innerH;
    var visibleBottom=vv
      ? Math.max(0,Number(vv.offsetTop||0))+visibleH
      : innerH;
    var keyboardGap=Math.max(0,innerH-visibleBottom);

    return {
      innerH:innerH,
      visibleH:visibleH,
      keyboardGap:keyboardGap
    };
  }

  function syncClientGeometry(){
    var overlay=document.getElementById('rw2ChatSheet');
    if(!overlay)return;

    var v=viewportData();
    var nav=document.getElementById('rw31GlobalBottomNav');
    var navGap=72;

    try{
      if(nav){
        var r=nav.getBoundingClientRect();
        if(Number.isFinite(r.top)){
          navGap=Math.max(
            navGap,
            Math.round(v.innerH-r.top+8)
          );
        }
      }
    }catch(e){}

    /*
      When the keyboard is open, move the entire chat above the keyboard.
      Otherwise keep it immediately above the RusWeo bottom navigation.
    */
    var bottom=Math.max(
      navGap,
      Math.round(v.keyboardGap+10)
    );

    var available=Math.max(
      228,
      v.innerH-bottom-12
    );

    var wanted=Math.min(
      460,
      Math.round(v.visibleH*.54),
      available
    );

    wanted=Math.max(
      228,
      wanted
    );

    overlay.style.setProperty(
      '--rw-chat-client-bottom',
      bottom+'px'
    );
    overlay.style.setProperty(
      '--rw-chat-client-height',
      wanted+'px'
    );
  }

  function syncDriverGeometry(){
    var overlay=document.getElementById('chatOverlay');
    if(!overlay)return;

    var v=viewportData();

    var bottom=Math.max(
      22,
      Math.round(v.keyboardGap+10)
    );

    var available=Math.max(
      260,
      v.innerH-bottom-16
    );

    var wanted=Math.min(
      520,
      Math.round(v.visibleH*.60),
      available
    );

    wanted=Math.max(
      260,
      wanted
    );

    overlay.style.setProperty(
      '--rw-chat-driver-bottom',
      bottom+'px'
    );
    overlay.style.setProperty(
      '--rw-chat-driver-height',
      wanted+'px'
    );
  }

  function syncGeometry(){
    syncClientGeometry();
    syncDriverGeometry();
  }

  function apiUrl(){
    try{
      if(typeof API==='string'&&API.trim()){
        return API.trim();
      }
    }catch(e){}

    return 'https://script.google.com/macros/s/AKfycbzWkerEeWR-3EjY1QW44Az6pj1TjJK9_ktfnrdcgFILlD6Cnqb4z2X97zSknKRJw-i3jw/exec';
  }

  function deliverClientChatResponse(data){
    try{
      if(
        window.UruWayApp&&
        typeof window.UruWayApp.onClientAppApiV35==='function'
      ){
        window.UruWayApp.onClientAppApiV35(data);
      }
    }catch(e){}
  }

  function requestTelegramClientChat(){
    if(clientJsonpBusy)return;

    var tg=null;
    try{
      tg=window.Telegram&&window.Telegram.WebApp
        ? window.Telegram.WebApp
        : null;
    }catch(e){}

    var init='';
    try{
      init=String(tg&&tg.initData||'').trim();
    }catch(e){}

    if(!init)return;

    clientJsonpBusy=true;

    var cb=
      'RusWeoChatPollV91_'+
      Date.now()+
      '_'+
      Math.random().toString(36).slice(2,8);

    var script=document.createElement('script');
    var done=false;
    var timeout=0;

    function clean(){
      if(done)return;
      done=true;
      clientJsonpBusy=false;

      try{
        if(timeout)clearTimeout(timeout);
      }catch(e){}

      try{
        delete window[cb];
      }catch(e){
        try{window[cb]=undefined}catch(_){}
      }

      try{
        script.remove();
      }catch(e){}
    }

    window[cb]=function(data){
      if(done)return;
      deliverClientChatResponse(data);
      clean();
    };

    script.onerror=function(){
      clean();
    };

    var q=[
      'action=telegram_client_orders',
      'mode=chat',
      'id='+encodeURIComponent(clientOrderId),
      'init_data='+encodeURIComponent(init),
      'callback='+encodeURIComponent(cb),
      '_='+Date.now()
    ].join('&');

    script.src=apiUrl()+'?'+q;
    document.head.appendChild(script);

    timeout=setTimeout(
      clean,
      8000
    );
  }

  function requestClientChat(){
    if(!clientOrderId)return;
    if(document.hidden)return;

    var sheet=document.getElementById('rw2ChatSheet');
    if(!sheet||!sheet.classList.contains('open'))return;

    var bridge=null;
    try{
      bridge=window.UruWayAndroid||null;
    }catch(e){}

    var sess='';
    try{
      sess=String(
        localStorage.getItem('uruway_auth_session')||''
      ).trim();
    }catch(e){}

    if(
      bridge&&
      typeof bridge.clientAppApiV35==='function'&&
      sess
    ){
      try{
        bridge.clientAppApiV35(
          'chat',
          sess,
          String(clientOrderId),
          ''
        );
      }catch(e){}
      return;
    }

    requestTelegramClientChat();
  }

  function stopClientPoll(){
    if(clientPollTimer){
      clearInterval(clientPollTimer);
      clientPollTimer=0;
    }
  }

  function startClientPoll(){
    stopClientPoll();

    if(!clientOrderId)return;

    clientPollTimer=setInterval(
      requestClientChat,
      CLIENT_POLL_MS
    );

    setTimeout(
      requestClientChat,
      350
    );
  }

  function hookClientChat(){
    if(clientHooked)return true;

    if(
      typeof window.rw2OpenChat!=='function'||
      typeof window.rw2CloseChat!=='function'
    ){
      return false;
    }

    var originalOpen=window.rw2OpenChat;
    var originalClose=window.rw2CloseChat;
    var originalSend=
      typeof window.rw2SendChat==='function'
        ? window.rw2SendChat
        : null;

    window.rw2OpenChat=function(id){
      clientOrderId=String(id||'');
      var result=originalOpen.apply(this,arguments);

      syncClientGeometry();
      setTimeout(syncClientGeometry,80);
      setTimeout(syncClientGeometry,260);

      startClientPoll();

      return result;
    };

    window.rw2CloseChat=function(){
      stopClientPoll();
      clientOrderId='';
      return originalClose.apply(this,arguments);
    };

    if(originalSend){
      window.rw2SendChat=function(){
        var result=originalSend.apply(this,arguments);

        /*
          Pull once again shortly after send. Android also refreshes from its
          native callback; this extra pull makes Telegram and Android converge.
        */
        setTimeout(
          requestClientChat,
          650
        );

        return result;
      };
    }

    clientHooked=true;
    return true;
  }

  function bindInputs(){
    var clientInput=document.getElementById('rw2ChatInput');
    if(clientInput&&!clientInput.dataset.rwChatV91){
      clientInput.dataset.rwChatV91='1';

      clientInput.addEventListener(
        'focus',
        function(){
          syncClientGeometry();
          setTimeout(syncClientGeometry,120);
          setTimeout(syncClientGeometry,320);
        }
      );

      clientInput.addEventListener(
        'blur',
        function(){
          setTimeout(syncClientGeometry,120);
        }
      );
    }

    var driverInput=
      document.querySelector('#chatOverlay textarea');

    if(driverInput&&!driverInput.dataset.rwChatV91){
      driverInput.dataset.rwChatV91='1';

      driverInput.addEventListener(
        'focus',
        function(){
          syncDriverGeometry();
          setTimeout(syncDriverGeometry,120);
          setTimeout(syncDriverGeometry,320);
        }
      );

      driverInput.addEventListener(
        'blur',
        function(){
          setTimeout(syncDriverGeometry,120);
        }
      );
    }
  }

  function install(){
    addStyle();
    syncGeometry();
    hookClientChat();
    bindInputs();

    /*
      The platform file is loaded in <head>, before index/driver define their
      chat functions. Retry briefly without changing either application's code.
    */
    var attempts=0;
    var waiter=setInterval(
      function(){
        attempts+=1;
        hookClientChat();
        bindInputs();
        syncGeometry();

        if(
          attempts>=40||
          clientHooked||
          document.readyState==='complete'
        ){
          if(attempts>=40||clientHooked){
            clearInterval(waiter);
          }
        }
      },
      250
    );

    window.addEventListener(
      'resize',
      syncGeometry,
      {passive:true}
    );

    if(window.visualViewport){
      window.visualViewport.addEventListener(
        'resize',
        syncGeometry,
        {passive:true}
      );

      window.visualViewport.addEventListener(
        'scroll',
        syncGeometry,
        {passive:true}
      );
    }

    document.addEventListener(
      'visibilitychange',
      function(){
        if(!document.hidden){
          syncGeometry();
          requestClientChat();
        }
      },
      true
    );
  }

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      install,
      {once:true}
    );
  }else{
    install();
  }
})();

/* ============================================================
   RUSWEO V116 FIX15 — GLOBAL RETRY + ERROR DIAGNOSTICS
   One shared client-side guard for Android WebView / Telegram Mini App.
   - safe GET/read transports retry once automatically;
   - selected mutations retry once with a stable rw_request_id and backend dedupe;
   - final failures are queued and reported automatically to the admin;
   - runtime JS / unhandled promise errors are reported without exposing secrets.
   ============================================================ */
(function(){
  'use strict';
  if(window.RusWeo&&window.RusWeo.guard&&window.RusWeo.guard.patch==='FIX15_GLOBAL_RETRY_DIAGNOSTICS_20260925')return;

  var PATCH='FIX15_GLOBAL_RETRY_DIAGNOSTICS_20260925';
  var APP_VERSION='3.1.42';
  var WEB_REVISION='31116';
  var API_FALLBACK='https://script.google.com/macros/s/AKfycbzWkerEeWR-3EjY1QW44Az6pj1TjJK9_ktfnrdcgFILlD6Cnqb4z2X97zSknKRJw-i3jw/exec';
  var QUEUE_KEY='rusweo_fix15_error_queue';
  var queueBusy=false;
  var recent={};
  var nativeFetch=typeof window.fetch==='function'?window.fetch.bind(window):null;

  function safe(v,n){
    var s=String(v==null?'':v).replace(/[\u0000-\u001f\u007f]+/g,' ').replace(/\s+/g,' ').trim();
    return s.slice(0,Math.max(1,Number(n||500)));
  }
  function nowId(){return 'rw15_'+Date.now()+'_'+Math.random().toString(36).slice(2,10)}
  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,Math.max(0,Number(ms||0)))})}
  function apiUrl(){
    try{if(typeof window.BACKEND_URL==='string'&&window.BACKEND_URL.trim())return window.BACKEND_URL.trim()}catch(_){ }
    try{if(typeof window.API==='string'&&window.API.trim())return window.API.trim()}catch(_){ }
    return API_FALLBACK;
  }
  function platform(){
    try{if(window.RusWeo&&window.RusWeo.platform&&typeof window.RusWeo.platform.get==='function')return String(window.RusWeo.platform.get()||'web')}catch(_){ }
    try{if(window.UruWayAndroid&&typeof window.UruWayAndroid.getPlatform==='function')return 'android'}catch(_){ }
    try{if(window.Telegram&&window.Telegram.WebApp)return 'telegram'}catch(_){ }
    return 'web';
  }
  function page(){
    try{return safe((location.pathname.split('/').pop()||'index.html')+(location.hash||''),100)}catch(_){return 'app'}
  }
  function auth(){
    var init='',session='';
    try{init=String(window.Telegram&&window.Telegram.WebApp&&window.Telegram.WebApp.initData||'').trim()}catch(_){ }
    try{session=String(localStorage.getItem('uruway_auth_session')||'').trim()}catch(_){ }
    return {init_data:init,session_token:session};
  }
  function user(){
    var u={};
    try{u=(window.Telegram&&window.Telegram.WebApp&&window.Telegram.WebApp.initDataUnsafe&&window.Telegram.WebApp.initDataUnsafe.user)||{}}catch(_){ }
    if(!u||!u.id){
      try{u={id:String(localStorage.getItem('uruway_auth_telegram_user_id')||''),username:String(localStorage.getItem('uruway_auth_username')||''),first_name:String(localStorage.getItem('uruway_auth_first_name')||''),last_name:String(localStorage.getItem('uruway_auth_last_name')||'')}}catch(_){u={}}
    }
    return u||{};
  }
  function device(){
    var ua='';try{ua=String(navigator.userAgent||'')}catch(_){ }
    var out=[];
    try{
      var d=navigator.userAgentData;
      if(d){if(d.platform)out.push(String(d.platform));if(d.mobile)out.push('mobile');if(Array.isArray(d.brands)&&d.brands.length)out.push(d.brands.map(function(x){return x.brand+' '+x.version}).join('/'))}
    }catch(_){ }
    var m=ua.match(/Android\s+([^;\)]+)(?:;\s*([^;\)]+?)(?:\s+Build[^;\)]*)?)?[;\)]/i);
    if(m){out.push('Android '+safe(m[1],40));if(m[2])out.push(safe(m[2],70))}
    else if(/iPhone/i.test(ua)){var ios=ua.match(/OS\s+([0-9_]+)/);out.push('iPhone'+(ios?' iOS '+ios[1].replace(/_/g,'.'):''))}
    else if(/iPad/i.test(ua)){out.push('iPad')}
    else {try{if(navigator.platform)out.push(String(navigator.platform))}catch(_){ }}
    return safe(Array.from(new Set(out.filter(Boolean))).join(' · ')||ua,220);
  }
  function cause(err){
    var s=String(err&&err.message?err.message:err||'').toLowerCase();
    if(/abort|timeout|timed out|не ответил/.test(s))return 'Сервер не ответил вовремя';
    if(/network|failed to fetch|соединени|offline|internet|jsonp/.test(s))return 'Нет стабильной связи с сервером';
    if(/json|unexpected token|некорректн.*ответ/.test(s))return 'Некорректный ответ сервера';
    if(/unauthorized|forbidden|access_denied|401|403/.test(s))return 'Ошибка авторизации';
    if(/native_bridge|bridge/.test(s))return 'Ошибка связи с Android';
    return 'Техническая ошибка приложения';
  }
  function friendly(meta,err){
    meta=meta||{};
    if(meta.friendly)return safe(meta.friendly,260);
    var st=String(meta.stage||meta.action||'').toLowerCase();
    if(/tariff|quote|route/.test(st))return 'Не удалось рассчитать маршрут или стоимость после повторной попытки';
    if(/finance|account|report/.test(st))return 'Не удалось обновить финансовые данные после повторной попытки';
    if(/chat|message|send/.test(st))return 'Не удалось выполнить операцию с сообщением после повторной попытки';
    if(/order|booking/.test(st))return 'Не удалось выполнить операцию с заказом после повторной попытки';
    if(/news/.test(st))return 'Не удалось загрузить данные после повторной попытки';
    return 'Действие не выполнилось после автоматической повторной попытки';
  }
  function queueRead(){try{var x=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return []}}
  function queueWrite(items){try{localStorage.setItem(QUEUE_KEY,JSON.stringify((items||[]).slice(-30)))}catch(_){ }}
  function queuePush(payload){var q=queueRead();q.push(payload);queueWrite(q)}
  function fingerprint(payload){return [payload.page,payload.stage,payload.client_action,payload.error,payload.context].join('|').slice(0,900)}
  function shouldSuppress(payload){
    var f=fingerprint(payload),n=Date.now(),last=Number(recent[f]||0);recent[f]=n;
    Object.keys(recent).forEach(function(k){if(n-Number(recent[k]||0)>60000)delete recent[k]});
    return last&&n-last<12000;
  }
  function basePayload(err,meta){
    meta=meta||{};var u=user();
    return {
      stage:safe(meta.stage||'runtime',100),
      client_action:safe(meta.action||meta.operation||'',120),
      friendly:friendly(meta,err),
      cause:safe(meta.cause||cause(err),180),
      error:safe(err&&err.message?err.message:err||'Неизвестная ошибка',700),
      platform:platform(),page:safe(meta.page||page(),100),device:device(),
      app_version:APP_VERSION,web_revision:WEB_REVISION,
      context:safe(meta.context||meta.order_id||meta.id||'',500),
      route:safe(meta.route||'',500),
      request_signature:safe(meta.request_signature||'',500),
      client_attempt:String(Math.max(1,Number(meta.attempt||meta.client_attempt||2))),
      target_telegram_user_id:safe(meta.target_user_id||'',80),
      target_telegram_username:safe(meta.target_username||'',120),
      local_user_id:safe(u&&u.id||'',80),
      local_username:safe(u&&u.username||'',120),
      queued_at:new Date().toISOString()
    };
  }
  function sendReport(payload){
    return new Promise(function(resolve,reject){
      var a=auth();
      if(!a.init_data&&!a.session_token){reject(new Error('diagnostic_auth_missing'));return}
      var cb='RusWeoErr15_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
      var q=new URLSearchParams();
      q.set('action','client_error_report_v116');q.set('callback',cb);q.set('_',String(Date.now()));
      if(a.init_data)q.set('init_data',a.init_data);if(a.session_token)q.set('session_token',a.session_token);
      Object.keys(payload||{}).forEach(function(k){var v=payload[k];if(v!==undefined&&v!==null&&String(v)!=='')q.set(k,String(v))});
      var sc=document.createElement('script'),done=false,timer=null;
      function clean(){if(timer)clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}try{sc.remove()}catch(_){ }}
      function finish(ok,v){if(done)return;done=true;clean();ok?resolve(v):reject(v instanceof Error?v:new Error(String(v||'diagnostic_failed')))}
      window[cb]=function(d){if(d&&d.ok===true&&d.reported===true)finish(true,d);else finish(false,new Error(String(d&&d.error||'diagnostic_rejected')))};
      sc.async=true;sc.src=apiUrl()+'?'+q.toString();sc.onerror=function(){finish(false,new Error('diagnostic_network'))};
      document.head.appendChild(sc);timer=setTimeout(function(){finish(false,new Error('diagnostic_timeout'))},9000);
    });
  }
  async function reportFinal(err,meta){
    try{if(err&&typeof err==='object'&&err.rwGuardReported===true)return false;if(err&&typeof err==='object')err.rwGuardReported=true}catch(_){ }
    var payload=basePayload(err,meta);
    if(shouldSuppress(payload))return false;
    try{await sendReport(payload);return true}catch(_){queuePush(payload);return false}
  }
  async function flush(){
    if(queueBusy)return;var q=queueRead();if(!q.length)return;queueBusy=true;
    try{var remain=[];for(var i=0;i<q.length;i++){try{await sendReport(q[i])}catch(_){remain.push(q[i])}}queueWrite(remain)}finally{queueBusy=false}
  }
  async function run(operation,meta,opts){
    opts=opts||{};var attempts=Math.max(1,Number(opts.attempts||2)),delay=Math.max(0,Number(opts.delay||300)),last=null;
    for(var i=1;i<=attempts;i++){
      try{return await operation(i)}catch(e){last=e;if(i<attempts){await sleep(delay);continue}}
    }
    if(opts.report!==false)await reportFinal(last,Object.assign({},meta||{},{attempt:attempts}));
    throw last||new Error('operation_failed');
  }
  function parseUrl(input){try{return new URL(typeof input==='string'?input:input&&input.url||'',location.href)}catch(_){return null}}
  function mutationRetrySafe(url){
    if(!url)return false;var action=String(url.searchParams.get('action')||''),mode=String(url.searchParams.get('mode')||'').toLowerCase();
    if(action==='booking_edit_save_v97')return true;
    if(action==='telegram_driver_action'||action==='telegram_driver_send'||action==='driver_finance_action_v95'||action==='telegram_driver_accounting_action'||action==='android_driver_action'||action==='android_driver_send'||action==='android_driver_accounting_action')return true;
    if(action==='telegram_client_orders'&&(mode==='send'||mode==='cancel'))return true;
    if(action==='driver_admin_messages_v116'&&mode==='send')return true;
    return false;
  }
  function readRetrySafe(url){
    if(!url)return true;var action=String(url.searchParams.get('action')||''),mode=String(url.searchParams.get('mode')||'').toLowerCase();
    if(!action)return true;
    if(action==='telegram_client_orders')return mode!=='send'&&mode!=='cancel';
    if(action==='driver_admin_messages_v116')return mode!=='send';
    return ['telegram_driver_access','telegram_driver_orders','telegram_driver_order','telegram_driver_chat','telegram_driver_month_report','telegram_driver_health','driver_finance_report_v95','driver_client_lookup_v72','booking_edit_get_v97','booking_edit_availability_v97','tariff_quote','tariff_probe','availability','discount_status','site_status','health_ping','app_auth_status','app_auth_me','app_review_auth','app_client_orders','driver_partner_leads_v85'].indexOf(action)!==-1;
  }
  function isDiagnosticUrl(url){return !!(url&&String(url.searchParams.get('action')||'')==='client_error_report_v116')}
  function isRetryableResponse(r){return !!(r&&[408,425,429,500,502,503,504].indexOf(Number(r.status))!==-1)}
  function isTechnicalPayload(data){
    if(!data||data.ok!==false)return false;
    var e=String(data.error||data.detail||data.message||'').toLowerCase();
    // These are expected business/state answers, not application faults.
    if(/^(unauthorized|driver_access_denied|booking_not_found|not_found|cancel_not_allowed|chat_closed|empty_message|message_too_long|auth_expired|auth_not_found|revoked)$/.test(e))return false;
    if(/заявка уже обработана|время занято|нельзя отменить|нельзя отметить|текущем статусе нельзя/.test(e))return false;
    return true;
  }
  function payloadError(data){
    return new Error(safe(data&&(data.detail||data.error||data.message)||'Сервер вернул ошибку',700));
  }

  if(nativeFetch){
    window.fetch=async function(input,init){
      init=init||{};var method=String(init.method||(input&&input.method)||'GET').toUpperCase(),url=parseUrl(input),diag=isDiagnosticUrl(url);
      if(diag||String(init.mode||'')==='no-cors'||init.signal)return nativeFetch(input,init);
      var mutationSafe=method==='GET'&&mutationRetrySafe(url);
      var retryable=method==='GET'&&(mutationSafe||readRetrySafe(url));
      var finalInput=input;
      if(mutationSafe&&url){if(!url.searchParams.get('rw_request_id'))url.searchParams.set('rw_request_id',nowId());finalInput=url.toString()}
      if(!retryable){
        try{return await nativeFetch(finalInput,init)}catch(e){await reportFinal(e,{stage:'fetch',action:url&&url.searchParams.get('action')||method,context:url&&url.pathname||'',attempt:1});throw e}
      }
      var first=null;
      try{var r1=await nativeFetch(finalInput,init);if(!isRetryableResponse(r1))return r1;first=new Error('HTTP '+r1.status)}catch(e1){first=e1}
      await sleep(280);
      try{var r2=await nativeFetch(finalInput,init);if(isRetryableResponse(r2)){var e2=new Error('HTTP '+r2.status);await reportFinal(e2,{stage:'fetch',action:url&&url.searchParams.get('action')||method,context:url&&url.pathname||'',attempt:2});return r2}return r2}catch(e2){await reportFinal(e2,{stage:'fetch',action:url&&url.searchParams.get('action')||method,context:url&&url.pathname||'',attempt:2});throw e2}
    };
  }

  window.RusWeo=window.RusWeo||{};
  window.RusWeo.guard={patch:PATCH,run:run,reportFinal:reportFinal,flush:flush,device:device,newRequestId:nowId,isTechnicalPayload:isTechnicalPayload,payloadError:payloadError};

  window.addEventListener('error',function(ev){
    try{
      if(ev&&ev.target&&ev.target!==window){var tag=String(ev.target.tagName||'');if(tag==='SCRIPT'||tag==='LINK')reportFinal(new Error('Не загрузился ресурс: '+safe(ev.target.src||ev.target.href||tag,300)),{stage:'resource_load',action:tag,attempt:1});return}
      var er=ev&&ev.error?ev.error:new Error(String(ev&&ev.message||'JavaScript runtime error'));
      reportFinal(er,{stage:'runtime_js',action:'window.error',context:safe((ev&&ev.filename||'')+':'+(ev&&ev.lineno||''),220),attempt:1});
    }catch(_){ }
  },true);
  window.addEventListener('unhandledrejection',function(ev){try{var r=ev&&ev.reason;reportFinal(r instanceof Error?r:new Error(String(r||'Unhandled promise rejection')),{stage:'runtime_promise',action:'unhandledrejection',attempt:1})}catch(_){ }});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)flush().catch(function(){})},true);
  window.addEventListener('online',function(){flush().catch(function(){})});
  setTimeout(function(){flush().catch(function(){})},2500);
  setInterval(function(){flush().catch(function(){})},45000);
})();
