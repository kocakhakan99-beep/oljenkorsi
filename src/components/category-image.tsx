import type { CategoryIconId } from '../domain/categories';
import { categoryIconSources } from '../assets/category-icons';

export function CategoryImage({
  icon,
  size = 26,
}: {
  icon: CategoryIconId;
  size?: number;
}) {
  return (
    <span
      className="category-icon-frame"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        className="category-icon"
        src={categoryIconSources[icon]}
        width={size * 0.72}
        height={size * 0.72}
        alt=""
      />
    </span>
  );
}
