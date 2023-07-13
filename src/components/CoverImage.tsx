import Image from "next/image"
import { useTheme } from 'next-themes'

const CoverImage = () => {
  const { theme } = useTheme()

  return (
    <>
      <Image
        src={theme === "dark" ? "/img/cover-dark.png" : "/img/cover-light.png"}
        alt="Login image"
        width={480}
        height={480}
        loading="lazy"
      />
    </>
  );
};

export default CoverImage;
