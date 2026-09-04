/** Scroll motion, driven entirely by data attributes the JSON declares.
 *  No animation library: IntersectionObserver for reveals, rAF for parallax.
 *  Honours prefers-reduced-motion by simply never arming. */
export function armMotion(root: HTMLElement, scroller: HTMLElement | null): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    root.querySelectorAll<HTMLElement>('[data-motion]').forEach((el) => (el.dataset.inview = 'true'))
    return () => {}
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          ;(e.target as HTMLElement).dataset.inview = 'true'
          io.unobserve(e.target)
        }
      }
    },
    { root: scroller ?? null, rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  )
  root.querySelectorAll<HTMLElement>('[data-motion]').forEach((el) => io.observe(el))

  const layers = [...root.querySelectorAll<HTMLElement>('[data-parallax]')]
  let raf = 0
  const onScroll = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      const viewH = (scroller?.clientHeight ?? window.innerHeight)
      for (const el of layers) {
        const r = el.getBoundingClientRect()
        const scrollerTop = scroller ? scroller.getBoundingClientRect().top : 0
        const progress = (r.top - scrollerTop + r.height / 2) / viewH - 0.5
        const strength = parseFloat(el.dataset.parallax || '0')
        el.style.setProperty('--parallax-y', `${(-progress * strength * 100).toFixed(2)}px`)
      }
    })
  }
  const target: HTMLElement | Window = scroller ?? window
  target.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()

  return () => {
    io.disconnect()
    target.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    if (raf) cancelAnimationFrame(raf)
  }
}
