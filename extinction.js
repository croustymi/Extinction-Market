const Discord = require("discord.js");
const bot = new Discord.Client();
const cfg = require("config.json");
const fetch = require("node-fetch");
const fs = require("fs");
const schedule = require('node-schedule');
const { privateEncrypt } = require("crypto");

const bot_token = cfg.token;

bot.login(bot_token);

const bot_prefix = cfg.prefix;
const server_id = cfg.serverID;
const admin_id = cfg.adminID;
const channel_id = cfg.channelID;

const bot_author = "Yùmi#0001"

function print(message) {
    return console.log(`> ${message}`);
}

function formK(num){
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

function CheckServer(id){
    if(id === server_id){
        return true;
    }else{
        return false;
    };
};

function CheckAdmin(author){
    let discordserver = bot.guilds.get(server_id);
    if(discordserver.member(author.id).roles.has(admin_id)){
        return true;
    }else{
        return false;
    };
};

var weapons_list = [];
var weaponsAPI = [];

function getWeaponsList() {
    weapons_list = JSON.parse(fs.readFileSync(`./weaponslist.json`));

    print('List of weapons recovered');
};

bot.on('ready', function() {
    print("Bot ready");
    bot.user.setActivity(`the market`, {type: 'WATCHING'});
    
    setTimeout(() => {
        getWeaponsList();
    }, 1000);

    var date = "";
    var dH = "";
    var dM = "";
    var dS = "";
    var finaldate = "";
    var announceEmbed = "";
    
    const job = schedule.scheduleJob('*/5 * * * * *', function(){

        if(weapons_list !== "[]"){

            date = new Date();

            dH = date.getHours();
            dM = date.getMinutes();
            dS = date.getSeconds();
                    
            if(date.getHours() <= 9){
                dH = `0${date.getHours()}`;
            };
            if(date.getMinutes() <= 9){
                dM = `0${date.getMinutes()}`;
            };
            if(date.getSeconds() <= 9){
                dS = `0${date.getSeconds()}`;
            };

            finaldate = `${dH}:${dM}:${dS}`;

            var iterator = weapons_list.keys();
            for(const key of iterator){

                if(weapons_list[key].price === "0") return;

                fetch(weapons_list[key].link)
                    .then(res => res.json())
                    .then(json => weaponsAPI = json);

                if(weaponsAPI !== "[]"){

                    var iterator2 = weaponsAPI.keys();
                    for(const key2 of iterator2){
                        if(weapons_list[key].id === weaponsAPI[key2].itemId){

                            if(weaponsAPI[key2].price <= weapons_list[key].price){

                                announceEmbed = new Discord.RichEmbed()
                                    .setTitle(`New Item available !`)
                                    .setDescription(`
                                        **[FR]** ${weapons_list[key].name} (${weaponsAPI[key2].itemId}) disponible à $${formK(weaponsAPI[key2].price)}, vendu par ${weaponsAPI[key2].seller}.
                                        **[EN]** ${weapons_list[key].name} (${weaponsAPI[key2].itemId}) available at $${formK(weaponsAPI[key2].price)}, sold by ${weaponsAPI[key2].seller}.
                                    `)
                                    .addField('Horodatage / Timestamp', `${finaldate} (Paris, France)`)
                                    .setColor('#ED1B24')
                                    .setFooter(`${bot.user.username} © ${date.getFullYear()} ${bot_author}`)
                                ;
                                let discordserver = bot.guilds.get(server_id);
                                discordserver.channels.get(channel_id).send(announceEmbed);
                            };
                        };
                    };
                };
            };

            print('Market checked');
        };
    });
});

bot.on('message', async message => {

    if(message.content.startsWith(`${bot_prefix}market`)) {

        message.delete();

        if(!CheckServer(message.guild.id)) return;
        if(!CheckAdmin(message.author)) return;

        let args = message.content.split(' ').slice(1);
        let parameter = args.shift();

        args = message.content.split(' ').slice(2);
        let weaponID = args.shift();

        args = message.content.split(' ').slice(3);
        let weaponPrice = args.shift();

        args = message.content.split(' ').slice(4);
        let weaponName = args.shift();

        args = message.content.split(' ').slice(5);
        let weaponLink = args.shift();

        if(parameter === "add"){

            var new_weapon = {
                "id": weaponID,
                "name": weaponName,
                "price": weaponPrice,
                "link": weaponLink
            };

            weapons_list.push(new_weapon);

            fs.writeFileSync(`./weaponslist.json`, JSON.stringify(weapons_list));

            getWeaponsList();

            message.reply(`you added ${weaponName} (ID: ${weaponID}) with price $${weaponPrice}.`).then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });

            print(`Weapon ${weaponName} (ID: ${weaponID}) is added to the list`);

        }else if(parameter === "edit"){

            var iterator = weapons_list.keys();
            for(const key of iterator){
                var found = weapons_list[key].id;

                if(found === weaponID){
                    weapons_list[key].price = weaponPrice;
                    fs.writeFileSync(`./weaponslist.json`, JSON.stringify(weapons_list));
                    getWeaponsList();

                    message.reply(`you edit ${weaponName} (ID: ${weaponID}) with price $${weaponPrice}.`).then((msg) => {
                        setTimeout(() => {
                            msg.delete();
                        }, 5000);
                    });

                    print(`Weapon ${weaponName} (ID: ${weaponID}) is edited`);
                };
            };

        }else if(parameter === "remove"){

            var iterator = weapons_list.keys();
            for(const key of iterator){
                var found = weapons_list[key].id;

                if(found === weaponID){
                    weapons_list[key];
                    /*fs.writeFileSync(`./weaponslist.json`, JSON.stringify(weapons_list));
                    getWeaponsList();

                    message.reply(`vous avez modifié l'arme ${weaponName} (ID: ${weaponID}) au prix de $${weaponPrice}.`).then((msg) => {
                        setTimeout(() => {
                            msg.delete();
                        }, 5000);
                    });*/
                };
            };

            message.reply(`you delete ${weaponName} (ID: ${weaponID}).`).then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });

            print(`Weapon ${weaponName} (ID: ${weaponID}) is deleted from the list`);

        }else if(parameter === "view"){

            var viewids = [];

            var iterator = weapons_list.keys();
            for(const key of iterator){
                var found = `ID: ${weapons_list[key].id} | Prix: $${formK(weapons_list[key].price)}`;

                viewids.push(found);
            };

            var stringid = viewids.toString().replace(",", "\n");

            message.reply(`\n**__IDs List:__**\n\n${stringid}`).then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 30000);
            });
            
        }else if(parameter === "help"){
            message.reply(`the command is **${bot_prefix}market parameter weaponID weaponPrice weaponName APILink**\n\n**__Parameters List:__**\nadd / edit / remove / view\n\n**__Exemple:__**\n${bot_prefix}market add weapon_musket 50000 Musket APILink\n${bot_prefix}market edit weapon_musket 60000\n${bot_prefix}market remove weapon_musket`).then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 20000);
            });
        }else{
            message.reply(`Use **!market help** to know how to use this command.`).then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        };
    };

});
