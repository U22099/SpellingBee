import { WORDS } from "./words/words.js";

//Declaring variables
let word = [];
let origin = [];
let asked = [];
let correctlyAnswered = [];
let finished = false;
let score = 0;
let currentTxt = '';
let ans = '';
let no = 0;
let chance = 0;
let letterNo = parseInt(localStorage.getItem("lastLetterNo")) || 1;
let correct = false;
let askedWord = '';
let rangeConst = 0;
let rangeBarVar = 0;
let broken = false;
let chunk = 0;
let chunkArray = [[], []];
let chunkScore = 0;
let read = false;
const alpha = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,ALL".split(',');
const speech = window.speechSynthesis || speechSynthesis;
const voices = speech.getVoices().filter(voice => voice.lang.includes("en"));

//Defining needed functions

//init Function
function init() {
  if (localStorage.hasOwnProperty(alpha[letterNo - 1]) && !broken) {
    document.getElementById('save').innerText = 'Continue';
  }
  try {
    const wordAll = WORDS[letterNo - 1];
    for (let i = 0; i < wordAll.length; i++) {
      if (i === 0 || isEven(i)) {
        word.push(wordAll[i]);
      } else {
        origin.push(wordAll[i]);
      }
    }
    //console.log(origin);
    //For catching error in data structure
    if ((word.includes(' ') || word.includes('')) && word.length > 1) {
      alert('Error at ' + word[word.indexOf('')] + ' before ' + word[word.indexOf('') - 1]);
    }
    if (broken) {
      word = chunkArray[0][chunk].slice();
      origin = chunkArray[1][chunk].slice();
    }
    rangeConst = word ? 100 / word.length : 0;
    updateRangeBar();
    document.getElementById('max-score').innerText = `Max-Score: ${word.length*10}`;
    document.getElementById('alphabet').innerText = alpha[letterNo - 1];
  } catch (error) {
    console.error(error);
  }
}

//Utility function to check if a number is even

function isEven(no) {
  const result = no % 2 === 0 ? true : false;
  return result;
}
//RangeBar update function

function updateRangeBar() {
  document.getElementById("range").style.width = `${rangeBarVar}%`;
}
//Utility Speak function 

function initVoiceDropdown() {
  // Get the voices dropdown element
  const voicesDropdown = document.getElementById('voices');

  //Get default voice name
  const defaultVoiceName = localStorage.getItem("voice") || (voices.filter(voice => voice.name === "Google UK English Female" || ((voice.name.includes("Female") || voice.gender === "female") && voice.lang === "en-GB") || voice.lang === "en-GB")[0]).name;

  // Populate the voices dropdown
  voices.forEach((voice, i) => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = voice.name;
    voicesDropdown.appendChild(option);
    if (voice.name === defaultVoiceName) {
      //Select default voice
      voicesDropdown.selectedIndex = i;
    }
  });
  
  voicesDropdown.addEventListener("change", event => {
    localStorage.setItem("voice", event.target.value);
    speak(event.target.value);
  })
}

function speak(str) {
  //if(speech.pending || speech.speaking) speech.cancel();
  const utterance = new SpeechSynthesisUtterance();
  const voiceName = document.getElementById('voices').value;
  utterance.text = str;
  utterance.voice = voices.find(voice => voice.name == voiceName);
  utterance.rate = 0.85;

  speech.speak(utterance);
};

// Get random number with max-value (max)

function getRandom(max) {
  const no = Math.floor(Math.random() * max);
  return no;
}

//check if a word is available (hasnt been called)

function available() {
  const arrayObj = {
    word: [],
    origin: []
  }
  for (let i = 0; i < word.length; i++) {
    if (asked.includes(word[i])) continue;

    arrayObj.word.push(word[i]);
    arrayObj.origin.push(origin[i]);
  }
  if (arrayObj.word.length === 0) {
    arrayObj.word.push('null');
  }
  return arrayObj
}

//Generates a random word to be called

function generateNewWord() {
  const { word, origin } = available();
  const no = getRandom(word.length);

  if (word[0] !== 'null') {
    const speech = {
      text: word[no],
      org: origin[no]
    }
    asked.push(word[no]);
    ans = speech.text;


    return speech
  } else {
    return {
      text: null,
      org: null
    }
  }
}

//Calls the randomly generated word

function callWord() {
  const { text, org } = generateNewWord();
  askedWord = text;
  if (text) {
    currentTxt = 'Spell the word... ' + text + ' ...Origin of ' + org;
    updateWordNo();
    rangeBarVar += rangeConst;
    updateRangeBar();
  } else {
    if (!broken || chunk >= 5) {
      finished = true;
      currentTxt = 'You have successfully finished the letter ' + alpha[letterNo - 1];
    } else {
      finished = false;
      currentTxt = `You have successfully finished chunk ${chunk+1}`;
      if (chunk === 4) {
        finished = true;
        currentTxt = 'You have successfully finished the letter ' + alpha[letterNo - 1];
      }
    }
  }
  speak(currentTxt);
  finished && !read ? successScore() : null;
  no = 0;
}

//Repeats the called word for only 3 times

function repeat() {
  speech.cancel();
  if (no < 3) {
    speak(currentTxt);
    finished && !read ? successScore() : null
    no++
  } else {
    speak('Max Repeat Reached');
  }
}

//Assesses users answer

function assessInput() {
  const input = document.getElementById('input');

  if (input.value.toLowerCase() === ans) {
    score += 10;
    speak('Correct');
    correct = true;
    input.style.border = '2px solid goldenrod';
    input.value = '';
    if (chance < 2) {
      correctlyAnswered.push(ans);
    }
  } else {
    speak('Wrong');
    correct = false;
    input.style.border = '2px solid red';
    input.value = '';
  }
  displayScore()
}

//check if answer is wrong and move to the next word

function checkAns() {
  chance++
  speech.cancel()
  if (chance <= 3 && !correct) {
    assessInput();
    if (correct) {
      correct = false;
      displayAns();
      callWord();
      chance = 0;
    } else if (chance === 3 && !correct) {
      displayAns();
      callWord();
      chance = 0
    }
  }
}

//Display scoreboard

function displayScore() {
  const scoreboard = document.getElementById('score');
  scoreboard.innerText = `Score: ${score}`;
}

//Display Answer

function displayAns() {
  const output = document.getElementById('output');
  output.innerText = ans.toUpperCase();
}

//Reset all used variables

function resets() {
  word = [];
  origin = [];
  asked = [];
  correctlyAnswered = [];
  finished = false;
  score = 0;
  currentTxt = '';
  ans = '';
  no = 0;
  chance = 0;
  askedWord = '';
  chunk = 0;
  broken = false;
  chunkArray = [[], []];
  updateChunkOutput();
  correct = false;
  rangeBarVar = 0;
  updateRangeBar();
  updateWordNo();
  displayScore();
  document.getElementById('break').innerText = 'Break';
  document.getElementById('start').innerText = 'Start';
  document.getElementById('input').innerText = '';
  document.getElementById('output').innerText = '';
  document.getElementById('save').innerText = 'Save';
  document.getElementById('alphabet').innerText = alpha[letterNo - 1];
}

//Save data to localstorage

function saveData() {
  const json = JSON.stringify({
    asked: asked,
    correctlyAnswered: correctlyAnswered,
    chunkScore: chunkScore,
    currentTxt: currentTxt,
    score: score,
    rangeBarVar: rangeBarVar,
    broken: broken,
    chunk: chunk,
    chunkArray: chunkArray,
    ans: ans
  });

  localStorage.setItem(alpha[letterNo - 1], json);
  speech.cancel()
  speak('History Saved');
}

//Gets data from localstorage

function getData() {
  const response = localStorage.getItem(alpha[letterNo - 1]);

  const data = JSON.parse(response);

  asked = data.asked;
  correctlyAnswered = data.correctlyAnswered;
  currentTxt = data.currentTxt;
  score = data.score;
  chunkScore = data.chunkScore;
  rangeBarVar = data.rangeBarVar;
  chunk = data.chunk;
  broken = data.broken;
  chunkArray = data.chunkArray;
  ans = data.ans;
  if (!data.rangeBarVar) {
    rangeBarVar = rangeConst * asked.length;
  }
  speech.cancel()
  speak('History Restore');
  broken ? init() : null;
  document.getElementById('save').innerText = 'Save';
  document.getElementById('break').innerText = broken ? 'Nxt.Chk' : 'Break';
  updateWordNo();
  updateRangeBar();
  updateChunkOutput();
}

//Clears data in localstorage

function clearData() {
  localStorage.removeItem(alpha[letterNo - 1]);
  localStorage.removeItem("lastLetterNo");
  resets();
  document.getElementById('save').innerText = 'Save';
  speech.cancel();
  speak('History Cleared');
}

//fetches definition of a word

async function getDefinition() {
  if (!askedWord) return "No current word to define";
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${askedWord}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    let text;
    if (!data[0]) {
      text = data.title;
    } else {
      let def2 = null;
      if (data[0].meanings[1]) {
        def2 = data[0].meanings[1].definitions[0].definition;
      } else if (data[0].meanings[0].definitions[1]) {
        def2 = data[0].meanings[0].definitions[1].definition;
      }
      const definition = `${data[0].meanings[0].definitions[0].definition} ${def2 ? "or "+def2 : ""}`;
      const origin = data[0].origin || "";
      const example = data[0].meanings[0].definitions[0].example || "";
      text = `${definition}...\nOrigin: ${origin}...\nExample: ${example}`;
    }
    return text
  } catch (error) {
    console.log(error);
    if (!navigator.onLine) return "Internet connection required."
    else return "An error occurred";
  }
}

//Display the definition and reads it out also using regular exp to remove any occurence of answer in the definition

async function showDefinition() {
  const defoutput = document.getElementById('defOutput');
  defoutput.innerText = "Fetching definition...";
  defoutput.style.animation = "pulse 1s linear infinite";

  let text = await getDefinition();

  defoutput.style.animation = "none";
  speak(text);
  text = askedWord ? text.replace(new RegExp(askedWord, 'gi'), '*.*') : text;
  defoutput.innerText = text;
}

//switch the asked word for the new total word and correctly answered words for the askedword so it would only call words that wherent spelt correctly at first input

function missedWord() {
  broken ? dechunk() : null;
  asked = correctlyAnswered.slice();
  document.getElementById('start').innerText = 'Start';
  rangeBarVar = 0
  rangeConst = 100 / (word.length - asked.length);
  updateRangeBar();
  chunk = 0;
  broken = false;
  updateChunkOutput();
  speech.cancel();
  speak('Press start to start the missed words');
  document.getElementById('max-score').innerText = `Max-Score: ${(word.length - asked.length)*10}`;
}

//Switches the definition card's visibility

function switchDefinitionVisibility(e) {
  if (e.target.innerText === 'Hide') {
    document.getElementById('def-container').style.visibility = 'hidden';
    e.target.innerText = 'Show';
  } else if (e.target.innerText === 'Show') {
    document.getElementById('def-container').style.visibility = 'visible';
    e.target.innerText = 'Hide';
  }
}

//Update Word No
function updateWordNo() {
  document.getElementById('wordNo').innerText = asked.length;
}

//Break Words into 5 chunks
function _break() {
  const chunkSize = Math.floor(word.length / 5);
  for (let i = 0; i < 5; i++) {
    chunkArray[0].push(word.splice(0, chunkSize));
    chunkArray[1].push(origin.splice(0, chunkSize));
  }
  broken = true;
  init();

}

//Dechunk for missed word
function dechunk() {
  word = chunkArray[0].flat();
  origin = chunkArray[1].flat();
}

//Updating chunk number output
function updateChunkOutput() {
  document.getElementById('chunk').innerText = broken ? chunk + 1 : null;
}

//Works just like reset function but specially for break event listerner
function _reset() {
  chunkScore += score;
  finished = false;
  score = 0;
  currentTxt = '';
  ans = '';
  no = 0;
  chance = 0;
  askedWord = '';
  correct = false;
  rangeBarVar = 0;
  updateRangeBar();
  updateWordNo();
  displayScore();
  document.getElementById('start').innerText = 'Start';
  document.getElementById('input').innerText = '';
  document.getElementById('output').innerText = '';
  document.getElementById('save').innerText = 'Save';
}

//Missed word fot each chunk word
function missedChkWord() {
  asked = correctlyAnswered.filter(x => word.includes(x));
  document.getElementById('start').innerText = 'Start';
  rangeBarVar = 0
  rangeConst = 100 / (word.length - asked.length);
  updateRangeBar();
  updateWordNo();
  speech.cancel();
  speak(`Press start to start the missed words in chunk ${chunk + 1}`);
  document.getElementById('max-score').innerText = `Max-Score: ${(word.length - asked.length)*10}`;
}

//Brief give an account of perfomace using percentage
function successScore() {
  read = true;
  broken ? dechunk() : null
  const SCORE = broken ? chunkScore + score : score;
  const percent = (parseFloat(((correctlyAnswered.length / word.length) * 100).toFixed(2)) + parseFloat((((SCORE / 10) / word.length) * 100).toFixed(2))) / 2;
  let text = '';
  if (percent < 40) {
    text = `Your percentage score is ${percent}%, Please retry this letter`;
  } else if (percent < 60) {
    text = `Your percentage score is ${percent}%`;
  } else {
    text = `Your percentage score is ${percent}%`;
  }
  speech.cancel();
  speak(text)
}
//Adding Event Listeners

//Adding start event
document.getElementById('start').addEventListener('click', () => {
  switch (document.getElementById('start').innerText) {
    case 'Start':
      callWord();
      document.getElementById('start').innerText = 'Repeat';
      break;
    case 'Repeat':
      repeat();
      break;
  }
});

//Adding Enter Key Pressed event

document.getElementById('input').addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    checkAns()
  }
});

//Adding send event

document.getElementById('send').addEventListener('click', () => {
  checkAns()
});

//Adding forward event to change the alphabet

document.getElementById('forward').addEventListener('click', () => {
  if (letterNo >= 27) {
    letterNo = 1;
  } else {
    letterNo += 1;
  }
  document.getElementById('break').innerText = 'Break';
  localStorage.setItem("lastLetterNo", letterNo);
  speech.cancel();
  speak(alpha[letterNo - 1].toLowerCase());
  resets();
  init()
});

//Adding backward event to change the alphabet

document.getElementById('backward').addEventListener('click', () => {
  if (letterNo <= 1) {
    letterNo = 27;
  } else {
    letterNo -= 1;
  }
  document.getElementById('break').innerText = 'Break';
  localStorage.setItem("lastLetterNo", letterNo);
  speech.cancel();
  speak(alpha[letterNo - 1].toLowerCase());
  resets();
  init();
});

//Event for save

document.getElementById('save').addEventListener('click', (e) => {
  if (localStorage.hasOwnProperty(alpha[letterNo - 1]) && e.target.innerText === 'Continue') {
    document.getElementById('save').innerText = 'Save';
    document.getElementById('start').innerText = 'Start';
    getData();
  } else {
    saveData();
  }
});

//Event for Reveal

document.getElementById('reveal').addEventListener('click', () => {
  displayAns();
  callWord();
  chance = 0;
});

//Event for Reset

document.getElementById('reset').addEventListener('click', () => {
  const confirmed = confirm("Are you sure you want to clear user data?");
  confirmed && (() => {
    clearData()
    init()
  })();
});

//Event for Definition

document.getElementById('def').addEventListener('click', () => {
  showDefinition();
});

//Toggle Definition visibility

document.getElementById('hide').addEventListener('click', (e) => {
  switchDefinitionVisibility(e);
});

//Event for missed words

document.getElementById('missed').addEventListener('click', () => {
  if (finished) {
    missedWord();
  } else {
    speech.cancel();
    speak('Please finish this letter before practicing the missed word')
  }
});

//Event listerner for breaking words into smaller chunks for easy learning

document.getElementById('break').addEventListener('click', (e) => {
  if (e.target.innerText === 'Break' && !finished) {
    _break();
    updateChunkOutput();
    speech.cancel();
    speak('Words have been broken into 5 chunks')
    e.target.innerText = 'Nxt.Chk';
  } else if (e.target.innerText === 'Nxt.Chk' && !finished) {
    chunk += 1;
    updateChunkOutput();
    if (chunk < 5) {
      speech.cancel();
      if (chunk === 4) {
        speak(`Starting last chunk`);
      } else {
        speak(`Starting chunk ${chunk + 1}`);
      }
      _reset();
      init();
    } else {
      finished = true;
      speech.cancel();
      speak('You have finished all chunks');
      speak('You have successfully finished the letter ' + alpha[letterNo - 1]);
      successScore();
    }
  }
});

//Missed words for each chunk
document.getElementById('missedChk').addEventListener('click', () => {
  broken ? missedChkWord() : null;
});

//initializing
init();
initVoiceDropdown();