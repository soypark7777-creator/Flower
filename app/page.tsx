import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, Flower2, Sparkles } from "lucide-react";

const highlights = [
  {
    title: "Real-time flower focus",
    description:
      "Camera-first exploration space prepared for TensorFlow.js flower detection."
  },
  {
    title: "Meaning and mood",
    description:
      "Results are shaped around flower language and a warm interior styling direction."
  },
  {
    title: "Backend-ready contract",
    description:
      "API typing is aligned so the UI can connect to analysis responses cleanly."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-petal-cream text-petal-moss">
      <div className="absolute inset-0 -z-10 bg-garden-glow" />
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-10 md:px-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-petal-sage">
              Petal Portal
            </p>
            <h1 className="font-heading text-4xl md:text-6xl drop-shadow-[0_2px_18px_rgba(247,212,216,0.45)]">
              From flower discovery
              <br />
              to a room mood that fits.
            </h1>
          </div>
          <Link
            href="/explore"
            className="hidden rounded-full border border-petal-moss/15 bg-white/80 px-5 py-3 text-sm font-medium shadow-bloom backdrop-blur md:inline-flex md:items-center md:gap-2"
          >
            Explore now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="grid gap-8 py-16 lg:grid-cols-1">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#f7f4ee] shadow-bloom">
            <div className="absolute inset-0">
              <video
                className="h-full w-full object-cover opacity-0 animate-[fadeIn_1.6s_ease_0.6s_forwards,slowZoom_18s_ease-in-out_0s_infinite_alternate]"
                autoPlay
                muted
                loop
                playsInline
                poster="/images/hero.jpg"
              >
                <source src="/videos/hero.mp4" type="video/mp4" />
                <source src="/videos/hero.webm" type="video/webm" />
              </video>
              <div className="absolute inset-0">
                <Image
                  src="/images/hero.jpg"
                  alt="Hero still"
                  fill
                  className="object-cover animate-[fadeOut_1.2s_ease_0.6s_forwards,slowZoom_18s_ease-in-out_0s_infinite_alternate]"
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_rgba(247,244,238,0.0)_55%),linear-gradient(180deg,_rgba(247,244,238,0.75)_0%,_rgba(247,244,238,0.15)_55%,_rgba(247,244,238,0.9)_100%)]" />
            </div>

            <div className="relative grid gap-10 px-6 py-14 md:px-12 md:py-16 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="order-1 flex flex-col justify-between gap-8">
                <p className="max-w-xl text-lg leading-8 text-petal-moss/85">
                  A calm, cinematic entry into flower discovery. The full-width
                  motion layer keeps the hero area alive while the gradients let
                  typography stay readable.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 rounded-full bg-petal-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-petal-sage"
                  >
                    Start exploring
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <span className="inline-flex items-center rounded-full border border-petal-moss/10 bg-white/70 px-4 py-3 text-sm shadow-bloom">
                    Live camera + photo upload ready
                  </span>
                </div>
              </div>

              <div className="order-2 flex flex-col gap-6 lg:order-none">
                <div className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-bloom backdrop-blur">
                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-[1.5rem] bg-petal-blush/55 p-5">
                      <Camera className="mb-3 h-6 w-6" />
                      <p className="text-sm font-semibold">Camera-centered UX</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-petal-dusk/15 p-5">
                      <Flower2 className="mb-3 h-6 w-6" />
                      <p className="text-sm font-semibold">Flower meaning results</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-petal-sage/15 p-5">
                      <Sparkles className="mb-3 h-6 w-6" />
                      <p className="text-sm font-semibold">Interior mood guidance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 pb-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-petal-moss/10 bg-white/70 p-6 shadow-bloom backdrop-blur"
            >
              <h2 className="mb-3 font-heading text-3xl">{item.title}</h2>
              <p className="text-sm leading-6 text-petal-moss/75">
                {item.description}
              </p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
