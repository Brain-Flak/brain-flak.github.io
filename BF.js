var bfWorker;

window.addEventListener("keydown", keyPressed, false);
window.addEventListener("load", clearOutput);

function clearOutput() {
  document.getElementById("output").value = "";
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

function cancel() {
  document.getElementById("output").value = "Cancelled."
  bfWorker = undefined;
  restoreRunButton();
}

function runBF() {
  clearOutput();

  var code = document.getElementById("code").value;
  var input = document.getElementById("input").value;

  hideRunButton();

  if (typeof(Worker) !== "undefined") {
    if (typeof(bfWorker) == "undefined") {
      bfWorker = new Worker("./interpreter.js");

      bfWorker.onmessage = function(event) {
        document.getElementById("output").value = event.data;
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
