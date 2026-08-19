/* HOY 2.47.0 — fail-closed privacy release configuration */
(function(){
  const config=Object.freeze({
    schemaVersion:'1',
    noticeVersion:'rt008-draft-2026-08-19',
    releaseReady:false,
    analyticsEnabled:false,
    controllerName:'',
    controllerAddress:'',
    privacyContact:'',
    analyticsRetentionDays:null
  });

  function productionHost(){
    return String(window.location?.hostname||'').toLowerCase()==='hapo3005.github.io';
  }

  function productionReady(){
    return config.releaseReady===true &&
      config.analyticsEnabled===true &&
      typeof config.controllerName==='string' && config.controllerName.trim().length>1 &&
      typeof config.controllerAddress==='string' && config.controllerAddress.trim().length>4 &&
      typeof config.privacyContact==='string' && config.privacyContact.trim().length>3 &&
      Number.isInteger(config.analyticsRetentionDays) && config.analyticsRetentionDays>0;
  }

  window.HOY_PRIVACY_CONFIG=config;
  window.hoyPrivacyProductionHost247=productionHost;
  window.hoyPrivacyProductionReady247=productionReady;
})();
