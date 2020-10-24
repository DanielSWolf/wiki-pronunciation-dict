// Workaround for https://github.com/cospired/i18n-iso-languages/issues/29

declare module '@cospired/i18n-iso-languages' {
  export function getAlpha2Code(name: string, lang: string): string | undefined;
}
