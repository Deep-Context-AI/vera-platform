# Zustand State Management Implementation

This directory contains our Zustand-based state management implementation for table data and UI state management.

## Why Zustand Over React Context?

Based on our research from [Medium article on React State Management](https://medium.com/globant/react-state-management-b0c81e0cbbf3), we chose Zustand for the following reasons:

### Performance Benefits

- **Selective Subscriptions**: Components only re-render when specific slices of state change
- **No Provider Hell**: No need to wrap components in context providers
- **Faster than Context**: Direct subscriptions to state slices prevent unnecessary re-renders

### Developer Experience

- **Automatic State Merging**: No need to spread previous state manually
- **Less Boilerplate**: Simpler than Redux with no action creators or reducers
- **TypeScript First**: Excellent TypeScript support out of the box

### Features

- **Built-in Middleware**: Redux DevTools, persistence, and more
- **Composable**: Easy to combine multiple stores
- **Flexible**: Not opinionated about how you structure your state

## Architecture

```
src/stores/
├── index.ts                 # Store composition and utilities
├── applicationsStore.ts     # Applications state management
├── README.md               # This documentation
└── [future stores]         # Other table stores
```

## Usage Examples

### Basic Store Usage

```typescript
import { useApplicationsStore } from '@/stores';

function MyComponent() {
  // Subscribe to specific slices - only re-renders when these change
  const applications = useApplicationsStore(state => state.applications);
  const loading = useApplicationsStore(state => state.loading);

  // Subscribe to actions
  const fetchApplications = useApplicationsStore(state => state.fetchApplications);

  return (
    // Your component JSX
  );
}
```

### Advanced Selective Subscription

```typescript
// Only re-renders when applications array changes
const applications = useApplicationsStore((state) => state.applications);

// Multiple subscriptions - component re-renders when ANY of these change
const { applications, loading, error } = useApplicationsStore((state) => ({
  applications: state.applications,
  loading: state.loading,
  error: state.error,
}));

// Computed values - only re-renders when the computed value changes
const submittedCount = useApplicationsStore(
  (state) =>
    state.applications.filter((app) => app.status === "SUBMITTED").length
);
```

### Store Actions

```typescript
const {
  fetchApplications,
  updateApplicationStatus,
  setFilters,
  searchApplications,
} = useApplicationsStore((state) => ({
  fetchApplications: state.fetchApplications,
  updateApplicationStatus: state.updateApplicationStatus,
  setFilters: state.setFilters,
  searchApplications: state.searchApplications,
}));

// Use actions
await fetchApplications();
await updateApplicationStatus(123, "APPROVED");
setFilters({ status: "SUBMITTED" });
```

## Store Features

### 1. Data Management

- CRUD operations for applications
- Optimistic updates
- Error handling with user-friendly messages

### 2. UI State

- Loading states
- Error states
- Selected items

### 3. Filtering & Search

- Status filtering
- Search functionality
- Filter persistence

### 4. Pagination

- Page-based pagination
- Load more functionality
- Total count tracking

### 5. Persistence

- Filter and pagination state persisted to sessionStorage
- Automatic restoration on page reload

### 6. Developer Tools

- Redux DevTools integration
- State debugging and time travel

## Middleware Used

### 1. DevTools Middleware

```typescript
import { devtools } from "zustand/middleware";

export const useApplicationsStore = create(
  devtools(
    (set, get) => ({
      // Store implementation
    }),
    { name: "applications-store" }
  )
);
```

### 2. Persist Middleware

```typescript
import { persist, createJSONStorage } from "zustand/middleware";

export const useApplicationsStore = create(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: "applications-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination,
      }),
    }
  )
);
```

## Best Practices

### 1. Selective Subscriptions

```typescript
// ✅ Good - Only subscribes to specific slice
const applications = useApplicationsStore((state) => state.applications);

// ❌ Bad - Subscribes to entire store
const store = useApplicationsStore();
```

### 2. Action Organization

```typescript
// ✅ Good - Group related actions
const { updateStatus, deleteApplication } = useApplicationsStore((state) => ({
  updateStatus: state.updateApplicationStatus,
  deleteApplication: state.deleteApplication,
}));

// ❌ Bad - Individual subscriptions for each action
const updateStatus = useApplicationsStore(
  (state) => state.updateApplicationStatus
);
const deleteApplication = useApplicationsStore(
  (state) => state.deleteApplication
);
```

### 3. Error Handling

```typescript
// ✅ Good - Always handle errors in actions
const createApplication = async (data) => {
  try {
    const result = await ApplicationsAPI.createApplication(data);
    if (result.error) {
      set({ error: result.error.message });
      return null;
    }
    // Update state with success
  } catch (err) {
    set({ error: "Unexpected error occurred" });
  }
};
```

## Performance Tips

### 1. Use Computed Selectors

```typescript
// ✅ Good - Computed selector only re-renders when result changes
const submittedApps = useApplicationsStore((state) =>
  state.applications.filter((app) => app.status === "SUBMITTED")
);
```

### 2. Avoid Object Creation in Selectors

```typescript
// ❌ Bad - Creates new object on every render
const data = useApplicationsStore((state) => ({
  applications: state.applications,
  loading: state.loading,
}));

// ✅ Good - Use individual subscriptions or useMemo
const applications = useApplicationsStore((state) => state.applications);
const loading = useApplicationsStore((state) => state.loading);
```

## Adding New Stores

To add a new store (e.g., for practitioners):

1. **Create the store file**: `src/stores/practitionersStore.ts`
2. **Define the interface**: Similar to `ApplicationsState`
3. **Implement the store**: Use the same pattern as `applicationsStore.ts`
4. **Export from index**: Add to `src/stores/index.ts`
5. **Create components**: Use the same pattern as `ApplicationsTable.tsx`

## Comparison with React Context

| Feature        | Zustand                    | React Context                      |
| -------------- | -------------------------- | ---------------------------------- |
| Performance    | ✅ Selective subscriptions | ❌ Re-renders all consumers        |
| Boilerplate    | ✅ Minimal                 | ❌ Requires providers/reducers     |
| TypeScript     | ✅ Excellent support       | ⚠️ Requires extra setup            |
| DevTools       | ✅ Built-in Redux DevTools | ❌ No built-in tools               |
| Persistence    | ✅ Built-in middleware     | ❌ Manual implementation           |
| Learning Curve | ✅ Simple API              | ⚠️ Context + useReducer complexity |
| Bundle Size    | ✅ ~1.2KB                  | ✅ Built into React                |

## Migration from React Hooks

If you were using our previous `useApplications` hook:

```typescript
// Old way with custom hook
const { applications, loading, updateStatus } = useApplications({
  status: "SUBMITTED",
});

// New way with Zustand
const applications = useApplicationsStore((state) => state.applications);
const loading = useApplicationsStore((state) => state.loading);
const updateStatus = useApplicationsStore(
  (state) => state.updateApplicationStatus
);

// Set filters on mount or when needed
useEffect(() => {
  useApplicationsStore.getState().setFilters({ status: "SUBMITTED" });
}, []);
```

## Testing

```typescript
// Reset store state before each test
beforeEach(() => {
  useApplicationsStore.getState().reset();
});

// Test store actions
test("should update application status", async () => {
  const store = useApplicationsStore.getState();
  await store.updateApplicationStatus(123, "APPROVED");

  const application = store.applications.find((app) => app.id === 123);
  expect(application?.status).toBe("APPROVED");
});
```

This implementation provides a robust, performant, and developer-friendly state management solution for your table-heavy application.
