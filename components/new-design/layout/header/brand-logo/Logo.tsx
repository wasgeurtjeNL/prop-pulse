import Image from 'next/image'

const Logo: React.FC = () => {
  return (
    <Image
      src='https://ik.imagekit.io/slydc8kod/logo_psm_300.webp?tr=w-150,q-90,f-auto'
      alt='PSM Phuket Real Estate Logo'
      width={150}
      height={68}
      priority={true}
    />
  )
}

export default Logo
