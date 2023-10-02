import { useRouter } from "next/router"
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import type { NextPageWithLayout } from './_app'
import { Logo } from "~/components/logo-with-name";
import { Separator } from "~/components/ui/separator";
import CoverImage from "~/components/cover-image";

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
        <Label className="text-xs text-gray-500 italic">v0.1.12</Label>
        <Separator orientation="vertical" />
        <Label className="text-xs text-gray-500">&copy;&nbsp;Transvid.io 2023-2024</Label>
      </footer>
    </main>
  );
};

Home.getTitle = () => "Transvid.io"

export default Home;
