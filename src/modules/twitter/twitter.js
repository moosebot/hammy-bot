const Twit = require('twit');
const url = require('url');

const MessageBuilder = require('../../client').MessageBuilder;
const images = require('../media/images');
const videos = require('../media/videos');

const twitter_client = new Twit({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token: process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const statusIdRegex = /\/status(es)?\/(\d+)/;

const upload_twitter_status = async (twitterUrl) => {
	const status = getStatusId(twitterUrl);

	const response = await twitter_client.get('statuses/show', { id: status.id });
	const data = response.data;

	const segments = build_tweet_text(data);

	if (data.extended_entities) {
		const media = data.extended_entities.media[0];

		if (media.type == 'photo') {
			return handle_photo_tweet(media.media_url, segments);
		} else if (media.type == 'animated_gif') {
			return handle_gif_tweet(media.video_info.variants[0].url, segments);
		} else if (media.type == 'video') {
			const variants = media.video_info.variants;

			for (let i = 0; i < variants.length; i++) {
				if (variants[i].content_type == 'video/mp4' && variants[i].bitrate == 832000) {
					return handle_gif_tweet(variants[i].url, segments);
				}
			}
		}
	}

	return handle_text_tweet(segments);
};

const getStatusId = (uri) => {
	const match = statusIdRegex.exec(url.parse(uri).path);

	return {
		id: match[2]
	};
};

const build_tweet_text = (data) => {
	const builder = new MessageBuilder();
	const segments = builder.italic('"' + data.text + '"').text(' - ').bold('@' + data.user.screen_name).toSegments();

	return segments;
};

const handle_photo_tweet = async (photoUrl, segments) => {
	const msg = await images.upload_from_url(photoUrl);
	return { segments: segments, pictureId: msg.pictureId };
};

const handle_gif_tweet = async (gifUrl, segments) => {
	const msg = await videos.upload_from_url(gifUrl);
	return { segments: segments, pictureId: msg.pictureId };
};

const handle_text_tweet = (segments) => {
	return { segments: segments };
};

module.exports = {
	upload_twitter_status: upload_twitter_status
};
