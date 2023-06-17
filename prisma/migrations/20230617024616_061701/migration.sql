-- DropForeignKey
ALTER TABLE "ProjectsOfUsers" DROP CONSTRAINT "ProjectsOfUsers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectsOfUsers" DROP CONSTRAINT "ProjectsOfUsers_userId_fkey";

-- AddForeignKey
ALTER TABLE "ProjectsOfUsers" ADD CONSTRAINT "ProjectsOfUsers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectsOfUsers" ADD CONSTRAINT "ProjectsOfUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
