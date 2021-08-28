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
    // box.textContent = footer.textContent;

    // search for the <a> tag with the terms & conditions in footer

}).catch(function (err) {
    // There was an error
    console.warn('Something went wrong.', err);
});