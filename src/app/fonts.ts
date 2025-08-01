// Local build environments may not have internet access, so avoid downloading
// Google Fonts at build time. Instead, export empty variables that keep the
// existing CSS structure without triggering font downloads.
export const playfair = { variable: '' };
export const montserrat = { variable: '' };