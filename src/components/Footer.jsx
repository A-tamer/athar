const LINKEDIN_URL = 'https://www.linkedin.com/in/ahmed-wafa-asu?utm_source=share_via&utm_content=profile&utm_medium=member_ios'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer dir="ltr" lang="en" className="border-t border-beige-400/20 bg-olive-900 text-beige-200">
      <div className="container mx-auto flex flex-col items-center px-4 py-8 sm:py-10 sm:px-6">
        <div
          className="mb-5 h-px w-[min(100%,280px)] bg-gradient-to-r from-transparent via-gold-400/45 to-transparent"
          aria-hidden
        />

        <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-beige-200/65 sm:text-xs">
          <span className="tabular-nums">© {year}</span>
          <span className="mx-1.5 text-beige-400/50">·</span>
          <span>All rights reserved</span>
          <span className="text-beige-200/90">.</span>
        </p>

        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-5 inline-flex items-center gap-2 rounded-full border border-beige-300/25 bg-gradient-to-b from-olive-800/80 to-olive-950/90 px-5 py-2.5 text-sm shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/5 transition-all hover:border-gold-400/35 hover:shadow-[0_8px_28px_-6px_rgba(212,166,74,0.25)] hover:ring-gold-400/15"
        >
          <span className="text-beige-200/55 transition-colors group-hover:text-beige-200/75">Made by</span>
          <span className="bg-gradient-to-r from-beige-100 to-gold-200/90 bg-clip-text font-semibold text-transparent">
            Eng. Ahmed Wafa
          </span>
        </a>
      </div>
    </footer>
  )
}

export default Footer
