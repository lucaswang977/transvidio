import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export type ProjectRelatedUser = {
  id: string,
  name: string | null,
  image: string | null
}

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.project.findMany({
      include: {
        users: {
          select: {
            user: { select: { id: true, name: true, image: true } }
          }
        },
        documents: true
      }
    })
  }),
});
