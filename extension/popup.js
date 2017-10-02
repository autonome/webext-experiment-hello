
document.addEventListener("click", (e) => {
  // Get all tabs
  browser.tabs.query({currentWindow: true}).then(tabs => {

    // Get all tab ids as array
    var ids = tabs.map(tab => tab.id);

    // Show some tabs, and hide the rest
    if (e.target.classList.contains("showsome")) {
      var [showIds, hideIds] = randomSetFromArray(ids);
      browser.tabshideshow.show(showIds);
    }
    // Hide some tabs, show the rest
    if (e.target.classList.contains("hidesome")) {
      var [showIds, hideIds] = randomSetFromArray(ids);
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
});

function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Unique random set from array
function randomSetFromArray(arr) {
  var newLength = randomIntInRange(1, arr.length - 1);
  var matched = [];
  while (matched.length < newLength) {
    var randomIndex = randomIntInRange(0, arr.length - 1);
    var randomVal = arr[randomIndex];
    if (matched.indexOf(randomVal) == -1) {
      matched.push(randomVal);
    }
  }
  var notmatched = arr.filter(val => matched.indexOf(val) == -1)
  return [matched, notmatched];
}
