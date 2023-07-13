import Image from "next/image"
import { useTheme } from 'next-themes'
import * as React from "react"

const CoverImage = () => {
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => setLoaded(true), []);
  const { resolvedTheme } = useTheme()
  let src

  switch (resolvedTheme) {
    case 'light':
      src = '/img/cover-light.png'
      break
    case 'dark':
      src = '/img/cover-dark.png'
      break
    default:
      src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      break
  }

  return (
    <>
      {loaded &&
        <Image
          src={src}
          alt="Cover image"
          width={480}
          height={480}
        />
      }
    </>
  );
};

export default CoverImage;
