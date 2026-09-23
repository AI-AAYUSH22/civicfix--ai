import React from 'react';
import { MessageCircle, Globe, Smartphone, MessageSquare } from 'lucide-react';

export interface ChannelBadgeProps {
  channel?: 'APP' | 'WHATSAPP' | 'REDDIT' | 'PORTAL' | string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({
  channel = 'PORTAL',
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const norm = (channel || 'PORTAL').toUpperCase().trim();

  let label = 'Portal';
  let bg = 'bg-sky-50';
  let text = 'text-sky-700';
  let border = 'border-sky-200';
  let icon = <Globe className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;

  if (norm === 'WHATSAPP') {
    label = 'WhatsApp';
    bg = 'bg-emerald-50';
    text = 'text-emerald-700';
    border = 'border-emerald-200';
    icon = <MessageCircle className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-600 fill-emerald-100`} />;
  } else if (norm === 'REDDIT') {
    label = 'Reddit';
    bg = 'bg-orange-50';
    text = 'text-orange-700';
    border = 'border-orange-200';
    icon = <MessageSquare className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-orange-600 fill-orange-100`} />;
  } else if (norm === 'APP') {
    label = 'Mobile App';
    bg = 'bg-indigo-50';
    text = 'text-indigo-700';
    border = 'border-indigo-200';
    icon = <Smartphone className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-indigo-600`} />;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1.5'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border tracking-wide transition-colors ${bg} ${text} ${border} ${sizeClasses} ${className}`}
      title={`Intake Source: ${label}`}
    >
      <span className="shrink-0 flex items-center justify-center">{icon}</span>
      {showLabel && <span className="font-semibold">{label}</span>}
    </span>
  );
};

export default ChannelBadge;
