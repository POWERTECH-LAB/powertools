var Spellchecker = require("hunspell-spellchecker");
//var spellchecker = new Spellchecker();
import aff from "./dictionaries/chromium/en_US.aff";
import dic from "./dictionaries/chromium/en_US.dic";


var Typo = require("typo-js");
var typoJs = new Typo( "en_US", aff,dic);

var tokenizer = require( 'wink-tokenizer' );

var nspell = require("nspell");
var spell = nspell(aff, dic);

var spellchecker = new Spellchecker();
var DICT = spellchecker.parse({
  aff: aff,
  dic: dic,
});
spellchecker.use(DICT);

let spellTokenizer = tokenizer();

class SpellEngine {
  static type = "hunspell"
  
  static check(word) {
    if(this.type == "nspell") {
      return spell.correct(word)
    } else if (this.type=="typo-js") {
      return typoJs.check(word)
    }
    return spellchecker.check(word)
  } 
  static suggest(word) {
    if(this.type == "nspell") {
      return spell.suggest(word)
    } else if (this.type=="typo-js") {
      return typoJs.suggest(word)
    }
    return spellchecker.suggest(word)
  }
}

let removeRegex = [
  /\{\w+\}/gi,
// /\s\d+\-day\s/gi,
// /(\s|^)wi-fi(\s|$)/gi,
// /(\s|^)ko-fi(\s|$)/gi,
//
// /(\s|^)Asia\/[\w\-_]+(\s|$)/gi,
// /(\s|^)America\/[\w\-_]+(\s|$)/gi,
// /(\s|^)Europe\/[\w\-_]+(\s|$)/gi,
// /(\s|^)Pacific\/[\w\-_]+(\s|$)/gi,
// /\sWi\-Fi\s/gi,
  /XXXXXXXXXX/gi,
  /XXXXXXX/gi,
  ///(\!|\&|,|\.|’|\?|'|"|“|”|\$|\)|\(|\{|\}|\:|\/|…|‘|>|<|;|=|:|\-)/gi,
  ///https?:\/\/.*?(\s|$)/gi,
];

let ignoreRegex = [
  /^n\'t$/gi,
  /^\'ve$/gi,
  /^\'re$/gi,
  /^\'ll$/gi,
  /^C24AMDAGD04ASEDAG3$/gi,
  /^CAMDAGDASEDAG$/gi,
  /^\d+m$/gi,
  /^\d+mb$/gi,
  /^\d+gb$/gi,
  /^\d+px$/gi,
  /^\d+x\d+$/gi,
  /^Params?$/,
  /^SSID$/gi,
  /^https$/gi,

  /^url$/gi,
  /^Cashtag$/gi,
  /^signup$/gi,
  /^(SEO|GST|USD|uuid|ROI|SMS|ETH|BTC)$/,
  /^(jpg|jpeg|gif|webp|png|mov|avi|mp4|wav|gifs)$/gi,
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function detectTypo(dicts,properNouns) {

  SpellEngine.type = document.getElementById("engine_select").value

  document.getElementById("result_div").style.display = "";
  document.getElementById("progess_bar").style.width =  "0%"
  document.getElementById("result_table").innerHTML = "parsing";

  let keys = Object.keys(dicts);
  let suggestions = [];


  let keys_length = keys.length;
  let progress_length = 0

  for (let key of keys) {
    let sentence = dicts[key];
    if(typeof(sentence) != "string") {
      sentence = JSON.stringify(sentence)
    }

    let processSentence = sentence.replace(/\p{Emoji}/gu, "");

    for (let regex of removeRegex) {
      processSentence = processSentence.replace(regex, " ");
    }

    let tokens = spellTokenizer.tokenize(processSentence)
    let words = []
    for (let token of tokens) {
      if(token.tag == "word"){
        words.push(token.value)
      }
    }

    let incorrectSentence = false;
    let resultMap = { key: key, sentence: sentence, words: [] };
    for (let word of words) {
      let ignore = false;
      for (let regex of ignoreRegex) {
        if (word.match(regex)) {
          ignore = 1;
          break;
        }
      }
  
      let isProperNoun = false
      for (let properNoun of properNouns) {
          if(word.match(RegExp("^" + properNoun + "$","i")) && word != properNoun) {
            incorrectSentence = true;
            isProperNoun = true 
            let suggested = [properNoun];
            resultMap.words.push({ word, suggested });
            break;
          } else if (word == properNoun) {
            isProperNoun = true 
            break
          }
      }
  
      if(isProperNoun)continue


      if (word.length < 3) continue;
      if (ignore) continue;

      let spellCorrected = SpellEngine.check(word);
      if (!spellCorrected) {
        incorrectSentence = true;
        let suggested = SpellEngine.suggest(word);
        resultMap.words.push({ word, suggested });
      }
    }
    if (incorrectSentence) {
      suggestions.push(resultMap);
    }


    progress_length++
    document.getElementById("progess_bar").style.width = ((progress_length/keys_length)*100) + "%"
    await sleep(2)
  }

  if (suggestions.length > 0) {
    let html = "";
    html +=
      '<thead><tr class="table-primary"><td>key/word</td><td>sentence/suggestions</td></th></thead>';
    for (let suggestion of suggestions) {
      html +=
        '<tr class="table-secondary"><td>' +
        suggestion.key +
        "</td><td>" +
        suggestion.sentence +
        "</td> </tr>";
      for (let word of suggestion.words) {
        html +=
          '<tr class="table-danger"><td>' +
          word.word +
          "</td><td>" +
          word.suggested.join("&nbsp; ,") + "<br />" + 
          "</td> </tr>";
      }
    }
    document.getElementById("result_table").innerHTML = html;
  } else {
    document.getElementById("result_table").innerHTML =
      " <tr><td>Seems Good</td> </tr>";
  }
}

document.getElementById("lang_file").addEventListener("change", function () {
  var file = document.getElementById("lang_file").files[0];
  var reader = new FileReader();
  reader.onload = function (e) {
    var textArea = document.getElementById("lang_text");
    textArea.value = e.target.result;
  };
  reader.readAsText(file);
});

document.getElementById("check_btn").addEventListener("click",  async function () {
  let json_text = document.getElementById("lang_text").value;
  let json = {};
  let parsed = false;
  try {
    json = JSON.parse(json_text);
    parsed = true;
  } catch (e) {}

  try {
    if (!parsed && json_text.indexOf("export default") !== -1) {
      let str = json_text.replace("export default ", "json =");
      eval(str);
      parsed = true;
    }
  } catch (e) {}

 try {
    if (!parsed) {
      let commentRegex = /^\/\/.*$/m
      let str = json_text
      if(json_text.match(commentRegex)){
        str = str.replace(commentRegex,"");
      }
      let exportRegex = /^\s*export\s default\s+/

      if (str.match(exportRegex)) {
        str = str.replace(exportRegex, "json =");
      }

      let moduleExportRegex = /^\s*module\s*\.\s*exports\s*=/
      if (str.match(moduleExportRegex)) {
        str = str.replace(moduleExportRegex, "json =");
      }
    
      eval(str)
      parsed = true;
    }
  } catch (e) {
      console.log(e)
  }

  if (!parsed && json_text.trim() != "") {
    json["sentence"] = json_text
    parsed = true
  }

  if (!parsed) {
    document.getElementById("alert_div").innerHTML =
      "could not parse the file as JSON";
    document.getElementById("alert_div").style.display = "";
    document.getElementById("result_div").style.display = "none";
    return;
  } else {
    document.getElementById("alert_div").style.display = "none";
  }
  
  let properNouns = document.getElementById('proper_noun').value.split(/\s+/)
  await detectTypo(json,properNouns);
});
