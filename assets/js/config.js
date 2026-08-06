window.DAC_CONFIG = {

  /* ---- the three headline numbers ------------------------------------- */
  members      : 250,                       // "250+ active members"
  partners     : 7,                         // "7+ industry partners"
  events       : 8,                         // "8+ workshops and events"

  /* ---- where things point --------------------------------------------- */
  email        : "dac@dgu.ac.in",
  dashboardUrl : "https://dgu-dac.base44.app/",

  /* ---- Google Sheet (same one behind every form on the site) ----------- */
  sheetUrl     : "https://script.google.com/macros/s/AKfycbwPpqKv_R5hyM_vpcILTrARcLee4RUxjBwL_mM78sJXjJnyHr0ZkXdWt4elsKNICNPi/exec",
  subscribeTab : "Subscribers"              // tab name new subscribers land in
};

/* Fills any element marked  data-dac="members"  with the number above.
   Used by the plain-HTML stat strips. Nothing to change here. */
document.addEventListener('DOMContentLoaded', function () {
  var c = window.DAC_CONFIG || {};
  document.querySelectorAll('[data-dac]').forEach(function (el) {
    var v = c[el.getAttribute('data-dac')];
    if (v !== undefined) el.textContent = v + (el.dataset.dacPlus === 'no' ? '' : '+');
  });
});
