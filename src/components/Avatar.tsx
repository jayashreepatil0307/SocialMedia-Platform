import { avatarGradient, getInitials, displayName } from '@/lib/helpers';
import type { Profile } from '@/types';

interface AvatarProps {
  profile: Profile | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-11 h-11 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-28 h-28 text-3xl',
};

export default function Avatar({ profile, size = 'md', className = '', onClick }: AvatarProps) {
  const sizeClass = sizeMap[size];
  const base = `rounded-full flex items-center justify-center font-semibold text-white shrink-0 overflow-hidden ${sizeClass} ${className}`;

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={displayName(profile)}
        onClick={onClick}
        className={`${base} object-cover ${onClick ? 'cursor-pointer' : ''}`}
      />
    );
  }

  const id = profile?.id ?? 'default';
  return (
    <div
      onClick={onClick}
      className={`${base} bg-gradient-to-br ${avatarGradient(id)} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {getInitials(displayName(profile))}
    </div>
  );
}
