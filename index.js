import { Client, GatewayIntentBits } from "discord.js";
import OpenAI from "openai";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

client.on("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith("!gpt")) return;

  const userPrompt = msg.content.replace("!gpt", "").trim();

  try {
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a Discord server management assistant. You ONLY respond in JSON. Allowed actions: create_channel, delete_channel, rename_channel, create_category, create_role, delete_role."
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const action = JSON.parse(aiResponse.choices[0].message.content);

    if (action.action === "create_channel") {
      await msg.guild.channels.create({
        name: action.name,
        type: action.type === "voice" ? 2 : 0
      });
      return msg.reply(`Created channel: **${action.name}**`);
    }

    if (action.action === "delete_channel") {
      const channel = msg.guild.channels.cache.find(c => c.name === action.name);
      if (channel) {
        await channel.delete();
        return msg.reply(`Deleted channel: **${action.name}**`);
      }
    }

    if (action.action === "rename_channel") {
      const channel = msg.guild.channels.cache.find(c => c.name === action.old);
      if (channel) {
        await channel.setName(action.new);
        return msg.reply(`Renamed channel to: **${action.new}**`);
      }
    }

    if (action.action === "create_category") {
      await msg.guild.channels.create({
        name: action.name,
        type: 4
      });
      return msg.reply(`Created category: **${action.name}**`);
    }

    if (action.action === "create_role") {
      await msg.guild.roles.create({
        name: action.name,
        color: action.color || "Default"
      });
      return msg.reply(`Created role: **${action.name}**`);
    }

    if (action.action === "delete_role") {
      const role = msg.guild.roles.cache.find(r => r.name === action.name);
      if (role) {
        await role.delete();
        return msg.reply(`Deleted role: **${action.name}**`);
      }
    }

  } catch (err) {
    console.error(err);
    msg.reply("There was an error executing this command.");
  }
});

client.login(process.env.BOT_TOKEN);
