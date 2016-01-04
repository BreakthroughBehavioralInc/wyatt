'use strict';

function $(el) {
  return document.querySelector(el);
}

function beginListening(e) {
  e.preventDefault();

  chrome.runtime.sendMessage({
    listen: "start",
    it: $("#it-statement").value, // $ is not jQuery. No jQuery is used here. I used a simple helper above
    describe: $("#describe-statement").value,
    context: $("#context-statement").value
  });

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {listen: "start"});
  });

  $("#start-wrapper").classList.add("is-hidden");
  $("#recording-wrapper").classList.remove("is-hidden");
  localStorage["serb-recording"] = "listening";
}

function stopListening(e) {
  e.preventDefault();
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {listen: "stop"}, function(response) {

    });
  });

  $("#expect-wrapper").classList.remove("is-hidden");
  $("#recording-wrapper").classList.add("is-hidden");
}

function save(e) {
  e.preventDefault();
  chrome.runtime.sendMessage({listen: "save", expect: $("#expect-statement").value}, function(response) {
    $("#result-inner").innerHTML = response.page;

    $("#expect-wrapper").classList.add("is-hidden");
    $("#results-wrapper").classList.remove("is-hidden");

    localStorage["serb-recording"] = false;
  });
}

function print(e) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {listen: "print"}, function(response) {

    });
  });
}

document.addEventListener("DOMContentLoaded", function() {

  if (localStorage["serb-recording"] === "listening") {
    $("#expect-wrapper").classList.remove("is-hidden");
    $("#start-wrapper").classList.add("is-hidden");
  }

  $("#recording-start").addEventListener("click", beginListening);
  $("#recording-stop").addEventListener("click", stopListening);
  $("#save-button").addEventListener("click", save);
  $("#print-button").addEventListener("click", print);
  $("#done").addEventListener("click", function() {
    $("#start-wrapper").classList.remove("is-hidden");
    $("#results-wrapper").classList.add("is-hidden");
  }, false);
});