import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

const SIZES = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export default function Avatar({ user, size = 'md', clickable = true, className = '' }) {
  const { user: me } = useAuthStore();
  const navigate = useNavigate();

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
  const isMe = me?.id === user?.id;
  const to = isMe ? '/profile' : `/user/${user?.id}`;
  const interactive = clickable && !!user?.id;

  const inner = (
    <div className={clsx(
      'rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold overflow-hidden shrink-0',
      SIZES[size],
      interactive && 'ring-2 ring-transparent hover:ring-primary-500 transition-all cursor-pointer',
      className,
    )}>
      {user?.avatar
        ? <img src={user.avatar} alt={initials} className="w-full h-full object-cover" />
        : <span>{initials}</span>}
    </div>
  );

  if (!interactive) return inner;

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); navigate(to); }}
      title={`${user?.firstName} ${user?.lastName}`}
      className="shrink-0"
    >
      {inner}
    </button>
  );
}
