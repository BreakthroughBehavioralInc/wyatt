'use strict';

//# sourceMappingURL=contentscript.js.map

var RECORDING_KEY = "wyatt-recording"


var helpers = {
  getSelectorFromElement: function(el) {
    var targetSelector = el.getAttribute("id"),
        isAmbiguous = true,
        children;

    if (!targetSelector) { // Then no ID, let's check classnames
      targetSelector = el.classList;

      if (targetSelector.length) {
        targetSelector = Array.prototype.slice.apply(targetSelector);
        targetSelector = targetSelector.map(function(classname) {return "."+classname}).join("");

        if (document.querySelectorAll(targetSelector).length === 1) { // Great the class name combo is unique
          isAmbiguous = false;
        } else {
          children = el.parentElement.children;
          children = Array.prototype.slice.call( children );
          targetSelector = targetSelector+":nth-child(" + (children.indexOf(el) + 1) + ")";
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

    while ( document.querySelectorAll( targetSelector.join(" ") ).length > 1 ) {
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
      selector = targetSelector+":nth-child(" + (nodeList.indexOf(el) + 1) + ")";
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
  Gator(document).on('click', 'a, button, .btn', eventFactory);
  Gator(document).on('focus', 'select, input', eventFactory);


  if (!localStorage[RECORDING_KEY]) {
    chrome.runtime.sendMessage({currentPath: window.location.pathname});
  }

  localStorage[RECORDING_KEY] = true;
}

function stopListening() {
  var els;

  delete localStorage[RECORDING_KEY];

  Gator(document).off('click', 'a, button, .btn', eventFactory);
  Gator(document).off('focus', 'select, input', eventFactory);
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

if (localStorage[RECORDING_KEY]) {
  beginListening();
}