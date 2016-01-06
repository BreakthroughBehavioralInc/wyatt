'use strict';

var page = "";

function recordClick(target) {
  page += "&nbsp;&nbsp;&nbsp;&nbsp;expect(page).to have_selector('"+target+"')<br>";
  page += "&nbsp;&nbsp;&nbsp;&nbsp;click_link('"+target+"')<br>";
}

function recordInput(target, value) {
  page += "&nbsp;&nbsp;&nbsp;&nbsp;expect(page).to have_selector('"+target+"')<br>";
  page += "&nbsp;&nbsp;&nbsp;&nbsp;fill_in('"+target+"', with:'"+value+"')<br>";
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
      "from the extension");

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

    } else if (request.node == "input") {
      recordInput(request.target, request.value);
    } else if (request.currentPath) {
      page = page.replace("{{pathname}}", request.currentPath);
    }
  }
);
