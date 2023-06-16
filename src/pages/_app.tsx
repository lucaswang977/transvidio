import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { AppInitialProps } from "next/app";
import { api } from "~/utils/api";
import { Lato } from "next/font/google";
import "~/styles/globals.css";
import Head from "next/head";
import * as React from "react";
import { NextPage } from "next";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"]
});

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: React.ReactElement) => React.ReactNode,
  getTitle?: () => string
}

type AppProps = AppInitialProps & {
  session: Session | null
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

function MyApp(
  { Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout
) {
  const getLayout = Component.getLayout ?? ((page) => page)
  const getTitle = Component.getTitle ?? (() => "Transvid.io")
  return (
    <SessionProvider session={session}>
      <Head>
        <title>{getTitle()}</title>
        <meta name="description" content="Transvidio: Online translation collaborative platform." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {getLayout(
        <main className={lato.className}>
          <Component {...pageProps} />
        </main>
      )}
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
