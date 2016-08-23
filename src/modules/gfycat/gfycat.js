var rp = require('request-promise');

var client = require('../../client');
var images = require('../images/images');
var CONFIG = require('../../config');

const GFYCAT_REGEX = /(https?:\/\/gfycat\.com\/\w+)/g;
const GFYCAT_JSON = 'https://gfycat.com/cajax/get/';

module.exports = {
    register: function() {

        client.chat.on('message', function(ev, msg) {
            var matches = msg.match(GFYCAT_REGEX);

            if (matches) {
                client.start_typing(ev);
                for (var i = 0; i < matches.length; i++) {

                    var options = {
                        uri: GFYCAT_JSON + matches[i].split('/').pop(),
                        json: true
                    };
                    rp(options).then(function(data) {
                        var filename = data.gfyItem.gifUrl.split('/').pop();
                        var pictureUrl = data.gfyItem.gifUrl;

                        images.upload_from_url(pictureUrl, filename).then(function(id) {
                            return client.send_message(CONFIG.CLIENT_ID, null, id).then(function() {
                                client.stop_typing(ev);
                            });
                        });
                    });
                }
            }
        });
    }
}
