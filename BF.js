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

function runBF() {
  executionStart = Date.now();
  clearOutput();

  var code = document.getElementById("code").value;
  var input = document.getElementById("input").value;

  hideRunButton();

  if (typeof(Worker) !== "undefined") {
    if (typeof(bfWorker) == "undefined") {
      bfWorker = new Worker("./interpreter.js");

      bfWorker.onmessage = function(event) {
        var executionEnd = Date.now() - 200;

        document.getElementById("output").value = event.data;
        document.getElementById("debug_info").innerHTML = `${timeFormat(executionEnd - executionStart)} taken.`;
        bfWorker = undefined;
        restoreRunButton();
      }

      bfWorker.postMessage([code, input])
    }
  }
  else {
    document.getElementById("output").value = "Please upgrade to a newer browser.";
  }
}
