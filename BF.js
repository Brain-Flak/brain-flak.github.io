var bfWorker;
var executionStart;

window.addEventListener("keydown", keyPressed, false);
window.addEventListener("load", clearOutput);

function initialLoad() {
  var params = new URLSearchParams(window.location.search);

  var codeB64 = params.get("c");
  if (codeB64 != null) {
    document.getElementById("code").value = decompress(codeB64);
  }

  var optNum = params.get("o");
  if (optNum != null) {
    var asciiIn  = (optNum & 0x01);
    var reverseIn  = (optNum & 0x02);
    var asciiOut = (optNum & 0x04);
    var reverseOut = (optNum & 0x08);

    if (asciiIn)
      document.getElementById("asciiIn").checked = true;
    else
      document.getElementById("decimalIn").checked = true;

    if (asciiOut)
      document.getElementById("asciiOut").checked = true;
    else
      document.getElementById("decimalOut").checked = true;

    document.getElementById("reverseIn").checked = reverseIn;
    document.getElementById("reverseOut").checked = reverseOut;
  }

  var input = params.get("i");
  if (input != null) {
    document.getElementById("input").value = decompress(input);
  }

  inputModified();
  resizeTextInputs();
}

function inputModified() {
  var codeElem = document.getElementById("code");
  var code = codeElem.value;
  var bracketCount = (code.match(/[\(\)\{\}\<\>\[\]]/g) || []).length;
  if (bracketCount == code.length)
    document.getElementById("charCount").innerText = `${bracketCount}`;
  else
    document.getElementById("charCount").innerText = `${bracketCount}/${code.length}`;
  auto_grow(codeElem);
}

function clearOutput() {
  document.getElementById("output").value = "";
  document.getElementById("debug_info").innerHTML = "";
}

function keyPressed(evt) {
  if (evt.ctrlKey && evt.keyCode == 13)
    runBF();
  // 's' shortcut
  if (evt.keyCode == 83 && document.activeElement.type != "textarea")
    generatePermalink();
}

function restoreRunButton() {
  document.getElementById("go").style = "display: initial";
  document.getElementById("cancel").style = "display: none";
  document.getElementById("spinner").style = "display: none";
}

function hideRunButton() {
  document.getElementById("go").style = "display: none";
  document.getElementById("cancel").style = "display: initial";
  document.getElementById("spinner").style = "display: initial";
}

function auto_grow(element) {
  element.style.height = "5px";
  element.style.height = (element.scrollHeight) + "px";
}

function resizeTextInputs() {
  auto_grow(document.getElementById("code"));
  auto_grow(document.getElementById("input"));
}

function cancel() {
  var executionEnd = Date.now() - 200;

  document.getElementById("debug_info").innerHTML = `${timeFormat(executionEnd - executionStart)} taken.`;
  document.getElementById("output").value = "Cancelled."
  if (bfWorker)
    bfWorker.terminate();

  bfWorker = undefined;
  restoreRunButton();
}

function timeFormat(ms) {
  if (ms < 1000)
    return `${ms}ms`;
  return `${ms / 1000}s`
}

function resetSettings() {
  document.getElementById("decimalIn").checked = true;
  document.getElementById("decimalOut").checked = true;
  document.getElementById("reverseIn").checked = false;
  document.getElementById("reverseOut").checked = false;
}

function generatePermalink() {
  var code = document.getElementById("code").value;
  var input = document.getElementById("input").value;

  var options = getOptions();
  var optNum = 0;

  if (options.inputType == "asciiIn")
    optNum |= 0x01;
  if (options.reverseIn)
    optNum |= 0x02;
  if (options.outputType == "asciiOut")
    optNum |= 0x04;
  if (options.reverseOut)
    optNum |= 0x08;

  var search = `?c=${compress(code)}&o=${optNum}`
  if (input.length > 0)
    search += `&i=${compress(input)}`

  window.history.replaceState(null, "", search);
  navigator.clipboard.writeText(window.location.href);
}

function getOptions() {
  var inputType = document.getElementById("inputType").elements["inputType"].value;
  var outputType = document.getElementById("outputType").elements["outputType"].value;
  var reverseIn = document.getElementById("reverseIn").checked;
  var reverseOut = document.getElementById("reverseOut").checked;

  return { inputType: inputType, outputType, reverseIn, reverseOut };
}

function runBF() {
  executionStart = Date.now();
  clearOutput();

  var code = document.getElementById("code").value;
  var input = document.getElementById("input").value;

  hideRunButton();

  var options = getOptions();

  if (typeof(Worker) !== "undefined") {
    if (typeof(bfWorker) == "undefined") {
      bfWorker = new Worker("./interpreter.js");

      bfWorker.onmessage = function(event) {
        var executionEnd = Date.now() - 200;

        var outputDoc = document.getElementById("output");
        outputDoc.value = event.data;
        auto_grow(outputDoc);
        document.getElementById("debug_info").innerHTML = `${timeFormat(executionEnd - executionStart)} taken.`;
        bfWorker = undefined;
        restoreRunButton();
      }

      bfWorker.onerror = function(event) {
        var executionEnd = Date.now() - 200;

        var outputDoc = document.getElementById("output");
        outputDoc.value = "Interpreter Error.";
        auto_grow(outputDoc);
        document.getElementById("debug_info").innerHTML = `${timeFormat(executionEnd - executionStart)} taken.`;
        bfWorker = undefined;
        restoreRunButton();
      }

      bfWorker.postMessage([code, input, options])
    }
  }
  else {
    document.getElementById("output").value = "Please upgrade to a newer browser.";
  }
}

function deflate(byteString) {
	return pako.deflateRaw(byteStringToByteArray(byteString), {"level": 9});
}

function inflate(byteString) {
	return byteArrayToByteString(pako.inflateRaw(byteString));
}

function byteStringToByteArray(byteString) {
	var byteArray = new Uint8Array(byteString.length);
	for(var index = 0; index < byteString.length; index++)
		byteArray[index] = byteString.charCodeAt(index);
	byteArray.head = 0;
	return byteArray;
}

function byteArrayToByteString(byteArray) {
	var retval = "";
	iterate(byteArray, function(byte) { retval += String.fromCharCode(byte); });
	return retval;
}

function iterate(iterable, monad) {
	if (!iterable)
		return;
	for (var i = 0; i < iterable.length; i++)
		monad(iterable[i]);
}

function byteStringToBase64(byteString) {
	return btoa(byteString).replace(/\+/g, "@").replace(/=+/, "");
}

function base64ToByteString(base64String) {
	return atob(unescape(base64String).replace(/@|-/g, "+").replace(/_/g, "/"))
}

function compress(str) {
  return byteStringToBase64(byteArrayToByteString(deflate(str)))
}

function decompress(str) {
  return inflate(byteStringToByteArray(base64ToByteString(str)));
}
