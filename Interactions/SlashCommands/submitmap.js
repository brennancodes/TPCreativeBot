const request = require("request-promise");
const cheerio = require("cheerio");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = (client) => {
    client.on('interactionCreate', interaction => {
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
        request(mapUrl, (error, response, html) => {
            if(!error && response.statusCode == 200){
                const $ = cheerio.load(html);
                title = $('.card-title').find('b').first().text() 
                author = $('.card-title').find('b').last().text();
            }
            else {
                console.log(error, response.statusCode);
            }
        }).then(function(){
            const embed = new EmbedBuilder()
                .setColor('#7bcf5c')
                .setThumbnail(imageUrl)
                .setAuthor({name: "Confirm Map Submission", iconURL: iconUrl})
                .setDescription('Title: **'+title+'**\n'
                                + 'Map ID: **'+code+'**\n'
                                + 'Author: [**' + author + '**](' + baseUrl + 'profile/' + author.split(" ").join("_") + ')\n\n'
                                + '[**Test Map**](' + baseUrl + 'test/' + code + ')');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ConfirmMapSubmission').setStyle(ButtonStyle.Primary).setLabel('Confirm'),
                new ButtonBuilder().setCustomId('CancelMapSubmission').setStyle(ButtonStyle.Secondary).setLabel('Cancel')
            )
            interaction.reply({ embeds:[embed], content:"*Verify that you've selected the correct map for submission.* \n*You can click the thumbnail to see a full-size image.*", ephemeral: true, components: [row] })
        })
    })
}