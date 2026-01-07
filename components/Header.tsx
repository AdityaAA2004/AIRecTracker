"use client";
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'

import { SignedIn, SignInButton, UserButton } from '@clerk/nextjs';
import { Button } from './ui/button';
import { SignedOut } from '@clerk/clerk-react';

const Header = () => {
  return (
    <div className="p-4 flex justify-between items-center bg-linear-to-r from-purple-200 to-blue-200">
        <Link href="/" className='flex items-center gap-2'>
            <Image src={"/assets/images/expensare_logo.png"} 
            alt="Expensare Logo" width={150} height={50} />
            <h1 className="text-xl font-semibold text-black dark:text-gray-400">Expensare</h1>
        </Link>
        <div className='flex items-center space-x-4'>
          <SignedIn>
            <Link href={'/receipts'}>
              <Button className='text-black dark:text-gray-400 cursor-pointer' variant={'outline'}>My Expense Receipts</Button>
            </Link>

            <Link href={'/plan/manage'}>
              <Button>Manage Plan</Button>
            </Link>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode='modal'>
              <Button> Login </Button>
            </SignInButton>
          </SignedOut>
        </div>
    </div>
  )
}

export default Header;