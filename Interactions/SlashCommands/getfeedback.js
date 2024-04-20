const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")

module.exports.execute = (interaction) => {
    if (!interaction.isChatInputCommand()){
        return false;
    }
    if (interaction.commandName != "getfeedback"){
        return false;
    }
    var mapId = interaction.options.data[0].value;
    const mtcChannel = interaction.client.channels.cache.get(config.channels.mtc);

    let response = `All feedback received for map #${mapId}:\n`;
    let feedbackArray = [];

    const allThreads = new Promise(async (resolve,reject)=>{
        const active = await mtcChannel.threads.fetchActive(true);
        const archived = await mtcChannel.threads.fetchArchived(true);
        const activeArray = active.threads.filter(t=>t.name.includes(`${mapId} Feedback`));
        const archivedArray = archived.threads.filter(t=>t.name.includes(`${mapId} Feedback`));
        const all = activeArray.concat(archivedArray);
        if (all.size === 0){
            resolve();
        }
        let i = 0;
        all.forEach(async y=>{
            const msgs = await y.messages.fetch();
            msgs.map(z=>{
                feedbackArray.push(z.content)
                if (i + 1 === all.size){
                    resolve();
                }
            })
            i++
        })
    })

    allThreads.then(()=>{
        for (var i = feedbackArray.length - 1; i >= 0; i--){
            feedbackArray[i].length > 0 ? response += "➢ " + feedbackArray[i] + "\n" : response += "";
        }
        interaction.reply({content:`${response}`,ephemeral:true})
    })        
}