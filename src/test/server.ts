import { setupServer } from "msw/node";

/** The mock API for component tests. Each test adds the handlers it needs with `server.use`. */
export const server = setupServer();
