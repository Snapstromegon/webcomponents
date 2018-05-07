# snap-wordclock

## Attributes

### lang="[langcode]"
Contains the Language for the Wordclock-Letterset *(Default is "DE")*.
The Language has to be in Caps.

#### Available Languagepacks are:
- **DE:** Deutsch *(./languagePacks/DE.js)*
- **EN:** Englisch *(./languagePacks/EN.js)*

### updateintervaltime="[time in ms]"
The time between two updates of the wordclock *(Default is 1000)*. Make it faster to make the display more accurat or slower to save resources.

### round="[true | false]"
This will be passed through to the Languagepack and it should round the time to the closest 5 Minutes *(Default is false)*.

### displayminutepoints="[true | false]"
Whether the points arround the Letterset for the minutemarks should be visible.