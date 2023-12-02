function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isOpen(c) {
  return "({[<".includes(c) && c.length == 1;
}

function isClose(c) {
  return ")}]>".includes(c) && c.length == 1;
}

function isBracket(text) {
  return "(){}[]<>".includes(text) && text.length == 1;
}

function matches(a, b) {
  return ["()", "{}", "[]", "<>"].includes(a + b);
}

function preprocess(code) {
  var tokens = [];
  var openTokenIndices = [];

  for (var i = 0; i < code.length; i++) {
    var c = code[i];

    if (isOpen(c)) {
      openTokenIndices.push(tokens.length);
      tokens.push({char: c, index: i});
    }
    else if (isClose(c)) {
      if (openTokenIndices.length == 0) {
        return `'${c}' at index ${i + 1} had no opening bracket.`;
      }

      var topToken = tokens[tokens.length - 1];
      if (matches(topToken.char, c)) {
        topToken.char += c;
        openTokenIndices.pop();
      }

      else {
        var lastOpenTokenIndex = openTokenIndices[openTokenIndices.length - 1];

        if (!matches(tokens[lastOpenTokenIndex].char, c)) {
          var token = tokens[lastOpenTokenIndex];
          return `'${c}' at index ${i + 1} did not match ${token.char} at index ${token.index + 1}.`;
        }

        tokens[lastOpenTokenIndex].closeTokenIndex = tokens.length;
        tokens.push({char: c, index: i, openTokenIndex: openTokenIndices.pop()});
      }
    }
  }

  if (openTokenIndices.length != 0) {
    var token = tokens[openTokenIndices[openTokenIndices.length - 1]];
    return `'${token.char}' at index ${token.index + 1} was not closed.`;
  }

  return tokens;
}

var stacks = [[], []];
var curStackIndex = 0;
var thirdStack = [];
var curVal = 0;
var tokenIndex = 0;
var tokens = [];

function loadInitial(code, input, options) {
  tokens = preprocess(code);

  // if err returned.
  if (typeof tokens == "string") {
    postMessage(tokens);
    return;
  }

  var inputs;
  if (input == "")
    inputs = [];
  else if (options.inputType == "asciiIn")
    inputs = input.split(new RegExp());
  else
    inputs = input.split(/\s+/);

  for (var i = 0; i < inputs.length; i++) {
    var s = inputs[i];
    var val;
    if (options.inputType == "asciiIn")
      val = inputs[i].charCodeAt(0);
    else {
      val = parseInt(s, 10);
      if (isNaN(val)) {
        postMessage(`Could not parse input ${i + 1} ('${s}') as an integer.`);
        return;
      }
    }

    stacks[0].push(val);
  }

  if (!options.reverseIn) {
    stacks[0] = stacks[0].reverse();
  }

  run(options);
}


function run(options) {
  var i = 0;
  while (tokenIndex < tokens.length) {
    var token = tokens[tokenIndex];

    if (token.char == "(") {
      thirdStack.push(curVal);
      curVal = 0;
    }
    else if (token.char == "()") {
      curVal++;
    }
    else if (token.char == ")") {
      stacks[curStackIndex].push(curVal);
      curVal += thirdStack.pop();
    }
    else if (token.char == "[") {
      thirdStack.push(curVal);
      curVal = 0;
    }
    else if (token.char == "[]") {
      curVal += stacks[curStackIndex].length;
    }
    else if (token.char == "]") {
      curVal *= -1;
      curVal += thirdStack.pop();
    }
    else if (token.char == "<") {
      thirdStack.push(curVal);
      curVal = 0;
    }
    else if (token.char == "<>") {
      curStackIndex = (curStackIndex + 1) % 2;
    }
    else if (token.char == ">") {
      curVal = thirdStack.pop();
    }
    else if (token.char == "{") {
      var curStack = stacks[curStackIndex];
      var val = 0;
      if (curStack.length > 0)
        val = curStack[curStack.length - 1];

      if (val == 0) {
        tokenIndex = token.closeTokenIndex;
      }
      else {
        thirdStack.push(curVal);
        curVal = 0;
      }
    }
    else if (token.char == "{}") {
      if (stacks[curStackIndex].length != 0)
        curVal += stacks[curStackIndex].pop();
    }
    else if (token.char == "}") {
      var curStack = stacks[curStackIndex];
      var val = 0;
      if (curStack.length > 0)
        val = curStack[curStack.length - 1];

      if (val != 0)
        tokenIndex = token.openTokenIndex;
      else {
        curVal += thirdStack.pop();
      }

    }

    tokenIndex++;
  }

  var text = "";
  var outputStack = stacks[curStackIndex];
  for (var i = 0; i < outputStack.length; i++) {
    if (options.outputType == "asciiOut")
      text += String.fromCharCode(outputStack[i]);
    else
      text += outputStack[i].toString() + "\n";
  }

  if (!options.reverseOut) {
    text = text.split('').reverse().join('');
  }

  if (options.outputType == "decimalOut")
    text = text.trim();

  postMessage(text);
}

onmessage = (e) => {
  // Add an arbitrary timeout so that it's clear the code has run
  setTimeout(() => { loadInitial(e.data[0], e.data[1], e.data[2]); }, 200);
}
