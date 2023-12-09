////// Import modulo
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, SlashCommandBuilder , Collection } = require('discord.js');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fetch = require("node-fetch");
const file = require("fs");
const { ActionRowBuilder, ButtonStyle, ButtonBuilder } = require("discord.js");
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
	],
});

////////////////////////////////////////////////////////////////////////////////////////////////

// Setting commands

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Token

const { token } = require('./config.json');
const { error } = require('node:console');
// API_URL = 'https://api-inference.huggingface.co/models/Hobospider132/DialoGPT-Mahiru-Proto';


/////////////////////////////////////////////////////////////////////////////////////////////////////
// Commands handle

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});





//////////////////////////////////////////////////////////////////////////////////////////////////////
// Message handle

let image_data;

async function image_load(name){
    //const response = await fetch("https://safebooru.org/index.php?page=dapi&s=post&q=index&limit=5000&pid=0&json=1");
    const list = ["waifu", "neko", "shinobu", "hug", "awoo", "smug", "bonk", "yeet", "blush", "smile", "wave", "highfive", "handhold", "nom", "happy", "wink", "poke"];
	const response = await fetch("https://api.waifu.pics/sfw/" + name);
	const data = await response.json();
    return data
}

// async function image_load_nsfw(){
//     //const response = await fetch("https://safebooru.org/index.php?page=dapi&s=post&q=index&limit=5000&pid=0&json=1");
// 	const list = ["waifu", "neko", "trap", "blowjob"];
//     rand = Math.floor(Math.random() * 4);
//     const response = await fetch("https://api.waifu.pics/nsfw/" + list[rand]);
// 	const data = await response.json();
//     return data
// }

async function anime_load(){
    const data = await require("./anime.json");
    rand = Math.floor(Math.random() * data.data.length);
    return data.data[rand];
}

function read_file(){
    const raw_data = require("./anime.json");
    const _list = raw_data.data;
    const list = []
    for (let i = 0; i < _list.length; i++){
        const temp = _list[i].synonyms;
        list.push(temp);
    }
    return list;
}

function search(list, name){
    for (let i = 0; i < list.length; i++){
        if (list[i].toLocaleLowerCase().includes(name.toLocaleLowerCase())){
            return true;
        }
    }   
    return false;
}

function anime_search(name){
    const raw_data = require("./anime.json");
    const data = raw_data.data;
    const list = [];
    for (let i = 0; i < data.length; i++){
        if (anime_list[i] != undefined && anime_list[i][0] != undefined){
            if ((search(anime_list[i], name) || data[i].title.toLocaleLowerCase().includes(name.toLocaleLowerCase())) && !data[i].tags.includes("hentai")){
                list.push(data[i]);
            }
        }
    }
    return list;
}

const anime_list = read_file();

async function reply(message, pages, buttons, timeout = 60000, footer = 'Page {current}/{total}'){

    if (!pages) throw new Error("No pages provided.");
    if (pages.length === 1) throw new Error("There is only one page.");

    if (isNaN(timeout)) throw new Error("Timeout is not a number.");
    if (timeout < 0) throw new Error("Timeout cannot be less than 0.");

    //if (!interaction) throw new Error("No interaction provided.");

    if (typeof footer !== "string") throw new Error("Footer is not a string.");

    if (!buttons) throw new Error("No buttons provided.");
    if (buttons.length !== 4 && buttons.length !== 2) throw new Error("There must be either 2 or 4 buttons.");
    if (buttons.length === 4 && buttons[0].data.style === ButtonStyle.Link || buttons[1].data.style === ButtonStyle.Link || buttons[2].data.style === ButtonStyle.Link || buttons[3].data.style === ButtonStyle.Link) throw new Error("Buttons cannot be links.");
    if (buttons.length === 2 && buttons[0].data.style === ButtonStyle.Link || buttons[1].data.style === ButtonStyle.Link) throw new Error("Buttons cannot be links.");

    //if (!interaction.deferred) await interaction.deferReply();

    let currentPage = 0;

    const initialButtons = [];

    // There's probably a better way to do this but my brain is fried.
    if (buttons.length === 4) {
        initialButtons.push(buttons[0].setDisabled(true));
        initialButtons.push(buttons[1].setDisabled(true));
        initialButtons.push(buttons[2].setDisabled(false));
        initialButtons.push(buttons[3].setDisabled(false));
    }

    if (buttons.length === 2) {
        initialButtons.push(buttons[0].setDisabled(true));
        initialButtons.push(buttons[1].setDisabled(false));
    }

    // Set the initial embed and buttons.
    const page = await message.channel.send({
        embeds: [
            pages[0]
            .setFooter({text: footer.replace("{current}", currentPage + 1).replace("{total}", pages.length)})
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(initialButtons)
        ],
    });

    const filter = (click) => click.user.id === message.author.id
    const collector = page.createMessageComponentCollector({
        filter,
        time: timeout,
    });

    collector.on("collect", async (i) => {

        const update = async () => {
            let buttonsArray = [];

            // If there are 4 buttons (first, previous, next, last)
            // Set the correct buttons to disabled if they are on the first or last page.
            if (buttons.length === 4) {
                if (currentPage === 0) {
                    buttonsArray.push(buttons[0].setDisabled(true));
                    buttonsArray.push(buttons[1].setDisabled(true));
                } else {
                    buttonsArray.push(buttons[0].setDisabled(false));
                    buttonsArray.push(buttons[1].setDisabled(false));
                }
                if (currentPage === pages.length - 1) {
                    buttonsArray.push(buttons[2].setDisabled(true));
                    buttonsArray.push(buttons[3].setDisabled(true));
                } else {
                    buttonsArray.push(buttons[2].setDisabled(false));
                    buttonsArray.push(buttons[3].setDisabled(false));
                }
            }

            // If there are 2 buttons (previous, next)
            // Set the correct buttons to disabled if they are on the first or last page.
            if (buttons.length === 2) {
                if (currentPage === 0) {
                    buttonsArray.push(buttons[0].setDisabled(true));
                } else {
                    buttonsArray.push(buttons[0].setDisabled(false));
                }
                if (currentPage === pages.length - 1) {
                    buttonsArray.push(buttons[1].setDisabled(true));
                } else {
                    buttonsArray.push(buttons[1].setDisabled(false));
                }
            }

            // Update the page to the new page
            await i.update({
                embeds: [
                    pages[currentPage]
                    .setFooter({text: footer.replace("{current}", currentPage + 1).replace("{total}", pages.length)})
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(buttonsArray)
                ],
            });
            await collector.resetTimer();
        };

        // First button. If there are 4 buttons, it will go to the first page. If there are 2 buttons, it will go to the previous page.
        if (i.customId == buttons[0].data.custom_id) {
            if (currentPage !== 0) {
                if (buttons.length === 4) currentPage = 0;
                if (buttons.length === 2) currentPage--; 
                await update();
            }
        // Second button. If there are 4 buttons, it will go to the previous page. If there are 2 buttons, it will go to the next page.
        } else if (i.customId == buttons[1].data.custom_id) {
            if (buttons.length === 4) {
                if (currentPage !== 0) {
                    currentPage--;
                    await update();
                }
            } else if (buttons.length === 2) {
                if (currentPage < pages.length - 1) {
                    currentPage++;
                    await update();
                }
            }
        // Third button. If there are 4 buttons, it will go to the next page. If there are 2 buttons, it will do nothing.
        } else if (buttons[2] && i.customId == buttons[2].data.custom_id) {
            if (currentPage < pages.length - 1) {
                currentPage++;
                await update();
            }
        // Fourth button. If there are 4 buttons, it will go to the last page. If there are 2 buttons, it will do nothing.
        } else if (buttons[3] && i.customId == buttons[3].data.custom_id) {
            if (currentPage !== pages.length - 1) {
                currentPage = pages.length - 1;
                await update();
            }
        }

    });

    // If the collector times out, disable all the buttons.
    collector.on("end", async () => {
        try {
            await page.edit({
                components: [
                    new ActionRowBuilder()
                        .addComponents(buttons.map(b => b.setDisabled(true)))
                ],
            });
        } catch (error) {
            // Do nothing
        }
    });

}

const firstPageButton = new ButtonBuilder()
    .setCustomId('first')
    .setEmoji('1029435230668476476')
    .setStyle(ButtonStyle.Primary);

const previousPageButton = new ButtonBuilder()
    .setCustomId('previous')
    .setEmoji('1029435199462834207')
    .setStyle(ButtonStyle.Primary);

const nextPageButton = new ButtonBuilder()
    .setCustomId('next')
    .setEmoji('1029435213157240892')
    .setStyle(ButtonStyle.Primary);

const lastPageButton = new ButtonBuilder()
    .setCustomId('last')
    .setEmoji('1029435238948032582')
    .setStyle(ButtonStyle.Primary);

const buttons = [ firstPageButton, previousPageButton, nextPageButton, lastPageButton ];

client.once(Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
	if(message.author.id === client.user.id) return;

    if (message.content.toLowerCase() === 's!help'){
        const Embed = new EmbedBuilder()
	        .setTitle("Commands help")
	        .setDescription('hello\nr\ncheek poke\nanime\nsend')

        message.channel.send({ embeds: [Embed] });
    }

    else if (message.content.toLowerCase() === "s!hello"){
        message.reply(`Hello ${message.author}-san`)
    }
    else if (message.content.toLowerCase().startsWith("s!r ")){
        let str = message.content.slice(4);
        if (!isNaN(str.toString())){
            let rand = Math.floor(Math.random() * (0 + str)) + 1;
            const exampleEmbed = new EmbedBuilder()
	            .setDescription('==>  ' + rand.toString());
            message.channel.send({ embeds: [exampleEmbed] });
        } else {
            message.reply("Invalid!");
        };
    }

    else if (message.content.toLocaleLowerCase().startsWith("s!search ")){
        let name = message.content.slice(9);
        const list = anime_search(name);
        if (list.length === 1){
            const Embed = new EmbedBuilder()
	            .setTitle(list[0].title)
	            .setDescription(list[0].sources[0])
                .setImage(list[0].picture)
            message.channel.send({ embeds: [Embed] });
        }
        else if (list.length != 0){
            const pages = [];
            for (let i = 0; i < list.length; i++){
                const Embed = new EmbedBuilder()
	                .setTitle(list[i].title)
	                .setDescription(list[i].sources[0])
                    .setImage(list[i].picture)
                //message.channel.send({ embeds: [Embed] });
                pages.push(Embed);
            }
            reply(message, pages, buttons);
        }
        else {
            message.reply("Cannot find the anime!");
        }
    }

    else if (message.content.toLowerCase() === "s!cheek poke"){
        const file = new AttachmentBuilder('./images/cheek.jpg');
        const exampleEmbed = new EmbedBuilder()
	        .setTitle(`${message.author.username}-kun no BAKA!!!`)
            .setImage('attachment://cheek.jpg')

        message.channel.send({ embeds: [exampleEmbed] , files: [file]});
    }
	// else if (message.content.toLowerCase() === "sss!nsfw"){
	//  	if (message.channel.nsfw){
    //         image_data = await image_load_nsfw();
	//  	    message.channel.send({ files: [{ attachment: image_data.url , name: "SPOILER_FILE.png"}]});
    //     }
    //     else {
    //         const file = new AttachmentBuilder('./images/no_horny.png');
    //         const exampleEmbed = new EmbedBuilder()
	//             .setTitle(`${message.author.username} NO HORNY!!!`)
    //             .setImage('attachment://no_horny.png')

    //         message.channel.send({ embeds: [exampleEmbed] , files: [file]});
    //     }
	// }

    else if (message.content.toLowerCase() === "s!anime"){
        data = await anime_load();
        const exampleEmbed = new EmbedBuilder()
	        .setTitle(data.title)
	        .setDescription(data.sources[0])
            .setImage(data.picture)

        message.channel.send({ embeds: [exampleEmbed] });
    }

    else if (message.content.toLowerCase().startsWith("s!send ")){
		let name = message.content.slice(7);
        const list = ["waifu", "neko", "shinobu", "hug", "awoo", "smug", "bonk", "yeet", "blush", "smile", "wave", "highfive", "handhold", "nom", "happy", "wink", "poke"];
        if (name === "help"){
            const Embed = new EmbedBuilder()
	            .setTitle("Send commands")
	            .setDescription("waifu\nneko\nshinobu\nhug\nawoo\nsmug\nbonk\nyeet\nblush\nsmile\nwave\nhighfive\nhandhold\nnom\nhappy\nwink\npoke")

            message.channel.send({ embeds: [Embed] });
        }

        else if (list.includes(name)){
            image_data = await image_load(name);
		    message.channel.send({ files: [{ attachment: image_data.url }]});
        }
        
        else {
            message.reply("Invalid commands!");
        }
	}
    else if (message.content.toLowerCase() === "s!mahiru"){
        let rand = Math.floor(Math.random() * 149) + 1;
        const url = './images/mahiru/' + rand + '.jpg'
        const file = new AttachmentBuilder('./images/mahiru/' + rand + '.jpg', {name: 'sample.jpg'});
        const exampleEmbed = new EmbedBuilder()
	        .setTitle('Mahiru-chan')
            .setImage('attachment://sample.jpg')

        message.channel.send({ embeds: [exampleEmbed] , files: [file]});
    }

    else if (message.content.includes("<@1061259975537741824>")){
        message.reply("He's gone ...\nForever...");
    }

    //console.log(message.channel.name);
    if (message.channel.name === "cult-of-clc10"){
        const date = new Date();
        const content = date + '\n' + message.channel.name + '\n' + message.author.username + '\n' + message.content + '\n\n';
        file.appendFile('./log.txt', content, err => {
            if (err) {
              console.error(err);
            }
        });
    }
})
client.login(token);