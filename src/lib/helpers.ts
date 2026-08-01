export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function avatarGradient(id: string): string {
  const gradients = [
    'from-brand-400 to-brand-600',
    'from-blue-400 to-blue-600',
    'from-accent-400 to-accent-600',
    'from-brand-500 to-accent-500',
    'from-blue-500 to-brand-500',
    'from-accent-500 to-brand-400',
    'from-brand-400 to-blue-500',
    'from-accent-400 to-blue-500',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export function displayName(p: { full_name: string | null; username: string | null } | null | undefined): string {
  if (!p) return 'Unknown';
  return p.full_name || p.username || 'Unknown User';
}

export function displayHandle(username: string | null): string {
  return username ? `@${username}` : '';
}
