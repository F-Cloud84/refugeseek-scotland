# refugeSeek Scotland

A free, non-commercial beta website for people who are homeless or at risk of homelessness in Scotland. It helps them find emergency shelter, food, clothing and support quickly, and points them to the organisations that provide it. It does not provide housing or legal services itself.

Live: https://refugeeseek.online

## Status

Beta. The site includes a short summary of housing rights for general information. That summary has not yet been reviewed by a solicitor or by Scottish housing advice services, and it is not legal advice. Until that review is complete, the site is labelled as beta.

## Architecture

The site is a static front end with one serverless API function.

| Part | Location | Purpose |
|---|---|---|
| Front end | `index.html`, `privacy.html` | Single-page site: emergency bar, services map, chat, support cards, rights summary, about and privacy notice |
| API | `api/chat.js` | Vercel serverless function that forwards chat messages to the Anthropic Messages API |
| Crawl files | `robots.txt`, `sitemap.xml` | Search indexing |
| Hosting | `vercel.json` (security headers) | Vercel static hosting |

### The `/api/chat` function

`POST /api/chat` accepts a list of messages and returns the model's reply.

- The Anthropic API key is read from the `ANTHROPIC_API_KEY` environment variable on the server. It is never sent to the browser.
- Requests are limited to the most recent 20 messages, and each message is cut to 1,000 characters before it is sent.
- Only `user` and `assistant` roles are accepted. Any other input is rejected with a 400 error.
- Other methods return 405. A failed upstream call returns 502.
- Model: `claude-sonnet-4-6` by default, configurable with `ANTHROPIC_MODEL`. Output is capped at 1,000 tokens.

Known limitation: there is no rate limiting yet. A shared rate limit is planned before wider promotion.

## AI safety design

The assistant ("Refuge") is a signposting guide. Its behaviour is set in the system prompt, which is held on the server and is not visible to users. These are instructions to the model, not enforced code, so they can fail. The site's safety also depends on the content and layout of the page itself.

Prompt-level guardrails:

- **Signposting first.** The assistant's main job is to point people to practical help. When it mentions housing rights, it frames them as general information ("you may be entitled to"), not guarantees, and points to Shelter Scotland for confirmation.
- **No confirmed availability.** It tells people to call ahead before travelling, because it cannot know whether a service has space.
- **No invented contact details.** Where it is unsure, it directs people to Shelter Scotland's national line.
- **Verified services list.** The prompt contains a fixed list of phone numbers and council contacts for Scotland. These need regular checking against each organisation's own website.
- **Warm, short replies.** Responses are kept brief, and each ends with a phone number the person can call now.

Page-level safety:

- An emergency bar at the top of the page directs people in danger to call 999.
- The homelessness and rights sections include a clear "not legal advice" notice.
- Chat replies are inserted as plain text, not HTML, which prevents injected markup from running on the page.

## Services map

The map uses Leaflet.js and a static list of verified services for Scotland. Each entry has a name, type, city, address and telephone number.

## Deployment

- Hosted on Vercel from the `index.html` branch.
- Changes are made on feature branches and merged through GitHub pull requests.
- Security headers are set in `vercel.json`: content-type sniffing, framing, referrer policy, permissions policy and HSTS.
- Analytics: Vercel Web Analytics, page-level only.

## Contact

Olujimmy Elijah Ogunbajo (MBCS): funshodee@gmail.com

This is a free, non-commercial service and is not run by any council or charity.
