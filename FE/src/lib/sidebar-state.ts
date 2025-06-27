const SIDEBAR_COOKIE_NAME = 'sidebar-open';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function setSidebarStateCookie(isOpen: boolean) {
  if (typeof document !== 'undefined') {
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${isOpen}; max-age=${SIDEBAR_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
  }
}

export function getSidebarStateFromCookieString(cookieString?: string): boolean {
  if (!cookieString) return true;
  
  const match = cookieString.match(new RegExp(`${SIDEBAR_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] === 'true' : true;
}

export function getSidebarStateFromDocument(): boolean {
  if (typeof document === 'undefined') return true;
  
  const match = document.cookie.match(new RegExp(`${SIDEBAR_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] === 'true' : true;
}

export { SIDEBAR_COOKIE_NAME }; 