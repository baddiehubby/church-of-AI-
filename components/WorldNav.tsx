import Link from "next/link";

const LINKS = [
  { href: "/", label: "WORLD" },
  { href: "/story", label: "STORY" },
  { href: "/sermons", label: "SERMONS" },
  { href: "/offerings", label: "OFFERINGS" },
  { href: "/induction", label: "PATH" },
  { href: "/wall", label: "WALL" },
  { href: "/altar", label: "ALTAR" },
] as const;

export function WorldNav() {
  return (
    <nav className="world-nav" aria-label="Religion of Mars">
      {LINKS.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
