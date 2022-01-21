const Discord = require("discord.js")
const {
    MessageEmbed
} = require('discord.js');
const { Client, Intents } = require('discord.js');
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});
const req = require("request")
const config = require("./config.json")
const galleryCacheClass = require("./testGallery.js");
//const { debug } = require("request");
const galleryCache = new galleryCacheClass();
const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));
client.on("ready", () => {
    console.log("Bot has initialized")
})
client.on("messageCreate", Message => {
    //check if message author is bot and return
    if (Message.author.bot) return;
    //check if message has contents
    if (!Message.content) return;
    //check for masked and marked as spoilers links
    if (Message.content.includes('||') || Message.content.includes('<')) return;
    // get urls from message
    var links = [...Message.content.split(/\n|\s|\r|\t|\0/g).filter(e => /www.instagram.com\/\w+\/(.{11})/.test(e))]
    if (links.length > 0) {
        for (let link of links) {

            link = `https://${/(www.instagram.com\/\w+\/.{11,39})/.exec(link)[0]}`
            link = (link.includes('?')) ? `${link}&__a=1` : `${link}?__a=1`
            //make request
            try {
                req({
                    url: link,
                    method: "GET",
                    headers: {
                        // 'Cookie': 'csrftoken=TOKEN;sessionid=SESSIONID'
                        'Cookie': config.cookie
                    }
                }, async (e, r, b) => {
                    // console.log('1')
                    await wait(500)

                    sendEmbed(b, Message)
                })
            } catch (e) {
                console.log(e);
            }
            ///test=/(www.instagram.com\/\w+\/.{11})/.exec(link)

        }
    }
})
//wait for reaction
client.on('messageReactionAdd', (reaction, user) => {
    try {
        //check if reaction name ❌
        if (reaction.emoji && reaction._emoji.name == "❌") {
            //check if the message was sent by the bot 
            if (reaction.message.author.id != client.user.id) return;
            //delete msg
            reaction.message.delete({
                timeout: 500
            });
        }
    } catch (e) {
        console.log(e);
    }
})
//copied from https://github.com/saanuregh/discord.js-pagination/blob/master/index.js
paginationEmbed = async (msg, pages, emojiList = ['⏪', '⏩'], timeout = 120000,id,galleryCache) => {
	if (!msg && !msg.channel) throw new Error('Channel is inaccessible.');
	if (!pages) throw new Error('Pages are not given.');
	if (emojiList.length !== 2) throw new Error('Need two emojis.');
	let page = 0;
	const curPage = await msg.channel.send({embeds:[pages[page].setFooter({text:`Page ${page + 1} / ${pages.length}`})]})
	for (const emoji of emojiList) await curPage.react(emoji);
	const reactionCollector = curPage.createReactionCollector({filter:
		(reaction, user) => emojiList.includes(reaction.emoji.name) && !user.bot,time:timeout ,max:100,dispose:true}
	);
	reactionCollector.on('collect', reaction => {
		switch (reaction.emoji.name) {
			case emojiList[0]:
				page = page > 0 ? --page : pages.length - 1;
				break;
			case emojiList[1]:
				page = page + 1 < pages.length ? ++page : 0;
				break;
			default:
				break;
		}
		curPage.edit({embeds:[pages[page].setFooter({text:`Page ${page + 1} / ${pages.length}`})]});
	});
	reactionCollector.on('end', () => {
        galleryCache.deleteCache(`/ids/${id}`)
        console.log('done');
            if (!curPage.deleted) {
                // debugger
                // curPage.reactions.removeAll()
            }
        });
	return curPage;
};
async function sendEmbed(data, Message) {
    try {

        var json = JSON.parse(data)
        var multiPics = (json.graphql.shortcode_media.edge_sidecar_to_children) ? true : false

        //checking if it has multiple pics / video 
        var content = (json.graphql.shortcode_media.__typename == 'GraphSidecar' && json.graphql.shortcode_media?.edge_sidecar_to_children?.edges) ? json.graphql.shortcode_media.edge_sidecar_to_children.edges[0].node?.video_url : json.graphql.shortcode_media.video_url || ""
        const embed = {

            "description": (json.graphql.shortcode_media.edge_media_to_caption.edges[0]) ? json.graphql.shortcode_media.edge_media_to_caption.edges[0].node.text : "",
            "footer": {
                "text": "Instagram",
                "icon_url": "https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png"
            },
            "fields": [{
                "name": "Likes",
                "value": `${json.graphql.shortcode_media.edge_media_preview_like.count}`,
                "inline": true
            }],
            "author": {
                "name": json.graphql.shortcode_media.owner.username,
                "url": `https://www.instagram.com/${json.graphql.shortcode_media.owner.username}`,
                "icon_url": `${json.graphql.shortcode_media.owner.profile_pic_url}`
            },
            "color": 13500530,
            "image": {
                "url": json.graphql.shortcode_media.display_resources.pop().src
            }
        };
        if (embed.description.length >= 1900) {
            embed.description = 'TOO LONG TO PREVIEW#EmbedLimitation'
        }

        let message = await Message.channel.send({content:(content && multiPics) ? '📽️🖼️' : (content) ? '📽️' : (multiPics) ? "🖼️" : "",embeds:[embed]})
        var shortcodeId = json.graphql.shortcode_media.id
        if (multiPics) {
            if (!galleryCache.getCache('/ids').hasOwnProperty(shortcodeId)) {
                galleryCache.setCache('/ids', {
                    [shortcodeId]: json.graphql.shortcode_media.edge_sidecar_to_children?.edges.filter(e => e.node.__typename === 'GraphImage').map(e => e.node.display_url)
                })
            }
        }
        if (json.graphql.shortcode_media.edge_sidecar_to_children?.edges[0].node?.__typename === 'GraphImage') {
            test = galleryCache.getCache('/ids')
         var pages = [];
            const {
                MessageEmbed
            } = require('discord.js');
            emojiList = ['⏪', '⏩']
            for (let i = 0; i < test[shortcodeId].length; i++) {
                receivedEmbed = message.embeds[0];
                exampleEmbed = new MessageEmbed(receivedEmbed)
                    .setImage(test[shortcodeId][i])
                pages.push(exampleEmbed)
            }



            paginationEmbed(message, pages, emojiList,config.cacheTimeMs, shortcodeId, galleryCache);
        }

        if (content) {
            Message.channel.send(content);

        }
        Message.channel.messages.fetch({
            limit: 1
        }).then(messages => {
            let lastMessage = messages.first();

        }).catch(console.error);
    } catch (e) {
        console.log(e)
    }
}
// <-- your pre-filled channel variable




client.login(config.token)
