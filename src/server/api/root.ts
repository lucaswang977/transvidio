import { userRouter } from "~/server/api/routers/user";
import { projectRouter } from "~/server/api/routers/project";
import { documentRouter } from "~/server/api/routers/document";
import { uploadRouter } from "~/server/api/routers/upload";
import { configRouter } from "~/server/api/routers/config";
import { incomeRouter } from "~/server/api/routers/income";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  project: projectRouter,
  document: documentRouter,
  upload: uploadRouter,
  config: configRouter,
  income: incomeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
