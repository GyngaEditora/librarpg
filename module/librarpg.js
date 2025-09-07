// Import Modules
import { LibraActor } from "./actor/actor.js";
import { LibraActorSheet } from "./actor/actor-sheet.js";
import { LibraItem } from "./item/item.js";
import { LibraItemSheet } from "./item/item-sheet.js";

Hooks.once('init', async function() {

  game.librarpg = {
    LibraActor,
    LibraItem,
    rollItemMacro
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  
  // Define custom Entity classes
  CONFIG.Actor.entityClass = LibraActor;
  CONFIG.Item.entityClass = LibraItem;
  CONFIG.Actor.documentClass = LibraActor;
  CONFIG.Item.documentClass = LibraItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("librarpg", LibraActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("librarpg", LibraItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });
  
  Handlebars.registerHelper('eqs', function(s1, s2) {
	 return (s1 == s2); 
  });
  
  Handlebars.registerHelper('concatenate', function(s1, s2) {
	 return (s1 + s2); 
  });
  
  Handlebars.registerHelper('magicAttrs', function(){
	  return {
		  "forca": game.i18n.format("ficha.atributos.curto.forca"),
		  "agilidade": game.i18n.format("ficha.atributos.curto.agilidade"),
		  "astucia": game.i18n.format("ficha.atributos.curto.astucia"),
		  "porta": game.i18n.format("ficha.atributos.curto.porte")
	  }
  });
  
  Handlebars.registerHelper('magicCircles', function(){
	  return {
		  "0": "",
		  "1": "1",
		  "2": "2",
		  "3": "3",
		  "4": "4",
		  "5": "5",
		  "6": "6"
	  }
  });
  
  Handlebars.registerHelper('sizeChoices', function(){
	  return {
		  "0": game.i18n.format("ficha.selectOptions.tamanhos.minusculo"),
		  "16": game.i18n.format("ficha.selectOptions.tamanhos.muitoPequeno"),
		  "22": game.i18n.format("ficha.selectOptions.tamanhos.pequeno"),
		  "26": game.i18n.format("ficha.selectOptions.tamanhos.medio"),
		  "32": game.i18n.format("ficha.selectOptions.tamanhos.grande"),
		  "38": game.i18n.format("ficha.selectOptions.tamanhos.muitoGrande"),
		  "46": game.i18n.format("ficha.selectOptions.tamanhos.imenso"),
	  }
  });
  
  Handlebars.registerHelper('skillChoices', function(){
	  return {
		  "0": game.i18n.format("ficha.selectOptions.nivelPericia.inabil"),
		  "1": game.i18n.format("ficha.selectOptions.nivelPericia.aprendiz"),
		  "2": game.i18n.format("ficha.selectOptions.nivelPericia.competente"),
		  "3": game.i18n.format("ficha.selectOptions.nivelPericia.profissional"),
		  "4": game.i18n.format("ficha.selectOptions.nivelPericia.especialista"),
		  "5": game.i18n.format("ficha.selectOptions.nivelPericia.mestre"),
		  "6": game.i18n.format("ficha.selectOptions.nivelPericia.lenda"),
	  }
  });
  
  Handlebars.registerHelper('attrGrads', function(){
	  return {
		  "2": "-",
		  "3": "",
		  "4": "+"
	  }
  });
  
  Handlebars.registerHelper('weaponAttrs', function(){
	  var fight = game.i18n.format("ficha.ataque.lutar");
	  var shoot = game.i18n.format("ficha.ataque.atirar");
	  var obj = {};
	  obj[fight] = "ataque.lutar";
	  obj[shoot] = "ataque.atirar";
	  
	  return obj;
  });
  
  // Preload template partials
  await preloadHandlebarsTemplates();
});

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    // Define template paths to load
    const templatePaths = [
        // Attribute list partial.
        "systems/librarpg/templates/actor/sheet-attack.html",
        "systems/librarpg/templates/actor/sheet-base.html",
        "systems/librarpg/templates/actor/sheet-armas.html",
        "systems/librarpg/templates/actor/sheet-armaduras.html",
        "systems/librarpg/templates/actor/sheet-habilidades.html",
        "systems/librarpg/templates/actor/sheet-itens.html",
        "systems/librarpg/templates/actor/sheet-idiomas.html"
    ];

    // Load the template parts
    return loadTemplates(templatePaths);
};

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createlibrarpgMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createLibraMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.librarpg.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "librarpg.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}