/** Current time in ms. Server components read the clock through this (keeps render code free of direct impure calls). */
export const nowMs = () => Date.now();
