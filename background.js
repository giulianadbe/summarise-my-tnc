// insert stuff
// chrome.action.setBadgeBackgroundColor({color: '#4688F1'});
console.log("I wonder if this works");

let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});

// https://developer.chrome.com/docs/extensions/mv3/getstarted/