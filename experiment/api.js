const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;

/*

TODO

* Always at least one tab visible. Pick either exception or leave one visible.

* Pinned tabs - test how they're handled.

* Promisify

* Non-exclusive approach: If show(1, 3), 2 is still visible. If hide(1, 3), 2 is still visible.

Pseudocode:

show([ids])
  get all as native tabs
  get all tab ids
  filter to sets visible/hidden
  tabbrower.showOnlyTheseTabs(visible)

*/

function getAllTabIds() {
  var nativeTabs = context.extension.tabManager.query({}, context);
  var tabIds = nativeTabs.map(nativeTab => tabTracker.getId(nativeTab));

  return tabIds;

  //let tabs = tabIds.map(tabId => tabTracker.getTab(tabId));
  //for (let nativeTab of tabs) {
}

function nativeShowOnlyTheseTabs(tabIds) {
  // Convert tab ids into XUL tabs
  var tabs = tabIds.map(function(tab) {
    return context.extension.tabManager.get(tab.id, null);
  });

  // Get current browser window
  var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
           .getService(Ci.nsIWindowMediator);
  var browserWindow = wm.getMostRecentWindow("navigator:browser");

  // Set visible tabs
  var tabbrowser = browserWindow.gBrowser;
  tabbrowser.showOnlyTheseTabs(tabs);
}

class API extends ExtensionAPI {
  getAPI(context) {
    return {
      // Insert Experiment API here.
      // Note: the namespace (boilerplate must match the id in the install.rdf)
      show: {
        async show(tabIds) {
          nativeShowOnlyTheseTabs(tabIds);
        }
      },
      hide: {
        async hide(tabIds) {
          nativeShowOnlyTheseTabs(tabIds);
        }
      }
    };
  }
}
