'use strict';
const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "ExtensionParent",
  "resource://gre/modules/ExtensionParent.jsm");

/**********************************************************

Tabs hide/show experiment


TODO

* Implement events
  * onShow
  * onHide

* Implement tab.visible

* Always at least one tab visible.
  * First confirm existing behavior of hide all.
  * Either throw exception or leave one tab visible.

* Pinned tabs - test how they're handled.


**********************************************************/

var context = null;

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

/**********************************************************

For show/hide tab bar experiment

**********************************************************/

const windowTracker = ExtensionParent.apiManager.global.windowTracker;

let tabsVisible = true;
let observerList = []

// We use the collapsed property instead of the hidden property so we don't
// cutoff tab events.
function hideTabBar(window) {
  let toolbar = window.document.getElementById("TabsToolbar");
  toolbar.style.visibility = 'collapse';
  /*
  let observer = new window.MutationObserver(mutations =>
    mutations.forEach(mutation => {
      if (!mutation.target.collapsed) {
        mutation.target.collapsed = true;
      }
    })
  ).observe(toolbar, {attributes: true, attributeFilter: ["collapsed"]});
  observerList.push(observer);
  */
}

function showTabBar(window) {
  let toolbar = window.document.getElementById('TabsToolbar');
  // TODO: why does this have no effect?
  //toolbar.collapsed = false;
  // This works though.
  toolbar.style.visibility = 'visible';
}


/*
let tabsVisilityTracker = new EventEmitter();
let tabVisibilityManager = {
  // Set of extension contexts that requested the tabstrip to be hidden.
  tabHidingContexts: new Set(),

  get tabsVisibility() {
    return this.tabHidingContexts.size == 0;
  },

  set tabsVisibility(isVisible) {
    this._updateCurrentWindowsTabsVisibility(isVisible);

    if (!isVisible) {
      tabsVisilityTracker.emit("visibilityChange", true);

      this._hideTabs = (window) => {
        // The titlebar height is calculated dynamically, let TabsInTitlebar
        // do its job first then collapse the tabstrip on the next tick.
        Promise.resolve().then(() => {
          this._updateTabsVisibility(window, false);
        });
      };

      windowTracker.addOpenListener(this._hideTabs);
    } else {
      tabsVisilityTracker.emit("visibilityChange", false);
      windowTracker.removeOpenListener(this._hideTabs);
    }
  },

  _updateCurrentWindowsTabsVisibility(isVisible) {
    for (let window of windowTracker.browserWindows()) {
      this._updateTabsVisibility(window, isVisible);
    }
  },

  _updateTabsVisibility(window, isVisible) {
    let toolbar = window.document.getElementById("TabsToolbar");
    if (isVisible) {
      toolbar.classList.remove("webext-collapsed");
    } else {
      toolbar.classList.add("webext-collapsed");
    }
  },

  // Do not call directly. Called by contexts when they shut down.
  close(context) {
    this.tabHidingContexts.delete(context);
    if (this.tabHidingContexts.size == 0) {
      this.tabsVisibility = true;
    }
  },

  setTabsVisibility(context, visible) {
    if (!visible) {
      if (this.tabHidingContexts.has(context)) {
        return;
      }
      let wasVisible = this.tabsVisibility;
      this.tabHidingContexts.add(context);
      context.callOnClose(this);
      // First context asking the tabstrip to be hidden.
      if (wasVisible) {
        this.tabsVisibility = false;
      }
    } else {
      // Visible true always takes priority: clear everyone.
      for (let context of this.tabHidingContexts) {
        context.forgetOnClose(this);
      }
      this.tabHidingContexts.clear();
      this.tabsVisibility = true;
    }
  }
};
*/


/**********************************************************

Register APIs

**********************************************************/
class API extends ExtensionAPI {
  getAPI(webextContext) {
    context = webextContext;
    //enableUITweaks();
    return {
      // Insert Experiment API here.
      // Note: the namespace (boilerplate must match the id in the install.rdf)
      tabshideshow: {
        async show(tabIds) {
          show(tabIds, context);
        },
        async hide(tabIds) {
          hide(tabIds, context);
        },
        async getIsVisible() {
          return tabsVisible;
        },
        async setTabBarVisible(visible) {
          if (visible) {
            observerList.forEach(observer => observer.disconnect())
            observerList = []
            windowTracker.off('open', hideTabBar)
            for (let window of windowTracker.browserWindows()) {
              showTabBar(window);
            }
          } else {
            windowTracker.on('open', hideTabBar)
            for (let window of windowTracker.browserWindows()) {
              hideTabBar(window)
            }
          }
          tabsVisible = visible;
        }
      }
    };
  }
}


/**********************************************************

For show/hide UI via manifest experiment

**********************************************************/
//context.extensions.on("startup", (type, extension) => {
function enableUITweaks() {
  const windowTracker = ExtensionParent.apiManager.global.windowTracker;
  let tweak = context.extension.manifest.browser_region_tweak;
  if (!tweak) {
    return;
  }

  if (tweak.tabs_bar && tweak.tabs_bar.visible === false) {
    for (let window of windowTracker.browserWindows()) {
      let toolbar = window.document.getElementById("TabsToolbar");
      toolbar.collapsed = true;
      new window.MutationObserver(mutations =>
        mutations.forEach(mutation => {
          if (!mutation.target.collapsed) {
            mutation.target.collapsed = true;
          }
        })
      ).observe(toolbar, {attributes: true, attributeFilter: ["collapsed"]});
    }
  }
}
//});


