# NavMate Malaysia — Enhanced prototype
Open `index.html` with VS Code Live Server, or deploy the folder to Netlify (ensure index.html is at the published root).

Features: destination search, map, OSRM route alternatives, browser GPS tracking, English/Bahasa Melayu speech synthesis, local flood/hazard reports with optional photo, nearby petrol/hospital/parking search, high contrast, larger text, keyboard skip link and live status announcements.

Limitations: OSRM/Nominatim/Overpass/OSM public services have usage limits and no uptime guarantee. Alternative routes depend on OSRM responses; there is no live traffic or guaranteed toll avoidance. GPS instructions are prototype-grade and depend on location permission. Browser Malay speech availability varies. Community reports and photos are stored only in this browser's localStorage, are not shared, verified, or official alerts. Nearby OSM data may be incomplete. Photo upload limit 1.5 MB. A production deployment needs a secure backend, moderation, data expiry, privacy controls, provider policy review and accessibility audit. Never use or interact with the app while driving.
Attribution: © OpenStreetMap contributors; routing by OSRM; search by Nominatim; nearby POIs by Overpass API.


## Additional features in this version
- Saved places and last 10 place searches are stored in browser localStorage.
- Dark mode preference is stored on this device.
- Toll estimator provides a deliberately broad distance-based indicative range. It is not connected to Malaysian toll plaza tariffs and must not be treated as a quote.
- AI Travel Assistant is an offline intent-based demo with route summaries and safety/service guidance. It is not a live generative AI model. A real AI integration requires a backend endpoint and protected API credentials; never place a secret API key in client-side JavaScript.

## Safety and data notes
GPS tracking is browser-based and approximate. Alternative routes and estimated duration are supplied by OSRM and do not include live traffic. The app does not provide certified turn-by-turn navigation. Community reports, saved places and history are local to one browser and are not synced across devices/users. The toll estimator uses illustrative per-kilometre ranges, not official rates. Verify toll charges with the relevant highway operator. Flood warnings must be checked with official Malaysian agencies. Public OSM/Nominatim/Overpass/OSRM services are subject to their own acceptable-use policies and rate limits.
