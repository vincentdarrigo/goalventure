import { QueryClient } from '@tanstack/react-query';

// Used only for external service-adapter calls (e.g. location discovery).
// Local SQLite reads go through Drizzle's live-query hooks instead.
export const queryClient = new QueryClient();
