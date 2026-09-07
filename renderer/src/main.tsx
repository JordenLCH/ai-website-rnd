import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
import { fontsHref } from './fonts'

/* The font list used to live as a literal <link> in index.html, where nothing could check it
   against what a theme asked for. Injecting it from fonts.ts means the preview and the build
   farm load the same set from the same declaration, so "it looked right in preview" cannot
   mean a different typeface than the published page. */
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = fontsHref()
document.head.appendChild(link)

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
