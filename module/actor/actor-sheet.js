/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class LibraActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["librarpg", "sheet", "actor"],
      template: "systems/librarpg/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */   
  async getData(options) {
    const data = await super.getData(options);
    data.notas = await TextEditor.enrichHTML(this.object.system.notas, {async: true});
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Rollable abilities.
    html.find('.simple-roll').click(this._onSimpleRoll.bind(this));
    html.find('.attr-rollable').click(this._onAttrRoll.bind(this));
    html.find('.skill-rollable').click(this._onSkillRoll.bind(this));
    html.find('.weapon-rollable').click(this._onWeaponRoll.bind(this));
    html.find('.fofoca-rollable').click(this._onGossipRoll.bind(this));
	
	// Items
	html.find('.item-create').click(this._onItemCreate.bind(this));
	html.find('.item-edit').click(this._onItemEdit.bind(this));
	html.find('.item-delete').click(this._onItemDelete.bind(this));
  }
  
	async _roll(formulae, message){
		let label = "Rolando " + formulae;
		let rollCount = 0;
		let success = 0;
		let rollData = {
			"dices": Array()
		}
		let roll = new Roll(formulae, this.actor.system);
		await roll.roll({"async": false});
		
		console.log(roll);
		
		let explosions = 0;
		for (let r of roll.terms){
			for(let dice of r.results){
				rollData.dices.push(dice.result);
				if(dice.result == 2 || dice.result == 4 || dice.result == 6){
					success++;
				}
				if(dice.result == 6){
					explosions++;
				} else if (dice.result == 1){
					explosions--;
				}
			}
		}
		
		rollCount++
		
		while(explosions > 0){
			formulae = explosions + "d6";
			roll = new Roll(formulae, this.actor.system);
			await roll.roll();
			
			console.log(roll);
			explosions = 0;
			for (let r of roll.terms){
				for(let dice of r.results){
					rollData.dices.push(dice.result);
					if(dice.result == 2 || dice.result == 4 || dice.result == 6){
						success++;
					}
					if(dice.result == 6){
						explosions++;
					} else if (dice.result == 1){
						explosions--;
					}
				}
			}
			
			rollCount++
		}
		
		rollData.rollCount = rollCount;
		rollData.sucessos = success;
		rollData.flavor = message;
		
		const html = await renderTemplate("systems/librarpg/templates/roll.html", rollData);
		let chatData = {
			user: game.user.id,
			rollMode: game.settings.get("core", "rollMode"),
			content: html
		};
		if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
			chatData.whisper = ChatMessage.getWhisperRecipients("GM");
		} else if (chatData.rollMode === "selfroll") {
			chatData.whisper = [game.user];
		}
		await ChatMessage.create(chatData);
	}
	
	async _dialogToRoll(formulae, message){
		let confirmed = false;
		
		new Dialog({
			title: "Dados extras",
			content: `
			 <form>
			  <div>
			   <div>	
				<label>Dados:</label>
				<input type="text" name="bonusDice"/>
			   </div>
			  </div>
			 </form>
			`,
			buttons: {
				yes : {
					icon: '<i class="fas fa-check"></i>',
					label: "Rola",
					callback: () => confirmed = true
				},
				no : {
					icon: '<i class="fas fa-times"></i>',
					label: "Não Rola",
					callback: () => confirmed = false
				}
			},
			default: "no",
			close: html => {
				if(confirmed){	
					let bonusDice = html.find('[name=bonusDice]')[0].value;
						
					if(bonusDice != null && bonusDice != ""){
						formulae = formulae + " + " + bonusDice;
					}
					
					formulae = "(" + formulae + ")d6";
					
					console.log(formulae)
					
					this._roll(formulae, message);
				}
			}
		}).render(true);
	}

	/**
	* Handle attribute rolls.
	* @param {Event} event   The originating click event
	* @private
	*/
	async _onAttrRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
		let attr = element.getAttribute("attr");
		let flavorPiece = element.innerHTML;

		let formulae = "@" + attr + ".valor + @" + attr + ".grad";
		this._dialogToRoll(formulae, "Rolando atributo: " + flavorPiece);
	}

	/**
	* Handle skill rolls.
	* @param {Event} event   The originating click event
	* @private
	*/
	async _onSkillRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
		let attr = element.getAttribute("attr");
		let skill = element.getAttribute("pericia");

		let formulae = "@" + attr + ".valor + @" + skill;
		this._dialogToRoll(formulae, "Rolando perícia: " + game.i18n.format("ficha." + skill));
	}

	/**
	* Handle weapon rolls.
	* @param {Event} event   The originating click event
	* @private
	*/
	async _onWeaponRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
		let attr = element.getAttribute("attr");
		let dano = element.getAttribute("dano");
		let arma = element.innerHTML;
		
		if(dano == null){
			dano = 0;
		} else if(dano == ""){
			dano = 0;
		}

		let formulae = "@" + attr + " + " + dano;
		this._dialogToRoll(formulae, "Atacando com: " + arma);
	}

	/**
	* Handle gossip rolls.
	* @param {Event} event   The originating click event
	* @private
	*/
	async _onGossipRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
		let rollData = {
			"dices": Array(),
			"flavor": "Fofoca Rolando"
		}

		let formulae = "1d6";
		
		let roll = new Roll(formulae, this.actor.system);
		await roll.roll();
		
		for (let r of roll.terms){
			for(let dice of r.results){
				rollData.dices.push(dice.result);
				if(dice.result > this.actor.system.fofoca){
					rollData.fofoca = game.i18n.format("fofoca.sucesso");
				} else {
					rollData.fofoca = game.i18n.format("fofoca.falha");
				}
			}
		}
		
		const html = await renderTemplate("systems/librarpg/templates/roll.html", rollData);
		let chatData = {
			user: game.user.id,
			rollMode: game.settings.get("core", "rollMode"),
			content: html
		};
		if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
			chatData.whisper = ChatMessage.getWhisperRecipients("GM");
		} else if (chatData.rollMode === "selfroll") {
			chatData.whisper = [game.user];
		}
		await ChatMessage.create(chatData);
	}
	
	async _onSimpleRoll(event){
		event.preventDefault();
		
		let confirmed = false;
		
		new Dialog({
			title: "Rolagem Adaptável",
			content: `
			 <form>
			  <div>
			   <div>	
				<label>Dados:</label>
				<input type="text" name="dices"/>
			   </div>
			   <div>	
				<label>Texto:</label>
				<input type="text" name="flavor"/>
			   </div>
			  </div>
			 </form>
			`,
			buttons: {
				yes : {
					icon: '<i class="fas fa-check"></i>',
					label: "Rola",
					callback: () => confirmed = true
				},
				no : {
					icon: '<i class="fas fa-times"></i>',
					label: "Não Rola",
					callback: () => confirmed = false
				}
			},
			default: "no",
			close: html => {
				if(confirmed){
					let flavor = html.find('[name=flavor]')[0].value;
					let dices = html.find('[name=dices]')[0].value;
						
					if(dices != null && dices != ""){
						let formulae = dices + "d6";
						this._roll(formulae, flavor);
					}
				}
			}
		}).render(true);
	}
  
	/**
	* Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	* @param {Event} event   The originating click event
	* @private
	*/
	_onItemCreate(event) {
		//event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
		let type = element.getAttribute("type");
		let type2 = element.getAttribute("data-type");
		
		const itemData = {
			"name": type,
			"type": type,
		};
		Item.create(itemData, {parent: this.actor});
	}
	
	_onItemEdit(event) {
		//event.preventDefault();
		const item_id = event.currentTarget.getAttribute("data-item-id");
		const item = this.actor.items.get(item_id);
		item.sheet.render(true);
	}	
	
	_onItemDelete(event) {
		//event.preventDefault();
		const item_id = event.currentTarget.getAttribute("data-item-id");
		const item = this.actor.items.get(item_id);
		item.delete();
	}

}
