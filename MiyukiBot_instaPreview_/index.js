const Discord = require("discord.js")
const { MessageEmbed } = require('discord.js');
const { Client, Intents } = require('discord.js');
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});
const https = require('https');
const config = require("./config.json")
const galleryCacheClass = require("./testGallery.js");
const galleryCache = new galleryCacheClass();
const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));
client.on("ready", () => {
        console.log("Bot has initialized")
    })
client.on("messageCreate", async Message => {
    //check if message author is bot and return
    if (Message.author.bot) return;
    //check if message has contents
    if (!Message.content) return;
    //remove mentions
    Message.content = Message.content.replace(/<[@!#&]!?\d{18}>/g,'')
    //check for masked and marked as spoilers links
    if (Message.content.includes('||') || Message.content.includes('<')) return;
    // wait abit since brain dead
    await wait(2000)
    // check for discord own embed 
    if (Message?.embeds[0]?.url.includes('instagram') && !Message?.embeds[0]?.title.includes('Login')) return;
    // get urls from message
    var links = [...Message.content.split(/\n|\s|\r|\t|\0/g).filter(e => /www.instagram.com\/\w+\/(.{11})/.test(e))]
    if (links.length > 0) {
        for (let link of links) {

            link = `https://${/((?:www\.)?instagram.com\/\w+\/.{11,39})/.exec(link)[0]}`
            link = (link.includes('?')) ? `${link}&__a=1` : `${link}?__a=1`
            //make request
            try {
                https.get(link,{
                    headers: {
                        // 'Cookie': 'csrftoken=TOKEN;sessionid=SESSIONID'
                        'Cookie': config.cookie
                    }
                }, async (response) => {

                    var result = ''
                    response.on('data', function (chunk) {
                        result += chunk;
                    });
                
                    response.on('end', async function () {
                       // console.log(result);
                        await wait(500)

                        sendEmbed(result, Message)
                    });
                
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
	const curPage = await msg.edit({embeds:[pages[page].setFooter({text:`Page ${page + 1} / ${pages.length}`})]})
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
            }
        });
	return curPage;
};
async function sendEmbed(data, Message) {
	try {
    var json = JSON.parse(data)
	if(!json) return
	var multiPics = (json.items[0].carousel_media) ? true :false

//checking if it has multiple pics / video 
 var content = (json.items[0].carousel_media && json.items[0].carousel_media.find(e=>e.video_versions)?.video_versions && json.items[0].carousel_media) ? json.items[0].carousel_media.find(e=>e.video_versions).video_versions[0].url :  (json.items[0].video_versions)? json.items[0].video_versions[0].url : ""
    const embed = {

        "description": (json.items[0].caption) ? json.items[0].caption.text : "",
        "footer": {
            "text": "Instagram",
            "icon_url": "https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png"
        },
        "fields":[{"name":"Likes","value":`${json.items[0].like_count}`,"inline":true}],
        "author": {
            "name": json.items[0].user.username,
            "url": `https://www.instagram.com/${json.items[0].user.username}`,
            "icon_url":`${json.items[0].user.profile_pic_url}`
        },
        "color": 13500530,
        "color": 13500530,
        "image": {
            "url": (json.items[0].carousel_media) ? json.items[0].carousel_media[0].image_versions2.candidates[0].url : json.items[0].image_versions2.candidates[0].url
        }
    };
    if (embed.description.length >= 1900) {
        embed.description = 'TOO LONG TO PREVIEW#EmbedLimitation'
    }
  
    let message = await Message.channel.send({content:(content && multiPics) ? '📽️🖼️' : (content) ? '📽️' : (multiPics) ? "🖼️" : " ",embeds:[embed]})
    var shortcodeId = json.items[0].id
    if (multiPics) {
        if (!galleryCache.getCache('/ids').hasOwnProperty(shortcodeId)){
        galleryCache.setCache('/ids',{[shortcodeId]:json.items[0].carousel_media.map(e=>e.image_versions2.candidates[0].url)})
        }
    }
if (json.items[0].carousel_media){
    test=galleryCache.getCache('/ids')
var pages = [
];
const { MessageEmbed } = require('discord.js');
 emojiList=['⏪', '⏩']
for (let i = 0; i < test[shortcodeId].length; i++) {
     receivedEmbed = message.embeds[0];
    exampleEmbed = new MessageEmbed(receivedEmbed)
.setImage(test[shortcodeId][i])
pages.push(exampleEmbed)
}



paginationEmbed(message, pages, emojiList, config.cacheTimeMs,shortcodeId,galleryCache);
}

    if (content) {
        Message.channel.send(content);

    }
    Message.channel.messages.fetch({ limit: 1 }).then(messages => {
        let lastMessage = messages.first();

      }).catch(console.error);
	} catch(e){
		console.log(e)
	}
}




client.login(config.token)
