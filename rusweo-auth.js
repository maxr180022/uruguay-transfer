/* RusWeo 3.0 shared auth facade.
   Existing 2.8.2 flows remain authoritative in Phase 1. */
(function(){
  'use strict';

  window.RusWeo=window.RusWeo||{};
  window.RusWeo.auth=window.RusWeo.auth||{};

  window.RusWeo.auth.describe=function(){
    var ctx=
      typeof window.RusWeo.auth.getContext==='function'
        ? window.RusWeo.auth.getContext()
        : {};

    var role='';
    try{
      role=String(localStorage.getItem('uruway_auth_role')||'');
    }catch(e){}

    return {
      platform:ctx.platform||'browser',
      role:role||'unknown',
      hasTelegramInitData:!!ctx.init_data,
      hasAndroidSession:!!ctx.session_token
    };
  };
})();
