import Image from 'next/image'

const Logo: React.FC = () => {
  return (
    <Image
      src='https://ik.imagekit.io/slydc8kod/logo_psm_300.webp?updatedAt=1765040666333'
      alt='logo'
      width={150}
      height={68}
      unoptimized={true}
    />
  )
}

export default Logo
