/**
 * Shared in-app navigation util that updates query/hash parameters dynamically without full page reload.
 * Also dispatches a 'popstate' event so that listening React components can update their layout state.
 */
export function navigateTo(searchParams: string, path: string = '/') {
  // Clear primary conflicting navigation parameters on navigation
  const url = new URL(window.location.origin + path);
  
  if (searchParams) {
    const cleanParamsString = searchParams.startsWith('?') ? searchParams.slice(1) : searchParams;
    const params = new URLSearchParams(cleanParamsString);
    params.forEach((val, key) => {
      url.searchParams.set(key, val);
    });
  }
  
  window.history.pushState({}, '', url.pathname + url.search + url.hash);
  window.dispatchEvent(new Event('popstate'));
}

export function getNavigationState() {
  const search = window.location.search;
  const hash = window.location.hash;
  const path = window.location.pathname;

  const isSellerLogin = 
    path.startsWith('/admin') || 
    search.includes('admin=true') || 
    search.includes('seller-login=true') || 
    search.includes('seller-productportal=true') || 
    hash.includes('#admin') || 
    hash.includes('#seller-login') ||
    hash.includes('#seller-productportal');

  const isSellerSignup = 
    search.includes('seller-signup=true') || 
    search.includes('seller-apply=true') || 
    hash.includes('#seller-signup') || 
    hash.includes('#seller-apply');

  return {
    isSellerLogin,
    isSellerSignup,
    isClient: !isSellerLogin && !isSellerSignup
  };
}
