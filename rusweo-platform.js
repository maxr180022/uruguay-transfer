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
