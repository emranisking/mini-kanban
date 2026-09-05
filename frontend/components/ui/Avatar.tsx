import { initials, avatarHue } from '../../lib/utils';

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const hue = avatarHue(name || '?');
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-canvas"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 75% 55%), hsl(${(hue + 40) % 360} 75% 45%))`,
      }}
      title={name}
    >
      {initials(name) || '?'}
    </div>
  );
}
