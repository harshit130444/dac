(function(){
  /* ══════════════════════════════════════════════════════════════
     Where subscribers land.
     Same Apps Script / same spreadsheet as every other DAC form.
     "Form" is the tab name — change SHEET_TAB below to file
     subscribers into a different tab. Columns build themselves.
     ══════════════════════════════════════════════════════════════ */
  var SHEET_URL = (window.DAC_CONFIG || {}).sheetUrl || 'https://script.google.com/macros/s/AKfycbwPpqKv_R5hyM_vpcILTrARcLee4RUxjBwL_mM78sJXjJnyHr0ZkXdWt4elsKNICNPi/exec';
  var SHEET_TAB = (window.DAC_CONFIG || {}).subscribeTab || 'Subscribers';

  var $ = function(id){ return document.getElementById(id); };
  var tab=$('dacxTab'), ov=$('dacxOv'), card=ov?ov.querySelector('.dacx-card'):null,
      form=$('dacxForm'), name=$('dacxName'), mail=$('dacxEmail'),
      err=$('dacxErr'), go=$('dacxGo'), pane=$('dacxPane'), done=$('dacxDone');
  if(!tab||!ov||!form) return;

  var sending=false, lastFocus=null;

  function reset(){
    err.textContent='';
    name.classList.remove('bad');
    mail.classList.remove('bad');
    if(done.style.display === 'block'){
      done.style.display='none';
      pane.style.display='';
      name.value=''; mail.value='';
      sending=false; go.disabled=false; go.textContent='Subscribe';
    }
  }

  function open(prefill){
    lastFocus = document.activeElement;
    reset();
    if(prefill && !mail.value) mail.value = prefill;
    ov.classList.add('on');
    document.body.style.overflow='hidden';
    setTimeout(function(){ (name.value ? mail : name).focus(); }, 60);
  }
  function close(){
    ov.classList.remove('on');
    document.body.style.overflow='';
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }

  tab.onclick = function(){ open(); };
  $('dacxX').onclick = close;
  $('dacxClose2').onclick = close;
  ov.addEventListener('click', function(e){ if(e.target===ov) close(); });
  addEventListener('keydown', function(e){ if(e.key==='Escape' && ov.classList.contains('on')) close(); });

  /* keep tab focus inside the dialog while it's open */
  ov.addEventListener('keydown', function(e){
    if(e.key!=='Tab' || !card) return;
    var f = card.querySelectorAll('button,input,[href]');
    var vis = [];
    for(var i=0;i<f.length;i++){ if(f[i].offsetParent!==null) vis.push(f[i]); }
    if(!vis.length) return;
    var first=vis[0], last=vis[vis.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  });

  function fail(msg, field){
    err.textContent = msg;
    if(field){ field.classList.add('bad'); field.focus(); }
  }
  name.oninput = function(){ name.classList.remove('bad'); err.textContent=''; };
  mail.oninput = function(){ mail.classList.remove('bad'); err.textContent=''; };

  form.onsubmit = function(e){
    e.preventDefault();
    if(sending) return;
    err.textContent=''; name.classList.remove('bad'); mail.classList.remove('bad');

    var n = name.value.trim(), m = mail.value.trim();
    if(n.length < 2)                          return fail('Enter your name so we know who to greet.', name);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) return fail('That email doesn\u2019t look right. Check it and try again.', mail);

    sending = true;
    go.disabled = true;
    go.textContent = 'Subscribing\u2026';

    fetch(SHEET_URL, {
      method:'POST',
      mode:'no-cors',                       /* no custom headers -> no CORS preflight */
      body: JSON.stringify({
        "Form":         SHEET_TAB,
        "Name":         n,
        "Email":        m,
        "Page":         location.pathname,
        "Submitted At": new Date().toLocaleString()
      })
    }).then(function(){
      $('dacxDoneMail').textContent = m;
      pane.style.display = 'none';
      done.style.display = 'block';
      $('dacxClose2').focus();
    }).catch(function(){
      sending = false;
      go.disabled = false;
      go.textContent = 'Subscribe';
      fail('That didn\u2019t go through. Check your connection and try again.');
    });
  };

  /* the footer "Get notified" box, where it exists, feeds the same list */
  var nl = $('nl'), nlMail = $('nlMail');
  function hijackNewsletter(){
    if(!nl) return;
    nl.onsubmit = function(e){
      e.preventDefault();
      open(nlMail ? nlMail.value.trim() : '');
    };
  }
  hijackNewsletter();
  addEventListener('load', hijackNewsletter);
})();
