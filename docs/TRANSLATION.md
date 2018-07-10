## Translation to your own language guide

Translaions can be founded in [translations](/translations) directory. Each trainslation has such format:

```json
{
    "name": "Language name",
    "nameOriginal": "Native language name (for example Русский)",
    "translations": {
        "English string": "Same string on your native language"
    }
}
```

You can copy [en.json](/translations/en.json) to your own lang.json and translate each line in translations: {...} section.

## How to keep translations recent ?

Just keep mind that translations updates on each release and new lines will be added in each json file automatically (probably on the end of the files). You must translate new english lines to new one to keep translation recent.

## Where languanges is located on production for testing ?

On Windows: c:\Users\USER\AppData\Local\Programs\rats-search\resources\translations\