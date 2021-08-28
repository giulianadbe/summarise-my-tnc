// grab the website we are currently looking at 

// fetch the html from the website
fetch('https://www.theiconic.com.au').then(function (response) {
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
    let regexList = [/term/, /condition/, /legal/]; // do research here
    let matches = [];
    array.forEach((link) => {
        matches = regexList.filter((word) => word.test(link));
        if (matches.length === 0) {
            console.log("No matches");
        } else {
            let content = link.split('/')[3];
            // output match
            box.textContent = 'EDDYS-WEB-LINK' + content;
            return;
        }
    });

}).catch(function (err) {
    // There was an error
    console.warn('Something went wrong.', err);
});