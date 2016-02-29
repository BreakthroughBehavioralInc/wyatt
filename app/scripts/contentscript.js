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

        if (document.querySelectorAll(targetSelector).length > 1) { // Get the nth-child if there are siblings with same class combo
          children = el.parentElement.querySelectorAll(targetSelector);
          children = Array.prototype.slice.call( children );
          targetSelector = targetSelector+":nth-of-type(" + (children.indexOf(el) + 1) + ")";
          isAmbiguous = true;
        } else {
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

    while (selectorObject[1] || document.querySelectorAll( targetSelector.join(" > ") ).length > 1 ) {
      selectorObject = this.getSelectorFromElement(selectorObject[2].parentElement);

      targetSelector.unshift( selectorObject[0] );
    }

    return targetSelector.join(" > ");
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
  },

  selectOption: function(e) {
    var el = e.target;
    var select = helpers.getDomSelector(el);
    var option = el.options[el.selectedIndex].value;

    chrome.runtime.sendMessage({target: select, node: "select", option: option});
  },

  // Selected Inputs I define as radio and checkboxes
  selectInput: function(e) {
    var targetSelector = helpers.getDomSelector(e.target);
    var eventType;

    if (e.target.checked === true) {
      eventType = "checkedInput";
    } else {
      eventType = "uncheckedInput";
    }

    chrome.runtime.sendMessage({eventType: eventType, target: targetSelector, node: "input"});
  },

  inputTextType: {
    radio: function(e) {
      helpers.selectInput(e);
    },
    checkbox: function(e) {
      helpers.selectInput(e);
    },
    text: function(e) {
      helpers.fillIn(e);
    },
    number: function(e) {
      helpers.fillIn(e);
    },
    password: function(e) {
      helpers.fillIn(e);
    },
    date: function(e) {
      helpers.fillIn(e);
    },
    email: function(e) {
      helpers.fillIn(e);
    },
    search: function(e) {
      helpers.fillIn(e);
    }
  }
};


function eventFactory(e) {
  var el = e.target;
  var nodeName = el.nodeName.toUpperCase();

  try {
    switch(nodeName) {
      case "INPUT":
        helpers.inputTextType[e.target.type](e);
        break;
      case "SELECT":
        helpers.selectOption(e);
        break;
      case "BUTTON":
        helpers.clicked(e, "button");
        break;
      case "A":
        helpers.clicked(e, "a");
        break;
      default:
        helpers.clicked(e, e.target.nodeName.toLowerCase());
    }
  }

  catch(e) {
    stopListening();
    chrome.runtime.sendMessage({error: "An error has occurred trying to trigger "+el+""});
  }

}

function beginListening() {
  Gator(document).on('click', 'a, button, .btn, .button', eventFactory);
  Gator(document).on('blur', 'select, input', eventFactory);


  if (!localStorage[RECORDING_KEY]) {
    chrome.runtime.sendMessage({currentPath: window.location.pathname});
  }

  localStorage[RECORDING_KEY] = true;
}

function stopListening() {
  var els;

  delete localStorage[RECORDING_KEY];

  Gator(document).off('click', 'a, button, .btn', eventFactory);
  Gator(document).off('blur', 'select, input', eventFactory);
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

if (localStorage[RECORDING_KEY]) {
  beginListening();
}