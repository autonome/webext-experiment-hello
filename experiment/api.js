const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;

/*

TODO

* Implement events
  * onShow
  * onHide

* Implement tab.visible

* Always at least one tab visible.
  * First confirm existing behavior of hide all.
  * Either throw exception or leave one tab visible.

* Pinned tabs - test how they're handled.



*/

function show(tabIds, context) {
  // Get tabbrowser
  // TODO: Hack to work only in single window, until I can get at ext-browser.js's tabTracker.
  var tabbrowser = getTabbrowser();

  // Get all visible native tabs
  var visibleTabs = [];
  for (let tab of tabbrowser.tabs) {
    if (tab.hidden === false) {
      visibleTabs.push(tab);
    }
  }

  // Add newly visible tabs to array of visible native tabs
  tabIds.forEach(function(tabId) {
    visibleTabs.push(context.extension.tabManager.get(tabId, null).nativeTab);
  });

  // Make them visible
  tabbrowser.showOnlyTheseTabs(visibleTabs)
  
  // TODO: Fire onShow event for newly visible tabs
}

function hide(tabIds, context) {
  // Get native tabs for tab ids
  var tabsToHide = tabIds.map(function(tabId) {
    return context.extension.tabManager.get(tabId, null).nativeTab;
  });

  // Get tabbrowser
  //
  // TODO: Hack to work only in single window, until I
  // can get at ext-browser.js's tabTracker.
  var tabbrowser = getTabbrowser();

  // Get array of remaining visible native tabs
  var visibleTabs = [];
  for (let tab of tabbrowser.tabs) {
    if (tabsToHide.indexOf(tab) == -1) {
      visibleTabs.push(tab);
    }
  }

  // Set visible tabs
  tabbrowser.showOnlyTheseTabs(visibleTabs)

  // TODO: Fire onHide event for newly hidden tabs
}

function getTabbrowser() {
  // Get current browser window
  var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
           .getService(Ci.nsIWindowMediator);
  var browserWindow = wm.getMostRecentWindow("navigator:browser");

  return browserWindow.gBrowser;
}

class API extends ExtensionAPI {
  getAPI(context) {
    return {
      // Insert Experiment API here.
      // Note: the namespace (boilerplate must match the id in the install.rdf)
      tabshideshow: {
        async show(tabIds) {
          show(tabIds, context);
        },
        async hide(tabIds) {
          hide(tabIds, context);
        }
      }
    };
  }
}

