import type { GachaBadge } from '@/lib/gateway';
import { BadgeImage } from './BadgeImage';
import { cn } from '@/lib/utils';

const rarityStyles: Record<GachaBadge['rarity'], string> = {
  common: 'border-slate-400/30 bg-slate-400/5',
  rare: 'border-blue-400/30 bg-blue-400/5',
  epic: 'border-purple-400/30 bg-purple-400/5',
};

export function BadgeCard({ badge }: { badge: GachaBadge }) {
  return (
    <article className={cn('rounded-2xl border p-4', rarityStyles[badge.rarity])}>
      <BadgeImage
        src={badge.imageUrl}
        alt={badge.name}
        className="mb-4 aspect-square w-full rounded-xl bg-background/50"
      />
      <div className="space-y-1">
        <h3 className="font-semibold break-words">{badge.name}</h3>
        <p className="text-sm capitalize text-muted-foreground">{badge.rarity} · {badge.sp.toLocaleString()} SP</p>
        <p className="text-xs text-muted-foreground break-all">Badge ID: {badge.id}</p>
        <p className="pt-2 text-sm text-muted-foreground">{badge.description}</p>
      </div>
    </article>
  );
}
