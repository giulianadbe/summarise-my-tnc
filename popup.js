chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    // get current website url 
    let tab = tabs[0];
    let url = new URL(tab.url);
    var domain = url.hostname;
    var website = document.getElementById('website');

    // fetch the html from the website
    fetch(url).then(function (response) {
        // The API call was successful!
        return response.text();
    }).then(function (data) {
        // search for the <footer> tag 
        var parser = new DOMParser();
        var doc = parser.parseFromString(data, 'text/html');
        var footer = doc.querySelector('footer');
        var box = document.getElementById('box');

        // search for the <a> tag with the terms & conditions in footer
        // get href values in the footer
        let array = [];
        let links = footer.getElementsByTagName("a");
        for (var i=0, max=links.length; i<max; i++) {
            array.push(links[i].href);
        }

        // try match regex for selected keywords
        let regexList = [/term/, /condition/, /legal/, /agreement/]; // do research here
        let matches = [];
        array.forEach((link) => {
            matches = regexList.filter((word) => word.test(link.toLowerCase()));
            if (matches.length === 0) {
                console.log("No matches");
            } else {
                // chrome://extension
                // or new
                if (link.split('/')[0] === 'chrome-extension:') {
                    let content = link.split('/');
                    content.shift();
                    content.shift();
                    content.shift();
                    box.textContent = 'https://' + domain + '/' + content.join('/');
                } else {
                    box.textContent = link;
                }
                // output match
                return;
            }
        });
    }).catch(function(err) {
        console.warn('Something went wrong.', err);
    });
});
