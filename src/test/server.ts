import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** MSW server for use in Vitest. Import in test files that need API mocking. */
export const server = setupServer(...handlers);
