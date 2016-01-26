'use strict';


var RECORDING_KEY = "wyatt-recording";
var PAGE_KEY = "wyatt-page";

function $(el) {
  return document.querySelector(el);
}

function send(type) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {listen: type});
  });
}

function beginListening(e) {
  e.preventDefault();

  chrome.runtime.sendMessage({
    listen: "start",
    it: $("#it-statement").value, // $ is not jQuery. No jQuery is used here. I used a simple helper above
    describe: $("#describe-statement").value,
    context: $("#context-statement").value
  });

  send("start");

  $("#start-wrapper").classList.add("is-hidden");
  $("#recording-wrapper").classList.remove("is-hidden");
  localStorage[RECORDING_KEY] = "listening";
  delete localStorage[PAGE_KEY]
}

function stopListening(e) {
  e.preventDefault();

  send("stop");
  delete localStorage[RECORDING_KEY];

  $("#expect-wrapper").classList.remove("is-hidden");
  $("#recording-wrapper").classList.add("is-hidden");
}

function save(e) {
  e.preventDefault();
  chrome.runtime.sendMessage({listen: "save", expect: $("#expect-statement").value}, function(response) {
    var page = response.page;
    localStorage[PAGE_KEY] = page;

    presentResults(page);

    send("stop");
    delete localStorage[RECORDING_KEY];
  });
}

function print(e) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {listen: "print"}, function(response) {

    });
  });
}

function presentResults(page) {
  $("#result-inner").innerHTML = page;
  $("#expect-wrapper").classList.add("is-hidden");
  $("#results-wrapper").classList.remove("is-hidden");
  $("#start-wrapper").classList.add("is-hidden");
}

document.addEventListener("DOMContentLoaded", function() {

  if (localStorage["wyatt-recording"] === "listening") {
    $("#expect-wrapper").classList.remove("is-hidden");
    $("#start-wrapper").classList.add("is-hidden");

  } else if (localStorage[PAGE_KEY]) {
    presentResults(localStorage[PAGE_KEY]);
  }

  $("#recording-start").addEventListener("click", beginListening);
  $("#recording-stop").addEventListener("click", stopListening);
  $("#save-button").addEventListener("click", save);
  $("#print-button").addEventListener("click", print);
  $("#done").addEventListener("click", function() {
    delete localStorage[PAGE_KEY];
    $("#start-wrapper").classList.remove("is-hidden");
    $("#results-wrapper").classList.add("is-hidden");
  }, false);
});