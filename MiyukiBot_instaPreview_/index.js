const Discord = require("discord.js")
const { MessageEmbed } = require('discord.js');
const client = new Discord.Client()
const req = require("request")
const config = require("./config.json")
const command = require("./command")
const galleryCacheClass = require("./testGallery.js");
//const { debug } = require("request");
const galleryCache = new galleryCacheClass();
const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));
const paginationEmbed = require('discord.js-pagination');
client.on("ready", () => {
        console.log("Bot has initialized")
    })
client.on("message", Message => {
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
		link = (link.includes('?')) ? `${link}&__a=1` :  `${link}?__a=1`
                    //make request
                try {
                    req({
                        url: link,
                        method: "GET",
                        headers: {
                            // 'Cookie': 'csrftoken=TOKEN;sessionid=SESSIONID'
                            'Cookie': config.cookie
                        }
                    }, async(e, r, b) => {
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
async function sendEmbed(data, Message) {
 // console.log(data);
    var json = JSON.parse(data)
        //console.log(json);
	var multiPics = (json.graphql.shortcode_media.edge_sidecar_to_children) ? true :false

		//checking if it has multiple pics / video 
	var content = (json.graphql.shortcode_media.__typename == 'GraphSidecar' && json.graphql.shortcode_media?.edge_sidecar_to_children?.edges) ? json.graphql.shortcode_media.edge_sidecar_to_children.edges[0].node?.video_url : json.graphql.shortcode_media.video_url || ""
    const embed = {

        "description": (json.graphql.shortcode_media.edge_media_to_caption.edges[0]) ? json.graphql.shortcode_media.edge_media_to_caption.edges[0].node.text : "",
        "footer": {
            "text": "Instagram",
            "icon_url": "https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png"
        },
        "fields":[{"name":"Likes","value":json.graphql.shortcode_media.edge_media_preview_like.count,"inline":true}],
        "author": {
            "name": json.graphql.shortcode_media.owner.username,
            "url": `https://www.instagram.com/${json.graphql.shortcode_media.owner.username}`,
            "icon_url":`${json.graphql.shortcode_media.owner.profile_pic_url}`
        },
        "color": 13500530,
        "color": 13500530,
        "image": {
            "url": json.graphql.shortcode_media.display_resources.pop().src
        }
    };
	//console.log(embed)
    if (embed.description.length >= 1900) {
        embed.description = 'TOO LONG TO PREVIEW#EmbedLimitation'
    }
	//console.log(multiPics);
  
    let message = await Message.channel.send((content && multiPics) ? '📽️🖼️' : (content) ? '📽️':(multiPics) ? "🖼️" : "", {
        embed
    })
    var shortcodeId = json.graphql.shortcode_media.id
    if (multiPics) {
        if (!galleryCache.getCache('/ids').hasOwnProperty(shortcodeId)){
        galleryCache.setCache('/ids',{[shortcodeId]:json.graphql.shortcode_media.edge_sidecar_to_children?.edges.filter(e=>e.node.__typename === 'GraphImage').map(e=>e.node.display_url)})
        }
    }
  //  await message.react('⬅️');
    //await message.react('➡️')
// Import the discord.js-pagination package
if (json.graphql.shortcode_media.edge_sidecar_to_children?.edges[0].node?.__typename === 'GraphImage'){
    test=galleryCache.getCache('/ids')
const paginationEmbed = require('discord.js-pagination');
var pages = [
];
// Use either MessageEmbed or RichEmbed to make pages
// Keep in mind that Embeds should't have their footers set since the pagination method sets page info there
const { MessageEmbed } = require('discord.js');
// const embed1 = new MessageEmbed();
 emojiList=['⏪', '⏩']
// Create an array of embeds
for (let i = 0; i < test[shortcodeId].length; i++) {
     receivedEmbed = message.embeds[0];
    exampleEmbed = new MessageEmbed(receivedEmbed)
.setImage(test[shortcodeId][i])
pages.push(exampleEmbed)
}



paginationEmbed(message, pages, emojiList, 2 * 60 * 60 * 1000,shortcodeId,galleryCache);
}

    if (content) {
        Message.channel.send(content);

    }
    Message.channel.messages.fetch({ limit: 1 }).then(messages => {
        let lastMessage = messages.first();

      }).catch(console.error);
}
 // <-- your pre-filled channel variable




client.login(config.token)
