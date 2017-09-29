const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;

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
      showonlythesetabs: {
        async showOnlyTheseTabs(tabIds) {
          nativeShowOnlyTheseTabs(tabIds);
        }
      }
    };
  }
}
