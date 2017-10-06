// fansite.js
// create your own fansite using your miniWeb framework
const App = require('./miniWeb.js').App;
const app = new App();
const PORT = 8080;
const HOST = '127.0.0.1';

app.get('/', function(req, res) {
    res.sendFile('/html/index.html');
});
app.get('/about', function (req, res) {
    res.sendFile('/html/about.html');
});

app.get('/rando', function (req, res) {
    res.sendFile('/html/random.html');
});
app.get('/home', function (req, res) {
    res.redirect(301, '/');
});

app.get('/main.css', function (req, res) {
   res.sendFile('/css/main.css');
});

app.get('/bmo1.gif', function (req, res) {
   res.sendFile('/img/bmo1.gif');
});
app.get('/random_image', function (req, res) {
    const imageArray = ['/img/bmo1.gif', '/img/instagram_icon.png', '/img/tumblr_icon.png', '/img/twitter_icon.png'];
    let randomIndex = Math.floor(Math.random() * imageArray.length);
    res.sendFile(imageArray[randomIndex]);
});

app.listen(PORT, HOST);