'use strict';

//# sourceMappingURL=contentscript.js.map


var helpers = {
  getSelectorFromElement: function(el) {
    var targetSelector = el.getAttribute("id");
    var isAmbiguous = true;

    if (!targetSelector) { // Then no ID, let's check classnames
      targetSelector = el.classList;

      if (targetSelector.length) {
        targetSelector = Array.prototype.slice.apply(targetSelector);
        targetSelector = targetSelector.map(function(classname) {return "."+classname}).join("");

        if (document.querySelectorAll(targetSelector).length === 1) { // Great the class name combo is unique
          isAmbiguous = false;
        }
      }

    } else { // Yes there is an ID and we can assume it is unique
      targetSelector = "#"+targetSelector;
      isAmbiguous = false;
    }

    if (targetSelector.length === 0) { // ah snap no classnames nor id. Then let's grab the element name
      targetSelector = this.getNodeElement(el);
    }

    return [targetSelector, isAmbiguous, el];
  },

  getDomSelector: function(target) {
    var targetSelector = [];
    var selectorObject = this.getSelectorFromElement(target); // [el string, isAmbiguous?, el dom object]

    targetSelector.unshift( selectorObject[0] );

    while ( selectorObject[1] && document.querySelectorAll( targetSelector.join(" ") ).length > 1 ) { // selectorObject[1] is a boolean. True it is ambiguous selector or false it is ready to go.
      selectorObject = this.getSelectorFromElement(selectorObject[2].parentElement);

      targetSelector.unshift( selectorObject[0] );
    }

    return targetSelector.join(" ");
  },

  getNodeElement: function(el) {
    var children = el.parentElement.children,
        targetSelector = el.nodeName.toLowerCase(),
        nodeList,
        selector;

    if (children.length > 1) {
      nodeList = Array.prototype.slice.call( children );
      selector = targetSelector+":nth-child(" + nodeList.indexOf(el) + ")";
    } else {
      selector = targetSelector;
    }

    return selector;
  },

  clicked: function(e, nodeName) {
    var targetSelector = helpers.getDomSelector(e.target);

    chrome.runtime.sendMessage({eventType: "click", target: targetSelector, node: nodeName});
  },

  fillIn: function(e) {
    var targetSelector = helpers.getDomSelector(e.target);
    var value = e.target.value;
    chrome.runtime.sendMessage({eventType: "blur", target: targetSelector, node: "input", value: value});
    e.target.removeEventListener("blur", helpers.fillIn, false);
  }
};


function eventFactory(e) {
  var el = e.target.nodeName.toUpperCase();

  switch(el) {
    case "INPUT":
      focusedInput(e);
      break;
    case "SELECT":
      focusedSelect(e);
      break;
    case "BUTTON":
      clickedButton(e);
      break;
    case "A":
      clickedLink(e);
      break;
    default:
      clickedLink(e);
  }
}

function beginListening() {
  var els = document.querySelectorAll('a, button');

  for (var i = 0; i < els.length; i++) {
    els[i].addEventListener('click', eventFactory, false);
  }

  els = document.querySelectorAll('select, input');

  for (var i = 0; i < els.length; i++) {
    els[i].addEventListener('focus', eventFactory, false);
  }

  if (!localStorage["serb-recording"]) {
    chrome.runtime.sendMessage({currentPath: window.location.pathname});
  }

  localStorage["serb-recording"] = true;
}

function stopListening() {
  var els = document.querySelectorAll('a, button');
  for (var i = 0; i < els.length; i++) {
    els[i].removeEventListener('click', eventFactory, false);
  }

  els = document.querySelectorAll('select, input');
  for (var i = 0; i < els.length; i++) {
    els[i].removeEventListener('focus', eventFactory, false);
  }

  delete localStorage["serb-recording"];
}

chrome.runtime.onMessage.addListener(

  function(request, sender, sendResponse) {
    console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
      "from the extension");

    if (request.listen === "start") {
      beginListening();
    }

    if (request.listen === "stop") {
      stopListening();
    }
  }
);

function clickedLink(e) {
  helpers.clicked(e, "a");
}

function clickedButton(e) {
  helpers.clicked(e, "button");
}

function focusedInput(e) {
  e.target.addEventListener("blur", helpers.fillIn, false);
}

if (localStorage["serb-recording"]) {
  beginListening();
}