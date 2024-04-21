const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json");

module.exports = async (client, interaction) => {
    let isValid = true;
    const currentDate = new Date()
    const msgSplit = interaction.message.embeds[0].description.split("ID: **")
    const msgSplit2 = msgSplit[1].split("**");
    const mapId = msgSplit2[0];
    const mtcChannel = client.channels.cache.get(config.channels.mtc);
    if (config.mtcSettings.awaitMTCAction) {
        const pins = await mtcChannel.messages.fetchPinned(true);
        pins.sort(function(a,b){
            return b.createdAt-a.createdAt;
        })
        pins.forEach(async x=>{
            if (x.content.includes(interaction.user.id) && x.content.includes("map submission [")){
                // If MTC is taking way too long, skip this, otherwise if we just got a submission from them, stop them.
                if (((currentDate - x.createdAt)/3600000).toFixed(2) < config.mtcSettings.bypassAwaitHourThreshold){
                    isValid = false;
                    await interaction.editReply({content:"You still have a submission under review. Please try again later.", ephemeral:true})
                    return isValid;
                }            
            }
        })
    }
    if (config.mtcSettings.preventResubmit || config.mtcSettings.submitCooldownHours > 0) {
        await mtcChannel.messages.fetch({limit:100}).then(async fetchedMessages =>{
            fetchedMessages.sort(function(a,b){
                return b.createdAt-a.createdAt;
            })
            const msgArray = Array.from(fetchedMessages);
            for (var i = 0; i < msgArray.length; i++){
                var x = msgArray[i][1];
                if (x.content != null){
                    // If we find an earlier submission from this user...
                    if (x.content.includes(interaction.user.id) && x.content.includes("map submission [")){
                        // If we're preventing resubmission, check all messages for a matching ID, cancel submission if match found
                        if (config.mtcSettings.preventResubmit){
                            if (x.content.substring(x.content.indexOf(`\``)+1, x.content.lastIndexOf(`\``)) == mapId){
                                isValid = false;
                                interaction.editReply({content:`This map has already been submitted, most recently on ${x.createdAt.toLocaleString()}.`, ephemeral:true})
                                return isValid;
                            }
                        }
                        // If we're slowing submissions, block submission if it's been less than the cooldown
                        else if (config.mtcSettings.submitCooldownHours > 0){
                            if (((currentDate - x.createdAt)/3600000).toFixed(2) < config.mtcSettings.submitCooldownHours){
                                isValid = false;
                                interaction.editReply({content:`You are submitting too frequently. Try again in ${((config.mtcSettings.submitCooldownHours*60) - ((currentDate - x.createdAt)/60000)).toFixed(2)} minutes.`,ephemeral:true})
                                return isValid;
                            }
                        }
                    }
                }
            }

            // messages.forEach(x=>{
            //     if (x.content != null){
            //         // If we find an earlier submission from this user...
            //         if (x.content.includes(interaction.user.id) && x.content.includes("New map submission [")){
            //             // If we're preventing resubmission, check all messages for a matching ID, cancel submission if match found
            //             if (config.mtcSettings.preventResubmit){
            //                 if (x.content.substring(x.content.indexOf(`\``)+1, x.content.lastIndexOf(`\``)) == mapId){
            //                     isValid = false;
            //                     interaction.editReply({content:`This map has already been submitted, most recently on ${x.createdAt}.`, ephemeral:true})
            //                     return isValid;
            //                 }
            //             }
            //             // If we're slowing submissions, block submission if it's been less than the cooldown
            //             else if (config.mtcSettings.submitCooldownHours > 0){
            //                 if (((currentDate - x.createdAt)/3600000).toFixed(2) < config.mtcSettings.submitCooldownHours){
            //                     isValid = false;
            //                     interaction.editReply({content:`You are submitting too frequently. Try again in ${((config.mtcSettings.submitCooldownHours*60) - ((currentDate - x.createdAt)/60000)).toFixed(2)} minutes.`,ephemeral:true})
            //                     return isValid;
            //                 }
            //             }
            //         }
            //     }
            // })
        })
    }
    return isValid;
}