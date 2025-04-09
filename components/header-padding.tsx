'use client'
import React from 'react'
import { useSidebar } from './ui/sidebar';

const HeaderPadding = () => {
const { state: sidebarState } = useSidebar();

  return (
    <div>
        {sidebarState === 'collapsed' && <div className="h-12" />}
    </div>
  )
}

export default HeaderPadding
