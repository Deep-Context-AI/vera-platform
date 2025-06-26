# API Client Documentation

This directory contains the centralized API client for the Vera Platform. The API client provides a consistent interface for interacting with the Supabase database.

## Structure

```
src/lib/api/
├── index.ts          # Main export file
├── applications.ts   # Applications API methods
└── README.md        # This documentation
```

## Usage

### Basic Import

```typescript
import { ApplicationsAPI } from "@/lib/api";
```

### Using the React Hook (Recommended)

```typescript
import { useApplications } from "@/hooks/useApplications";

function MyComponent() {
  const { applications, loading, error, updateStatus, refresh } =
    useApplications({
      status: "SUBMITTED",
      limit: 20,
    });

  // Component logic here
}
```

### Direct API Usage

```typescript
import { ApplicationsAPI } from "@/lib/api";

// Fetch all applications
const { data, error } = await ApplicationsAPI.getApplications({
  status: "SUBMITTED",
  limit: 50,
});

// Fetch single application
const { data: application } = await ApplicationsAPI.getApplication(123);

// Update application status
const { data: updated } = await ApplicationsAPI.updateApplicationStatus(
  123,
  "APPROVED"
);
```

## ApplicationsAPI Methods

### `getApplications(options?)`

Fetch multiple applications with optional filtering and pagination.

**Options:**

- `status?: ApplicationStatus` - Filter by status
- `provider_id?: number` - Filter by provider
- `limit?: number` - Limit results
- `offset?: number` - Pagination offset
- `isServer?: boolean` - Use server-side client

### `getApplication(id, isServer?)`

Fetch a single application by ID.

### `createApplication(data, isServer?)`

Create a new application.

### `updateApplication(data, isServer?)`

Update an existing application.

### `deleteApplication(id, isServer?)`

Delete an application.

### `updateApplicationStatus(id, status, isServer?)`

Update only the status of an application.

### `searchApplications(searchTerm, isServer?)`

Search applications by NPI number or license number.

### `getRecentApplications(limit?, isServer?)`

Get applications from the last 30 days.

### `getApplicationsByStatus(isServer?)`

Get count of applications grouped by status.

## Types

All TypeScript types are defined in `src/types/applications.ts`:

- `Application` - Main application interface
- `ApplicationStatus` - Union type for status values
- `WorkHistoryEntry` - Work history entry structure
- `MalpracticeInsurance` - Malpractice insurance structure
- `CreateApplicationRequest` - For creating new applications
- `UpdateApplicationRequest` - For updating applications

## Error Handling

All API methods return a consistent structure:

```typescript
{
  data: T | null,
  error: any
}
```

Always check for errors before using the data:

```typescript
const { data, error } = await ApplicationsAPI.getApplications();

if (error) {
  console.error("Failed to fetch applications:", error);
  return;
}

// Use data safely
console.log("Applications:", data);
```

## Server vs Client Usage

The API client supports both server-side and client-side usage:

```typescript
// Client-side (default)
const { data } = await ApplicationsAPI.getApplications();

// Server-side (in Server Components, API routes, etc.)
const { data } = await ApplicationsAPI.getApplications({ isServer: true });
```

## Adding New API Modules

To add a new API module (e.g., for practitioners):

1. Create the types in `src/types/practitioners.ts`
2. Create the API class in `src/lib/api/practitioners.ts`
3. Export it from `src/lib/api/index.ts`
4. Create corresponding hooks in `src/hooks/usePractitioners.ts`

Example structure:

```typescript
// src/lib/api/practitioners.ts
export class PractitionersAPI {
  static async getPractitioners() {
    // Implementation
  }
}

// src/lib/api/index.ts
export { PractitionersAPI } from "./practitioners";
```

## Best Practices

1. **Use the React hooks** when possible - they handle loading states, error handling, and caching
2. **Handle errors gracefully** - Always check for errors and provide user feedback
3. **Use TypeScript types** - Import and use the provided types for better development experience
4. **Server-side rendering** - Use `isServer: true` for server-side operations
5. **Pagination** - Use limit and offset for large datasets
6. **Search optimization** - Use the search methods for better performance than client-side filtering

## Example Component

See `src/components/ApplicationsTable.tsx` for a complete example of how to use the API client with React hooks.
