const {EmbedBuilder} = require("discord.js")
const config = require("../../config.json");

module.exports = (client) => {
    client.on('interactionCreate',interaction => {
        try {
            if (!interaction.isChatInputCommand()){
                return false;
            }
            if (interaction.commandName != "commands"){
                return false;
            }
            var commandList = [
                {
                    commandName: "commands",
                    parameters: "None",
                    description: "List all commands available to me.",
                    roles: "any"
                },
                {
                    commandName: "submitmap",
                    parameters: "FortunateMaps Code",
                    description: "Submit a map hosted on https://fortunatemaps.herokuapp.com to the Map Test Committee. Submissions may be added to the base game.",
                    roles: "any"
                },
                {
                    commandName: "findmap",
                    parameters: "Map Name",
                    description: "Search for a map currently in the Rotation, Trial, Classic, Retired, or Groups playlists",
                    roles: "any"
                },
                {
                    commandName: "getfeedback",
                    parameters: "FortunateMaps Code",
                    description: "Review feedback from the MTC on a submitted map. You may want to use this input to refine your map and resubmit it.",
                    roles: "any"
                },
                {
                    commandName: "rotationsummary",
                    parameters: "None",
                    description: "View the current State of Rotation, including CTF/NF balance, weighted size, and average scores broken down by categories.",
                    roles: "mtc"
                },
                {
                    commandName: "getcurrentrating",
                    parameters: "Map Name",
                    description: "Select a map that does not have a public score to view the true current score.",
                    roles: "mtc"
                },
                {
                    commandName: "removemap",
                    parameters: "Map Name",
                    description: "Select a map in rotation to vote on its removal.",
                    roles: "mtc"
                },
                {
                    commandName: "updatemap",
                    parameters: "Map Name, then new category + weight",
                    description: "MTC Admins can use this method to change settings for existing maps in rotation.",
                    roles: "mtcAdmin"
                }
            ]    
        
            const isMTC = interaction.member.roles.cache.some(r=>r.id == config.roles.mtc)
            const isMTCAdmin = interaction.member.roles.cache.some(r=>r.id == config.roles.mtcAdmin)

            var descriptionString = "";
            for (var i = 0; i < commandList.length; i++){
                if (commandList[i].roles == "any"){
                    descriptionString += `**/${commandList[i].commandName}** ${commandList[i].parameters != "None" ? "("+commandList[i].parameters+")" : ""}\n${commandList[i].description}\n\n`
                }
                if (isMTC && commandList[i].roles == "mtc"){
                    descriptionString += `**/${commandList[i].commandName}** (${commandList[i].parameters}) - *MTC only*\n${commandList[i].description}\n\n`
                }
                if (isMTCAdmin && commandList[i].roles == "mtcAdmin"){
                    descriptionString += `**/${commandList[i].commandName}** (${commandList[i].parameters}) - *MTC Admins only*\n${commandList[i].description}\n\n`
                }
            }

            const iconUrl = "https://b.thumbs.redditmedia.com/g0IY6wWcORTUY8i8vUbloTAC_N6i1qwcZqhN5UiNvLs.jpg"
            const embed = new EmbedBuilder()
                .setColor('#CDDC39')
                .setAuthor({name: "Commands List", iconURL: iconUrl})
                .setDescription(`${descriptionString}\n*Developed by Moosen with API integrations from DaEvil1.\nContact <@${config.users.botOwner}> for assistance.*`)
                //.setFooter({text:`The TagPro Creative Bot was developed exclusively by Moosen with API integrations from DaEvil1. There are bound to be bugs, so please click my name and message me if you discover anything weird happening. Otherwise, happy mapping!`})

            interaction.reply({embeds:[embed],ephemeral:true})
            
            // Need to get user's roles, then dynamically respond to them based on what they're allowed to see
            // if (user.roles.includes(mtcLeaderId)) { commandList }
            // else if (user.roles.includes(mtcId)) { commandList.filter(x => !x.roles == "mtc-leader") }
            // else { commandList.filter(x => !x.roles == "mtc-leader" && !x.roles == "mtc") }
        }
        catch (err) {
            console.log(err);
        }
    
    });

    
}