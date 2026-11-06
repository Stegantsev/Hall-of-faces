/** Resolves a data asset path ("portraits/x.jpg") against the deploy base. */
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`
