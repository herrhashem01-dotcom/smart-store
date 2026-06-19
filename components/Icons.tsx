type IconProps = { size?: number; color?: string }

const paths: Record<string, string> = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  plus: 'M12 5v14M5 12h14',
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  send: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
  trend: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  check: 'M5 13l4 4L19 7',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  camera: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
  close: 'M6 18L18 6M6 6l12 12',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  sun: 'M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  minus: 'M5 12h14',
}

function Icon({ name, size = 20, color = 'currentColor' }: { name: string } & IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={paths[name]} />
    </svg>
  )
}

export const HomeIcon   = (p: IconProps) => <Icon name="home" {...p} />
export const BoxIcon    = (p: IconProps) => <Icon name="box" {...p} />
export const PlusIcon   = (p: IconProps) => <Icon name="plus" {...p} />
export const ChatIcon   = (p: IconProps) => <Icon name="chat" {...p} />
export const SearchIcon = (p: IconProps) => <Icon name="search" {...p} />
export const SendIcon   = (p: IconProps) => <Icon name="send" {...p} />
export const TrendIcon  = (p: IconProps) => <Icon name="trend" {...p} />
export const CheckIcon  = (p: IconProps) => <Icon name="check" {...p} />
export const BellIcon   = (p: IconProps) => <Icon name="bell" {...p} />
export const CameraIcon = (p: IconProps) => <Icon name="camera" {...p} />
export const CloseIcon  = (p: IconProps) => <Icon name="close" {...p} />
export const MoonIcon   = (p: IconProps) => <Icon name="moon" {...p} />
export const SunIcon    = (p: IconProps) => <Icon name="sun" {...p} />
export const LogoutIcon = (p: IconProps) => <Icon name="logout" {...p} />
export const MinusIcon  = (p: IconProps) => <Icon name="minus" {...p} />
