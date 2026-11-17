// Visit stats on GoatCounter (hall-of-faces.goatcounter.com): no cookies, nothing personal.
// index.html loads its script with no_onload, so each visit is counted here, once.
//
// The preview pages (<lang>/ and r/<lang>/<id>/) send people on to the game straight away, so
// the game itself would see them as coming from its own site. Those pages pass along where the
// visit really landed and came from (?from=ru/&ref=<referrer>), and the visit is counted as that.
// ?ref= also works on the plain address, to tell communities apart: …/Hall-of-faces/?ref=reddit.

interface GoatCounterVars {
  path: string
  referrer: string
}

declare global {
  interface Window {
    goatcounter?: { no_onload?: boolean; count?: (vars: GoatCounterVars) => void }
  }
}

/** What to count for a visit, from the address's query and the browser's referrer. */
export function visitVars(search: string, referrer: string): GoatCounterVars {
  const params = new URLSearchParams(search)
  return {
    path: `/${params.get('from') ?? ''}`,
    // An empty ref from a preview page means "came directly": don't fall back to the preview page.
    referrer: params.get('ref') ?? params.get('utm_source') ?? referrer,
  }
}

/** Counts this visit and takes the stats parameters out of the address bar. */
export function countVisit() {
  const vars = visitVars(location.search, document.referrer)

  const params = new URLSearchParams(location.search)
  if (['from', 'ref', 'utm_source'].some((k) => params.has(k))) {
    for (const k of ['from', 'ref', 'utm_source']) params.delete(k)
    const query = params.toString()
    history.replaceState(history.state, '', location.pathname + (query ? `?${query}` : '') + location.hash)
  }

  // The script loads async: count now if it is already here, else once it arrives. If it is
  // blocked or offline, the visit just isn't counted.
  const send = () => window.goatcounter?.count?.(vars)
  if (window.goatcounter?.count) send()
  else document.getElementById('goatcounter')?.addEventListener('load', send)
}
