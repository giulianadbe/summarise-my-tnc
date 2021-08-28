chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    // get current website url 
    let url = tabs[0].url;
    var website = document.getElementById('website');
    website.textContent = url;

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
        box.textContent = footer.textContent;

        // search for the <a> tag with the terms & conditions in footer

    }).catch(function (err) {
        // There was an error
        console.warn('Something went wrong.', err);
    });
});

