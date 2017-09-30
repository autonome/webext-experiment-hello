/*
Listen for clicks in the popup.

If the click is on one of the beasts:
  Inject the "beastify.js" content script in the active tab.

  Then get the active tab and send "beastify.js" a message
  containing the URL to the chosen beast's image.

If it's on a button wich contains class "clear":
  Reload the page.
  Close the popup. This is needed, as the content script malfunctions after page reloads.
*/
document.addEventListener("click", (e) => {
  browser.tabs.query({currentWindow: true, active: true}).then(tabs => {
    // Get all tab ids matching query
    var ids = tabs.map(tab => tab.id);

    // Show some tabs, and hide the rest
    if (e.target.classList.contains("showsome")) {
      var [showIds, hideIds] = randomSetFromArray(ids);
      browser.tabshideshow.show(showIds);
      browser.tabshideshow.hide(hideIds);
    }
    // Show all
    else if (e.target.classList.contains("showall")) {
      browser.tabshideshow.show(ids);
    }
    // Hide all (should fail unless there are pinned tabs)
    else if (e.target.classList.contains("hideall")) {
      browser.tabshideshow.hide(ids);
    }
  });
  window.close();
});

function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Unique random set from array
function randomSetFromArray(arr) {
  var newLength = randomIntInRange(1, arr.length);
  var matched = [];
  var notmatched = [];
  while (newArray.length < newLength) {
    var randomIndex = randomIntInRange(0, arr.length - 1);
    var randomVal = arr[randomIndex];
    if (newArray.indexOf(randomVal) == -1) {
      matched.push(randomVal);
    }
    else {
      notmatched.push(randomVal);
    }
  }
  return [matched, notmatched];
}
