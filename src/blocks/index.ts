import type { CatalogEntry } from './shared'
import { entry as Nav } from './Nav'
import { entry as Hero } from './Hero'
import { entry as MediaText } from './MediaText'
import { entry as Gallery } from './Gallery'
import { entry as SpecTable } from './SpecTable'
import { entry as Features } from './Features'
import { entry as Stats } from './Stats'
import { entry as Testimonials } from './Testimonials'
import { entry as LogoWall } from './LogoWall'
import { entry as FAQ } from './FAQ'
import { entry as Timeline } from './Timeline'
import { entry as Locations } from './Locations'
import { entry as ContactForm } from './ContactForm'
import { entry as RichText } from './RichText'
import { entry as CTA } from './CTA'
import { entry as Footer } from './Footer'
import { entry as Pricing } from './Pricing'
import { entry as CatalogGrid } from './CatalogGrid'
import { entry as Steps } from './Steps'
import { entry as Team } from './Team'
import { entry as Promo } from './Promo'
import { entry as PostList } from './PostList'
import { entry as Notice } from './Notice'
import { entry as FreeSection } from './FreeSection'

/** The catalog. AI may only emit these type names, with props matching these schemas. */
export const catalog: Record<string, CatalogEntry> = {
  Nav, Hero, MediaText, Gallery, SpecTable, Features, Stats, Testimonials,
  LogoWall, FAQ, Timeline, Locations, ContactForm, RichText, CTA, Footer,
  Pricing, CatalogGrid, Steps, Team, Promo, PostList, Notice, FreeSection,
}
