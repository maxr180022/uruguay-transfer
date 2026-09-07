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
