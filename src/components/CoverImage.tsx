import Image from "next/image"
import { useTheme } from 'next-themes'

const CoverImage = () => {
  const { resolvedTheme } = useTheme()
  console.log(resolvedTheme)

  return (
    <>
      <Image
        src={resolvedTheme === "dark" ? "/img/cover-dark.png" : "/img/cover-light.png"}
        alt="Login image"
        width={480}
        height={480}
      />
    </>
  );
};

export default CoverImage;
