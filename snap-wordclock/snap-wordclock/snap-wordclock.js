import LANGUAGE_PACK_DE from "./languagePacks/DE.js";

import LanguagePackManager from "./languagePackManager.js";

const template = document.createElement('template');
template.innerHTML = `
  <style>

    :host{
      display: grid;
      height: 100%;
      width: 100%;
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto 1fr auto;
      grid-template-areas: "min1 . min2" ". letters ." "min3 . min4";
      --activeColor: #000;
      --inactiveColor: #ccc;
    }

    :host([hidden]:not([hidden=false])){
      display: none;
    }

    .active {
      --color: var(--activeColor);
    }

    #letterGrid{
      grid-area: letters;
      width: 100%;
      height: 100%;
      display: grid;
      grid-auto-rows: 1fr;
      grid-template-columns: repeat(var(--columnCount), 1fr);
      justify-items: center;
      align-items: center;
    }

    #letterGrid span {
      color: var(--color, var(--inactiveColor));
    }

    .minute_point{
      display: blocK;
      background-color: var(--color, var(--inactiveColor));
      width: .75em;
      height: .75em;
      border-radius: 50%;
      margin: 1em;
    }

    #minute_point_1{ grid-area: min1; }
    #minute_point_2{ grid-area: min2; }
    #minute_point_3{ grid-area: min3; }
    #minute_point_4{ grid-area: min4; }

    .hidden {
      display: none;
    }

  </style>
  <div class="minute_point" id="minute_point_1"></div>
  <div class="minute_point" id="minute_point_2"></div>
  <div class="minute_point" id="minute_point_3"></div>
  <div class="minute_point" id="minute_point_4"></div>
  <div id="letterGrid">

  </div>
`;

export default class SnapWordclock extends HTMLElement {

  static get observedAttributes() {
    return [
      'lang',
      'updateintervaltime',
      'round',
      'displayminutepoints'
    ];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._connected = false;
  }

  async connectedCallback() {
    this._languagePack = await LanguagePackManager.getLanguagePack(this.lang || 'DE');
    this._updateIntervalTime = this.hasAttribute('updateintervaltime') ? this.updateIntervalTime : 1000;
    this._round = this.hasAttribute('round') ? this.round : false;
    this._displayMinutePoints = this.hasAttribute('displayMinutePoints') ? this.displayMinutePoints : true;
    this._updateInterval = setInterval(() => this._update(), this._updateIntervalTime);
    
    this._connected = true;
    this._createLetters();
    this._update();
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'lang':
        this._languagePack = await LanguagePackManager.getLanguagePack(newValue);
        this._createLetters();
        this._update();
        break;
      case 'updateintervaltime':
        this._updateIntervalTime = newValue;
        clearInterval(this._updateInterval);
        this._updateInterval = setInterval(() => this._update(), this._updateIntervalTime);
        break;
      case 'round':
        this._round = JSON.parse(newValue);
        this._update();
        break;
      case 'displayminutepoints':
        this._displayMinutePoints = JSON.parse(newValue);
        this._update();
        break;
    }
  }

  get lang() { return this.getAttribute('lang'); }
  set lang(val) { this.setAttribute('lang', val); }

  get updateIntervalTime() { return parseInt(this.getAttribute('updateIntervalTime')); }
  set updateIntervalTime(val) { this.setAttribute('updateIntervalTime', val); }

  get round() { return JSON.parse(this.getAttribute('round')); }
  set round(val) { this.setAttribute('round', val); }

  get displayMinutePoints() { return JSON.parse(this.getAttribute('displayMinutePoints')); }
  set displayMinutePoints(val) { this.setAttribute('displayMinutePoints', val); }

  _update(date = new Date()) {
    if(!this._connected) {
      return;
    }
    const timestring = this._languagePack.timeString(
      date.getHours(),
      date.getMinutes(),
      { round: this._round }
    );

    if (this._currentTimeString != timestring) {

      this._currentTimeString = timestring;
      const timewords = timestring.split(' ');

      const rowLength = this._languagePack.letterSet[0].length;
      const activeRanges = [];
      // creates an Array where every row of the Letterset gets reduced to one String
      this._languagePack.letterSet.map(row => row.join('')).forEach((letterRow, rowIndex) => {
        for (let startIndex = -1, endIndex = -1;
            (startIndex = letterRow.indexOf(timewords[0], startIndex)) != -1;
            startIndex = endIndex + 2) {
          let endIndex = startIndex + timewords.shift().length - 1;
          activeRanges.push({ 'start': rowIndex * rowLength + startIndex, 'end': rowIndex * rowLength + endIndex });
        }
      });
      this._setLettersMode(activeRanges);
    }
    this._setMinutePoints(date);
  }

  _setLettersMode(activeRanges) {
    this.shadowRoot.querySelectorAll('#letterGrid span').forEach((letter, i) => {
      let mode = false;
      if (activeRanges.length) {
        if (i > activeRanges[0].end) {
          activeRanges.shift();
        }
        if (activeRanges.length) {
          mode = i >= activeRanges[0].start && i <= activeRanges[0].end;
        }
      }
      if (mode != letter.classList.contains('active')) {
        if (mode) letter.classList.add('active');
        else letter.classList.remove('active');
      }
    })
  }

  _createLetters() {

    const letters = this._languagePack.letterSet;
    const html_fragment = document.createDocumentFragment();

    for (const row of letters) {
      for (const letter of row) {
        const html_letter = document.createElement('span');
        html_letter.innerText = letter;
        html_fragment.appendChild(html_letter);
      }
    }

    const html_letters = this.shadowRoot.querySelector('#letterGrid');
    html_letters.innerHTML = '';
    html_letters.style.setProperty('--columnCount', letters[0].length);
    html_letters.appendChild(html_fragment);
  }

  _setMinutePoints(date = new Date()) {
    const points = this.shadowRoot.querySelectorAll('.minute_point');
    if (this._displayMinutePoints) {
      points.forEach(point => {
        if (point.classList.contains('hidden')) {
          point.classList.remove('hidden');
        }
      });
      for (let i = 0; i < parseInt(date.getMinutes()) % 5; i++) {
        if (!points[i].classList.contains('active')) {
          points[i].classList.add('active');
        }
      }
      for (let i = parseInt(date.getMinutes()) % 5; i < 4; i++) {
        if (points[i].classList.contains('active')) {
          points[i].classList.remove('active');
        }
      }
    } else {
      points.forEach(point => {
        if (!point.classList.contains('hidden')) {
          point.classList.add('hidden');
        }
      });
    }
  }
}

customElements.define('snap-wordclock', SnapWordclock);