import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { api } from "~/utils/api";
import { Flowbite } from "flowbite-react";
import { Lato } from "next/font/google";
import "~/styles/globals.css";
import flowbiteTheme from "../theme";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"]
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <main className={lato.className}>
        <Flowbite theme={{ theme: flowbiteTheme }}>
          <Component {...pageProps} />
        </Flowbite>
      </main>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
