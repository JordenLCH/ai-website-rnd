Goal
- Make sites maintenance easier when new things come out, especially now AI things grow fast
- Save time for POC to design the website & lower the barrier to entry for AEO/GEO/SEO optimised UI/UX design
- Reduce AI token usage from our own site & make sure our server is slim, no need those bloat UI / framework for UI/UX generation portal. our tools will also iterate faster if no need to develop advanced admin UI eg: feedback system, - drag and drop etc

 
## Requirement
- Site generated must be unique / not too template, don't too "AI Slop"
- Got some variation which the ppl who "design" the website can edit or change if needed, so that human still can decide what they want & it even work if ppl don't really know what they want or what works for them
- They will generate the site using their own AI credit & AI tools, probably connect using skill, MCP or other tools
- Final output will be either JSON, markdown, HTML, or zip, which then can be uploaded and hosted in our platform
- As the generated things are optimised & according to our stacks, we can make sure things are updatable
- We will run cronjob periodically / manually rebuild / trigger to refresh content & patch when got new SEO, AEO, GEO or other new things for web
- Used by our team or ppl related to our team, not someone on internet so some step which too complicated to automate still can use manual step eg: when need to verify the fact of text content / replace the image to use


## Steps for users (some step might change according to the solution I found later on)
1. Clone our boilerplate repo, we set the skill, claude.md / agent.md or whatever relevant so that we can set some limitation & user don't need to manually configure everything, the repo can then open using tools like visual studio code, cursor, antigravity etc
1. The person add relevant info to text / markdown, add some images to be included, run it, preview it
1. Manually edit some part / give verbal feedback if things off eg: section 3 of contact page not nice, need tweak, hero image should use a new one created by the graphics designer or from their own existing image gallery
1. After all done, run a script to package the output then it will be processed in our platform (ADD AEO GEO SEO things), then push to cloudflare pages or something similar
1. If further edit is required few months later, maybe some product discontinued / spec change, we can edit the source manually or have basic editor like Wordpress page where ppl can manually update the content


## Web Design / Development flow
1. (Agent A) upload pdf or other related doc, fill in some info eg: phone number, social media url etc
1. (Agent A) select company branding colour
1. (Automated) suggest theme (and skeleton visual preview, so agent can understand visually)
1. (Automated) suggest sitemap
1. (Agent A) - make decision or revision
1. (Automated) generate first 3 pages
1. (Agent A) - make decision or revision
1. (Automated) generate all remaining pages
1. (Agent A) replace image with real one / update info which need to amend
1. (Automated) run cronjob to repeat the generation periodically to make the content fresh