'use strict';

var page = "";

function selectOption(select, option) {
  page += "select '"+option+"', :from => '"+select+"'";
}

function recordClick(target) {
  page += "&nbsp;&nbsp;&nbsp;&nbsp;page.find('"+target+"').click<br>";
}

function recordInput(target, value) {
  page += "&nbsp;&nbsp;&nbsp;&nbsp;page.find('"+target+"').set('"+value+"')<br>";
}

function recordSelectedInput(target, value) {
  var checkedState = target.get
  checkingInput(target, checkedState);
}

function checkingInput(target, checkedState) {
  var checked = "false";

  if (checkedState === "checkedInput") {
    checked = "true";
  }

  page += "&nbsp;&nbsp;&nbsp;&nbsp;page.find('"+target+"').set('"+checked+"')<br>";
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
      "from the extension");

    if (request.error) {
      page += "<br>Uh oh, Errors!<br>";
      return page += request.error.toString();
    }

    if (request.listen == "start") {
      page = "";
      page += 'require "rails_helper"<br><br>';
      page += 'describe "'+request.describe + '" do<br>';
      page += '&nbsp;&nbsp;context "'+request.context + '" do<br>';
      page += '&nbsp;&nbsp;&nbsp;before(:each) do<br>';
      page += '&nbsp;&nbsp;&nbsp;&nbsp;visit "{{pathname}}"<br>';
      page += '&nbsp;&nbsp;&nbsp;end<br><br>';

      page += '&nbsp;&nbsp;&nbsp;it "'+request.it+'" do<br>';

    } else if (request.eventType == "click") {
      recordClick(request.target);

    } else if (request.listen == "save") {

      page += "&nbsp;&nbsp;&nbsp;&nbsp;"+request.expect+"<br>";
      page += "&nbsp;&nbsp;&nbsp;end<br><br>";
      page += "&nbsp;&nbsp;end<br><br>";
      page += "end<br>";

      sendResponse({page: page});

    } else if (request.node == "input" && request.eventType.indexOf("checkedInput") === -1) {
      recordInput(request.target, request.value);
    } else if (request.node == "input" && request.eventType.indexOf("checkedInput") > -1) {
      checkingInput(request.target, request.eventType);
    } else if (request.node == "select") {
      selectOption(request.target, request.option);
    } else if (request.currentPath) {
      page = page.replace("{{pathname}}", request.currentPath);
    }
  }
);
