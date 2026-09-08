import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
import { fontsHref } from './fonts'
import { register as registerSwiper } from 'swiper/element/bundle'

/* Swiper ships as custom elements, which have to be defined before React renders one. The
   build farm gets the same elements from the bundled script it copies alongside the HTML,
   so the Carousel primitive emits identical markup in both renderers. */
registerSwiper()

/* The font list used to live as a literal <link> in index.html, where nothing could check it
   against what a theme asked for. Injecting it from fonts.ts means the preview and the build
   farm load the same set from the same declaration, so "it looked right in preview" cannot
   mean a different typeface than the published page. */
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = fontsHref()
document.head.appendChild(link)

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
