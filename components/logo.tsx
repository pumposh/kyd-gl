import Image from 'next/image';
import Link from 'next/link';

export default function NextLogo() {
  return (
    <Link href="/" className="flex items-center hover:opacity-90 transition">
      <Image
        src="/logo.png"
        alt="Logo"
        width={100}
        height={68}
        priority
        className="h-8 w-auto"
      />
    </Link>
  );
}
