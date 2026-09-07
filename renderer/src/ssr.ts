/** React, resolved from the renderer's own install.
 *
 *  The build farm lives in a separate package with its own node_modules, but it renders block
 *  components that live here — so `react-dom/server` resolved from platform/ and `react` resolved
 *  from renderer/ were two different React instances. Hooks read their dispatcher off the module
 *  singleton, so any block using one (FreeSection arms its motion in an effect) threw
 *  "Invalid hook call" at build time while rendering perfectly in the preview.
 *
 *  It failed loudly, but only for bundles built entirely from FreeSection — every site made with
 *  the escape hatch was unpublishable while the catalog-block sites built fine, which is the worst
 *  shape for a bug to have: it looks like a content problem.
 *
 *  Importing both through this module makes the resolution single-sourced no matter how either
 *  package is installed, which a version pin or a hoist would not — those depend on the installer
 *  cooperating. */
export { createElement } from 'react'
export { renderToStaticMarkup } from 'react-dom/server'
