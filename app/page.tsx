import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen bg-zinc-900 text-zinc-900 space-grotesk hover:text-zinc-100 py-20 space-y-12 text-center">
      <h1 className="text-zinc-100 text-4xl md:text-5xl lg:text-6xl tracking-tighter font-semibold">World of Retro Items</h1>
      <div className="container mx-auto flex flex-col items-center justify-center ">
        <Link href="/polaroid" className="transition-colors duration-200 text-3xl md:text-4xl lg:text-5xl tracking-tighter">The Polaroid</Link>
      </div>

    </div>
  );
}
