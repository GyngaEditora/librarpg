/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class LibraActor extends Actor {

	/**
	* Augment the basic actor data with additional dynamic data.
	*/
	prepareData() {
		super.prepareData();

		const actorData = this.system;

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		console.log(actorData);
		
		if(this.type == "actor"){
			this.actorCalculations(actorData);
		}
	}
	
	actorCalculations(actorData){
		var atributos = actorData.atributos;
		
		//defesa
		actorData.defesa = (atributos.agilidade.valor + atributos.porte.valor)/2
		
		//calculate the current hp
		var vida = actorData.vida;
		vida.base = 10 + atributos.forca.valor;
		vida.atual = vida.base + vida.temp - vida.ferimentos;
		
		//calculate attacks
		var ataque = actorData.ataque;
		ataque.lutar = ataque.base + ataque.outros_for + atributos.forca.valor;
		ataque.atirar = ataque.base + ataque.outros_agi + atributos.agilidade.valor;
		
		//calculate protection
		let armorDef = 0;
		let items = this.items.entries();
		for (let a of items){
			let armor = a[1];
			let aData = armor.system;
			if(armor.type == "armadura"){
				armorDef = armorDef + Number(aData.propriedades.protecao);
			}
		}
		actorData.protecao = armorDef;
		
		//calculate max load
		var carga = actorData.carga;
		carga.max = Number(actorData.tamanho) + atributos.forca.valor * 3;
		
		//calculate current load
		var cargaAtual = 0;
		items = this.items.entries();
		for (let i of items){
			let item = i[1];
			let iData = item.system;
			if(item.type == "armadura" || 
				item.type == "arma" || 
				item.type == "item" 
			){
				cargaAtual = cargaAtual + Number(iData.carga);
			}
		}
		carga.atual = cargaAtual;
	}

}