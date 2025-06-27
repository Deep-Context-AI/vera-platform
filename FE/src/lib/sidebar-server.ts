import { cookies } from 'next/headers';
import { SIDEBAR_COOKIE_NAME } from './sidebar-state';

export async function getSidebarState(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sidebarCookie = cookieStore.get(SIDEBAR_COOKIE_NAME);
    return sidebarCookie?.value === 'true';
  } catch {
    // Default to open if we can't read cookies
    return true;
  }
} 