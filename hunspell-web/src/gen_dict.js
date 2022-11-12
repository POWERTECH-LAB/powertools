var Spellchecker = require("hunspell-spellchecker");
var spellchecker = new Spellchecker();
var fs = require("fs")

const DICTS = {
  "chromium":{
    "en_US" : spellchecker.parse({
      aff: fs.readFileSync("./dictionaries/chromium/en_US.aff"),
      dic: fs.readFileSync("./dictionaries/chromium/en_US.dic")
    })
  },
  "libreoffice":{
    "en_US" : spellchecker.parse({
      aff: fs.readFileSync("./dictionaries/libreoffice/en_US.aff"),
      dic: fs.readFileSync("./dictionaries/libreoffice/en_US.dic")
    })
  },
}

fs.writeFileSync("dictionaries.json",JSON.stringify(DICTS))
