require("dotenv").config();
const { REST } = require("@discordjs/rest");
const config = require("../config.json");
const rest = new REST({ version: 10 }).setToken(process.env.TOKEN);

module.exports = async (interaction, removeEmbeds = false) => {
    var newContent = {};
    if (removeEmbeds == true){
        newContent = {
            components: [],
            embeds: []
        }
    }
    else {
        newContent = {                    
            components: []
        }
    }

    var header = {
        'method' : 'PATCH',
        'Content-Type': 'application/json; charset=UTF-8'
    }

    try {
        var patchUrl = `/webhooks/${config.users.bot}/${interaction.token}/messages/${interaction.message.id}`
        await rest.patch(patchUrl, {headers: header, body:newContent})
    } catch (err) {
        console.log(err)
    }
}