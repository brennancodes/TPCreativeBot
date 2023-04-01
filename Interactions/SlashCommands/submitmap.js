const request = require("request");
const cheerio = require("cheerio");
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports.execute = (interaction) => {
    if (!interaction.isChatInputCommand()){
        return false;
    }
    if (interaction.commandName != "submitmap"){
        return false;
    }
    var code = interaction.options.data[0].value;
    var baseUrl = "https://fortunatemaps.herokuapp.com/"
    var imageUrl = baseUrl + "preview/" + code + ".jpeg";
    var mapUrl = baseUrl + "map/" + code;
    var iconUrl = baseUrl + "/assets/logo.png"
    var title = "";
    var author = "";

    return request({
        uri: mapUrl,
        method: 'GET'
    }, function(error, response, html){
        if(!error && response.statusCode == 200){
            const $ = cheerio.load(html);
            title = $('.card-title').find('b').first().text() 
            author = $('.card-title').find('b').last().text();
        }
        else {
            console.error(error, response.statusCode);
        }
        if (title == "" && author == ""){
            interaction.reply({content:`Map not found!\nPlease double-check the code \`${code}\` and contact <@${config.users.botOwner}> if you're certain it's correct.`,ephemeral:true,allowedMentions:{"users":[]}})
        }
        else {
            const embed = new EmbedBuilder()
                .setColor('#7bcf5c')
                .setThumbnail(imageUrl)
                .setAuthor({name: "Confirm Map Submission", iconURL: iconUrl})
                .setDescription('Title: [**'+title+'**]('+mapUrl+')\n'
                                + 'Map ID: **'+code+'**\n'
                                + 'Author: [**' + author + '**](' + baseUrl + 'profile/' + author.split(" ").join("_") + ')\n\n'
                                + '[**Test Map**](' + baseUrl + 'test/' + code + ')');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ConfirmMapSubmission').setStyle(ButtonStyle.Primary).setLabel('Confirm'),
                new ButtonBuilder().setCustomId(`CancelMapSubmission---${code}`).setStyle(ButtonStyle.Secondary).setLabel('Cancel')
            )
            interaction.reply({ embeds:[embed], content:"*Verify that you've selected the correct map for submission.* \n*You can click the thumbnail to see a full-size image.*", ephemeral: true, components: [row] })
        }
    })
}