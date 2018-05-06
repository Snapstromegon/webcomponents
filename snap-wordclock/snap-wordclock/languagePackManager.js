const languagePacks = {};
const languagePackPromises = {};

export default class LanguagePackManager {
  static get languagePacks() { return languagePacks; }
  static addLanguagePack(pack) {
    if (languagePacks[pack.langCode]) {
      console.warn(`Snap-Wordclock: Languagepack [${pack.langCode}] already defined! Overwritting existing pack.`);
    }
    (languagePackPromises[pack.langCode] || []).map(res => res(pack));
    languagePacks[pack.langCode] = pack;
  }
  static getLanguagePack(langCode) { 
    return new Promise((resolve) => {
      if(!languagePacks[langCode]){
        languagePackPromises[langCode] = languagePackPromises[langCode] || [];
        languagePackPromises[langCode].push(resolve);
      } else {
        resolve(languagePacks[langCode])
      }
    });
  }
}