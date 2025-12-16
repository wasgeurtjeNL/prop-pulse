'use client'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const reset = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      message: '',
    })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setSubmitError(null)
    try {
      const response = await fetch('https://formsubmit.co/ajax/bhainirav772@gmail.com', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          message: formData.message,
        }),
      })

      const data = (await response.json()) as { success?: boolean }
      setSubmitted(Boolean(data?.success))
      reset()
    } catch {
      setSubmitted(false)
      setSubmitError('Something went wrong while sending your message. Please try again.')
    }
  }

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        setSubmitted(false)
      }, 10000) 

      return () => clearTimeout(timer)
    }
  }, [submitted])

  return (
    <div className='container max-w-8xl mx-auto px-5 2xl:px-0 pt-20 lg:pt-24 pb-8 md:pb-10'>
      <div className='mb-16'>
        <div className='flex gap-2.5 items-center justify-center mb-3'>
          <span>
            <Icon
              icon={'ph:house-simple-fill'}
              width={20}
              height={20}
              className='text-primary'
            />
          </span>
          <p className='text-base font-semibold text-badge dark:text-white/90'>
            Contact PSM Phuket
          </p>
        </div>
        <div className='text-center'>
          <h3 className='text-4xl sm:text-52 font-medium tracking-tighter text-black dark:text-white mb-3 leading-10 sm:leading-14'>
            Ready to Start Your Thailand Property Journey?
          </h3>
          <p className='text-xm font-normal tracking-tight text-black/50 dark:text-white/50 leading-6'>
            Whether you're looking for a beachfront villa in Phuket, an investment condo in Pattaya, 
            or need property management services, our multilingual team is here to help you every step of the way.
          </p>
        </div>
      </div>

      {/* form */}
      <div className='border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-xl dark:shadow-white/10'>
        <div className='flex flex-col lg:flex-row lg:items-center gap-12'>
          <div className='relative w-full max-w-[497px]'>
            <Image
              src={'/images/contactUs/contactUs.jpg'}
              alt='wall'
              width={497}
              height={535}
              priority
              sizes="(max-width: 1024px) 100vw, 497px"
              className='rounded-2xl brightness-50 w-full h-auto'
              unoptimized={true}
            />
            <div className='absolute top-6 left-6 lg:top-12 lg:left-12 flex flex-col gap-2'>
              <h5 className='text-xl xs:text-2xl mobile:text-3xl font-medium tracking-tight text-white'>
                Get In Touch With Us
              </h5>
              <p className='text-sm xs:text-base mobile:text-xm font-normal text-white/80'>
                Schedule a property viewing, request a consultation, or ask about 
                our property management services. We're here to help!
              </p>
            </div>
            <div className='absolute bottom-6 left-6 lg:bottom-12 lg:left-12 flex flex-col gap-4 text-white'>
              <Link href={'tel:+66812345678'} className='w-fit'>
                <div className='flex items-center gap-4 group w-fit'>
                  <Icon icon={'ph:phone'} width={32} height={32} />
                  <p className='text-sm xs:text-base mobile:text-xm font-normal group-hover:text-primary'>
                    +66 (0)81 234 5678
                  </p>
                </div>
              </Link>
              <Link href={'mailto:info@psmphuket.com'} className='w-fit'>
                <div className='flex items-center gap-4 group w-fit'>
                  <Icon icon={'ph:envelope-simple'} width={32} height={32} />
                  <p className='text-sm xs:text-base mobile:text-xm font-normal group-hover:text-primary'>
                    info@psmphuket.com
                  </p>
                </div>
              </Link>
              <div className='flex items-center gap-4'>
                <Icon icon={'ph:map-pin'} width={32} height={32} />
                <p className='text-sm xs:text-base mobile:text-xm font-normal'>
                  Phuket & Pattaya, Thailand
                </p>
              </div>
            </div>
          </div>
          <div className='flex-1/2'>
            <form onSubmit={handleSubmit}>
              <div className='flex flex-col gap-8'>
                <div className='flex flex-col lg:flex-row gap-6'>
                  <input
                    type='text'
                    name='name'
                    id='name'
                    autoComplete='name'
                    placeholder='Name*'
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className='px-6 py-3.5 border border-black/10 dark:border-white/10 rounded-full outline-primary focus:outline w-full'
                  />
                  <input
                    type='number'
                    name='mobile'
                    id='mobile'
                    autoComplete='mobile'
                    placeholder='Phone number*'
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className='px-6 py-3.5 border border-black/10 dark:border-white/10 rounded-full outline-primary focus:outline w-full'
                  />
                </div>
                <input
                  type='email'
                  name='email'
                  id='email'
                  autoComplete='email'
                  placeholder='Email address*'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className='px-6 py-3.5 border border-black/10 dark:border-white/10 rounded-full outline-primary focus:outline'
                />
                <textarea
                  rows={8}
                  cols={50}
                  name='message'
                  id='message'
                  placeholder='Write here your message'
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className='px-6 py-3.5 border border-black/10 dark:border-white/10 rounded-2xl outline-primary focus:outline'></textarea>
                <button className='px-8 py-4 rounded-full bg-primary text-white text-base font-semibold w-full mobile:w-fit hover:cursor-pointer hover:bg-dark duration-300'>
                  Send message
                </button>
              </div>
              {submitted && (
                <h5 className='text-primary mt-4'>
                  Great!!! Email has been Successfully Sent. We will get in touch asap.
                </h5>
              )}
              {submitError && (
                <p className='mt-4 text-red-600 dark:text-red-400'>
                  {submitError}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
