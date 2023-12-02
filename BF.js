var bfWorker;
var executionStart;

window.addEventListener("keydown", keyPressed, false);
window.addEventListener("load", clearOutput);

function clearOutput() {
  document.getElementById("output").value = "";
  document.getElementById("debug_info").innerHTML = "";
}

function keyPressed(evt) {
  if (evt.ctrlKey && evt.keyCode == 13)
    runBF();
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

function runBF() {
  executionStart = Date.now();
  clearOutput();

  var code = document.getElementById("code").value;
  var input = document.getElementById("input").value;

  hideRunButton();

  var inputType = document.getElementById("inputType").elements["inputType"].value;
  var outputType = document.getElementById("outputType").elements["outputType"].value;
  var reverseIn = document.getElementById("reverseIn").checked;
  var reverseOut = document.getElementById("reverseOut").checked;

  var options = { inputType: inputType, outputType, reverseIn, reverseOut };

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
