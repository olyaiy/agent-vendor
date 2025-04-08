import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="absolute 

      text-lg font-bold tracking-tight hover:cursor-pointer hover:opacity-80 transition-opacity "
    >
      Agent Vendor
    </Link>
  );
}