(function () {
  // Soft client-side gate: keeps casual visitors/search bots off the site until
  // they enter the password on /password.html. Not real security — the check
  // happens in the browser, so anyone determined can view-source around it.
  if (localStorage.getItem('site_unlocked') === 'true') return;
  if (location.pathname === '/password.html') return;

  var redirect = encodeURIComponent(location.pathname + location.search);
  location.replace('/password.html?redirect=' + redirect);
})();
