import { createPalariEnvironmentAtoms } from "@t3tools/client-runtime/state/palari";

import { connectionAtomRuntime } from "../connection/runtime";

export const palariEnvironment = createPalariEnvironmentAtoms(connectionAtomRuntime);
