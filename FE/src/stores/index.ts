// Store composition and utilities
export { useApplicationsStore } from './applicationsStore';
export * from './agentStore';

// Future stores can be added here:
// export { usePractitionersStore } from './practitionersStore';
// export { useProvidersStore } from './providersStore';
// export { useCommitteeStore } from './committeeStore';

// Store utilities for cross-store communication
export interface StoreSubscription {
  unsubscribe: () => void;
}

// Helper for creating cross-store subscriptions
export function createCrossStoreSubscription<T>(
  store: any,
  selector: (state: any) => T,
  callback: (value: T) => void
): StoreSubscription {
  const unsubscribe = store.subscribe(
    selector,
    callback
  );
  
  return { unsubscribe };
}

// Global store reset utility (useful for logout, testing, etc.)
export function resetAllStores() {
  // Add store resets here as you create more stores
  // useApplicationsStore.getState().reset();
  // usePractitionersStore.getState().reset();
}

// Store hydration utility for SSR
export function hydrateStores(initialData: Record<string, any>) {
  // Hydrate stores with server-side data
  // This is useful for Next.js SSR scenarios
  
  if (initialData.applications) {
    // useApplicationsStore.setState(initialData.applications);
  }
  
  // Add more store hydration as needed
} 