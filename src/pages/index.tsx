// TODO: 
// 1. User management & user role
//  1.1 (OK) User registeration time should be recorded.
//  1.2 (OK) User can assign a name for himself when signing up.
// 2. Document and project management
//  2.1 (OK) Project & document & user data schema definition.
//  2.2 (OK) Project creation & management & permission control
//  2.3 Document creation & management & claim / permission control / state control
//  2.4 Document editors: intro, curriculum, quiz, doc support
// 3. File upload support
//  3.1 Attachment editor
// 4. File import & auto transcript/translate
//  4.1 Course intro, curriculum, supplement list import
// 5. Video player & subtitle editor
// 6. Test & optimize
// 7. First version release
// 8. Database migrate test
// 9. Reset / change password
// 10. Activities on Dashboard
// 11. Logging on vercel

import { useRouter } from "next/router"
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import type { NextPageWithLayout } from './_app'
import { Logo } from "~/components/logo-with-name";
import { Separator } from "~/components/ui/separator";
import CoverImage from "~/components/CoverImage";

const Home: NextPageWithLayout = () => {
  const router = useRouter();
  const { status: status } = useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center space-y-12">
      <div className="flex flex-col items-center">
        <CoverImage />
        <Label className="text-gray-400">We get translation job done.</Label>
      </div>
      <div className="flex flex-col items-center space-y-4">
        <Logo />
        {
          status === "authenticated" ?
            <Button
              className="w-32"
              onClick={() => router.push("/admin")}
            >Enter App</Button>
            :
            <Button
              className="w-32"
              onClick={async () => { await router.push("/signin") }}
              disabled={status === "loading"}>
              Sign in
            </Button>
        }
      </div>
      <footer className="flex space-x-2 items-center">
        <Label className="text-xs text-gray-500 italic">v0.1.7</Label>
        <Separator orientation="vertical" />
        <Label className="text-xs text-gray-500">&copy;&nbsp;Transvid.io 2023-2024</Label>
      </footer>
    </main>
  );
};

Home.getTitle = () => "Transvid.io"

export default Home;
