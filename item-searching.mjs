
import DoDSkillTest from "/systems/dragonbane/modules/tests/skill-test.js";
import DoD_Utility from "/systems/dragonbane/modules/utility.js";

export class itemsSearch extends Dialog {
    constructor({ title, content, buttons, filterData, actorID}) {
       
        super({
            title,     
            content,   
            buttons,
            actorID,
            filterData
        });
        this.filterData = filterData; 
        this.actorID = actorID;
    }
    activateListeners(html) {
        super.activateListeners(html);
        const rollForBarter =  game.settings.get("dragonbane-item-browser", "barter-roll-when-buys")
        html.on("change", ".filter", this.changeitemType.bind(this)); 
        if (!rollForBarter){
        html.on("click", ".fas.fa-coins", this.buyItem.bind(this));
        }
        else{
            html.on("click", ".fas.fa-coins", this.rollForBarter.bind(this)); 
        } 
        html.on("click", ".fas.fa-plus", this.addItem.bind(this)); 
        html.on("click",".item-name-browser", this.openItem.bind(this))
        html.on("input",".input-item-name", this.itemFilter.bind(this))
    }
    async changeitemType(event) {
        const filter = event.target.classList[1];
        if (filter === "type"){
            this.filterData.chosenType = event.target.value;  
        }
        else{
        this.filterData.filters[filter]=event.target.value;
        }
        this.filterData.chosenItems =await this.itemFiltration( this.filterData,this.filterData.chosenType);
        const template = await renderTemplate(
            "modules/dragonbane-item-browser/templates/items-search.hbs",
            {data: this.filterData }
        );       
        this.data.content = template;
        this.render(true,{width:700,height:500})
    }
    async openBrowser(filterData,actorID) {
    const title = "Items Browser";
    filterData = { ...filterData, ...(await this._prepareWorldsItems(filterData.chosenType,actorID)) };
    const template = await renderTemplate(
        "modules/dragonbane-item-browser/templates/items-search.hbs",
        {data:filterData }
    );

   const browser = new itemsSearch({
        title:title,
        content: template,
        filterData: filterData,  
        buttons: {},
    })
    browser.render(true,{width:700, height:500});
    browser.element.find('.dialog-button').addClass('hidden-button')
    }
    async _prepareWorldsItems(chosenType, actorID){
    let types = [
        "ability",
        "armor",
        "helmet",
        "item",
        "spell",
        "weapon"]
        const supplyTypes = ["common", "uncommon", "rare"];

    const filteredItems = game.items.filter(item => {
        const isTypeValid = types.includes(item.type);
        const isSupplyTypeValid = item.system.supply ? supplyTypes.includes(item.system.supply) : true;
        return isTypeValid && isSupplyTypeValid;
    });    
    const weaponsSkillsArray = game.items.filter(item => item.type === "skill" && item.system.skillType === "weapon");
    const weaponsSkills =weaponsSkillsArray.reduce((obj, item) => {
        obj[item.name] = item.name;
        return obj;
    }, {});;
  
    const magicSkills = game.items.filter(item => item.type === "spell")
    const removeDuplicatedMagicSkills =  [...new Set(magicSkills.map(item => item.system.school))];
    const magicSkillsmNames = removeDuplicatedMagicSkills.reduce((obj, name) => {
        obj[name] = name;
        return obj;
    }, {});;
    const spellDurationTypes = game.i18n.translations.DoD.spellDurationTypes;
    const spellRangeTypes = game.i18n.translations.DoD.spellRangeTypes;
    const spellCastingTimeTypes = game.i18n.translations.DoD.castingTimeTypes;
    let weaponFeatureTypes = game.i18n.translations.DoD.weaponFeatureTypes;
    Object.keys(weaponFeatureTypes).forEach(key => {
        if (key.includes("Tooltip")) {
            delete weaponFeatureTypes[key];
        }
    });
    const any = game.i18n.localize("DB-IB.Any")
    const supply = {
        common: game.i18n.translations.DoD.supplyTypes.common,        
        uncommon: game.i18n.translations.DoD.supplyTypes.uncommon,        
        rare: game.i18n.translations.DoD.supplyTypes.rare,
        any: any

    }
    
    weaponsSkills.any = any;
    magicSkillsmNames.any = any;
    spellRangeTypes.any = any;
    weaponFeatureTypes.any = any;
    spellCastingTimeTypes.any = any;
    const gripTypes = game.i18n.translations.DoD.gripTypes;
    gripTypes.any = any;
    spellDurationTypes.any = any;
    const filters = {
        weaponSkill: "any",
        grip:"any",
        weaponFeature:"any",
        school:"any",
        duration:"any",
        castingTime:"any",
        range:"any",
        rank:"any",
        supply: "any",
        itemName: ""

    }
    types =  {
        ability:game.i18n.translations.TYPES.Item.ability,
        armor:game.i18n.translations.TYPES.Item.armor,
        helmet: game.i18n.translations.TYPES.Item.helmet,
        item:game.i18n.translations.TYPES.Item.item,
        spell:game.i18n.translations.TYPES.Item.spell,
        weapon:game.i18n.translations.TYPES.Item.weapon}
        const data = {
            types: types,
            items: filteredItems,
            weaponSkills: weaponsSkills,
            magicSchool: magicSkillsmNames,
            duration: spellDurationTypes,
            castingTime : spellCastingTimeTypes,
            range: spellRangeTypes,
            weaponFeature : weaponFeatureTypes,
            grip: gripTypes,
            supply: supply,
            filters:filters,
            actor:actorID


        }
        const chosenItems = await this.itemFiltration(data,chosenType);
        data.chosenItems = chosenItems
        return data

    }
    async itemFiltration(data,chosenType){
    let chosenItems = {};
    switch(chosenType){
        case "ability":
            chosenItems = data.items.filter(item =>item.type === "ability")
            break;
        case "armor":
            chosenItems = data.items.filter(item =>item.type === "armor")
            break;
        case "helmet":
            chosenItems = data.items.filter(item =>item.type === "helmet")
            break;
        case "item":
            chosenItems = data.items.filter(item =>item.type === "item" &&
                (data.filters.supply === "any" || item.system.supply === data.filters.supply))
            break;
        case "weapon":
            chosenItems = data.items.filter(item =>
                item.type === "weapon" && 
                (data.filters.weaponSkill === "any" ||item.system.skill.name === data.filters.weaponSkill) &&
                (data.filters.grip === "any" ||item.system.grip.value === data.filters.grip) &&
                (data.filters.weaponFeature === "any" ||item.system.features.includes(data.filters.weaponFeature) )&&
                (data.filters.supply === "any" || item.system.supply === data.filters.supply)               
            )
            break;
        case "spell":
            chosenItems = data.items.filter(item =>
                item.type === "spell" && 
                (data.filters.school === "any" || item.system.school === data.filters.school)&&
                (data.filters.duration === "any" ||item.system.duration === data.filters.duration) &&
                (data.filters.castingTime === "any" ||item.system.castingTime === data.filters.castingTime) &&
                (data.filters.range === "any" ||item.system.rangeType === data.filters.range) &&
                (data.filters.rank === "any" || item.system.rank === Number(data.filters.rank))      
            )
            break;
        }
    return chosenItems

    }
    async buyItem(event){
        const actor = game.actors.get(this.data.filterData.actor);
        const item = game.items.get(event.target.id);
        const itemData = item.toObject();          
        const buyIitem = await this.spendMoney(item,actor);
        if(buyIitem){
            await actor.createEmbeddedDocuments("Item", [itemData])
            await actor.update()
        }

    }
    async addItem(event){
        const actor = game.actors.get(this.data.filterData.actor);
        const item = game.items.get(event.target.id);
        const itemData = item.toObject(); 
        await actor.createEmbeddedDocuments("Item", [itemData])
        await actor.update()
        ChatMessage.create({
            content: game.i18n.format("DB-IB.addItem",{actor:actor.name, type:item.type,item:item.name}),
            speaker: ChatMessage.getSpeaker({ actor })
        });

    }
    async spendMoney(item,actor){
        let actorGC= actor.system.currency.gc;
        let actorSC = actor.system.currency.sc;
        let actorCC = actor.system.currency.cc;
        let itemPrice = item.system.cost;    
        const itemPriceNoSpace = itemPrice.replace(/\s+/g, "");
        const regex = /^(\d+D\d+)x(\d+)([a-zA-Z]+)$/;
        const isMatch = regex.test(itemPriceNoSpace);
        let enoughMoney = true;
        if(isMatch){
            const dice = itemPriceNoSpace.match(regex)[1];
            const multiplyer = itemPriceNoSpace.match(regex)[2];
            const currency = itemPriceNoSpace.match(regex)[3]
            const formula = `${dice}*${multiplyer}`
            const costRoll =await new Roll(formula).evaluate()
            const content = game.i18n.format("DB-IB.rollForPrice",{formula:formula,item:item.name,currency:currency})
            costRoll.toMessage({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: content,
            });
            itemPrice = String(costRoll.total)+" "+currency;          
        }
        const cost = Number(itemPrice.split(" ")[0]);
        let isCopper;
        let testPattern = ""
        const localCopper = [game.i18n.translations.DoD.currency.copper.toLowerCase(), "copper"];
        for (const string of localCopper) {
            testPattern = new RegExp(`^\\d+\\s+${string}$`);
            isCopper = testPattern.test(itemPrice);
            if (isCopper) {
                break; 
            }
        }
        let isSilver;
        
        const localSilver = [game.i18n.translations.DoD.currency.silver.toLowerCase(), "silver"];
        for (const string of localSilver) {
            testPattern = new RegExp(`^\\d+\\s+${string}$`);
            isSilver = testPattern.test(itemPrice);
            if (isSilver) {
                break; 
            }
        }
        let isGold;
        const localGold = [game.i18n.translations.DoD.currency.gold.toLowerCase(), "gold"];
        for (const string of localGold) {
            testPattern = new RegExp(`^\\d+\\s+${string}$`);
            isGold = testPattern.test(itemPrice);
            if (isGold) {
                break; 
            }
        }

        if (isCopper){
            
            while (cost > actorCC) {
                if (actorCC < cost && actorSC > 0){
                    actorSC = actorSC - 1;
                    actorCC = actorCC + 10;
                }
                if (actorCC < cost && actorSC === 0 && actorGC >0){
                    actorSC = actorSC + 9;
                    actorGC = actorGC - 1;
                    actorCC = actorCC + 10
                }
                if (actorGC === 0 && actorSC === 0 && actorCC < cost) {
                   ChatMessage.create({
                        content: game.i18n.format("DB-IB.notEnoughMoney",{actor:actor.name,item:item.name}),
                        speaker: ChatMessage.getSpeaker({ actor })
                    });
                    enoughMoney = false              
                    break;
                }
            }
            if(enoughMoney){
            actorCC = actorCC -cost;
            }
        }
        else if (isSilver){
           
            while (cost > actorSC){
                if (actorSC < cost  && actorCC >= 10){
                    actorCC = actorCC - 10;
                    actorSC = actorSC + 1
                }
                else if (actorSC < cost && actorCC < 10 && actorGC > 0){
                    actorGC = actorGC - 1;
                    actorSC = actorSC + 10                   
                }
                if (actorGC === 0 && actorCC < 10 && actorSC < cost) {
                    ChatMessage.create({
                        content: game.i18n.format("DB-IB.notEnoughMoney",{actor:actor.name,item:item.name}),
                        speaker: ChatMessage.getSpeaker({ actor })
                    }); 
                    enoughMoney = false             
                    break;
                }   
            }
            if(enoughMoney){
                actorSC = actorSC -cost;
            }
        }
        else if (isGold){
          
            while (cost > actorGC){
                console.log(cost > actorGC)
                if (actorCC >=10){
                    actorCC = actorCC - 10;
                    actorSC = actorSC + 1;
                }
                if(actorSC >=10){
                    actorSC = actorSC - 10;
                    actorGC = actorGC + 1;
                }
                if (actorCC < 10 && actorSC < 10 && actorGC < cost) {
                    ChatMessage.create({
                        content: game.i18n.format("DB-IB.notEnoughMoney",{actor:actor.name,item:item.name}),
                        speaker: ChatMessage.getSpeaker({ actor })
                     });     
                     enoughMoney = false         
                     break;
                 }
            }
            if(enoughMoney){
                actorGC = actorGC - cost
            }
          
        }
        
        if ((actorGC !== actor.system.currency.gc || 
            actorSC !== actor.system.currency.sc ||
            actorCC !== actor.system.currency.cc) && enoughMoney
        ){
            await actor.update({
                ["system.currency.gc"]: actorGC,
                ["system.currency.sc"]: actorSC,
                ["system.currency.cc"]: actorCC,

            })
        ChatMessage.create({
            content:game.i18n.format("DB-IB.spendMoney",{actor:actor.name,item:item.name, itemPrice,itemPrice}),
            speaker: ChatMessage.getSpeaker({ actor })
        });
      
        }
        else if(enoughMoney) { 
            ChatMessage.create({
                content: game.i18n.format("DB-IB.manualMonyRemoval",{itemPrice:itemPrice, item:item.name}),
                speaker: ChatMessage.getSpeaker({ actor })
            });
  

        }
        return enoughMoney

    }
    async openItem(event){
        const item = game.items.get(event.target.id);
        item.sheet.render(true)

    }
    async rollForBarter(event) {
        const actor = game.actors.get(this.data.filterData.actor);
        const item = game.items.get(event.target.id);
        let skillName = game.settings.get("dragonbane-item-browser", "custom-barter-skill");
        if (skillName === "") {
            skillName = "Bartering";
        }
        let skill = actor.findSkill(skillName);
        if (skill === undefined && skillName !== "Bartering") {
            skill = actor.findSkill("Bartering");
        }
        const options = {};
        const test = new DoDSkillTest(actor, skill, options);
    
        // Create Dialog
        const d = new Dialog({
            title: game.i18n.localize("DB-IB.wannaBarter"),
            content: game.i18n.localize("DB-IB.pickIfYouWantToRollForBartering"),
            buttons: {
                buyWithRoll: {
                    label: game.i18n.localize("DB-IB.rollForBarter"),
                    callback: async () => {
                        const barterSkillRoll = await test.roll();
                        if (barterSkillRoll !== undefined) {
                            const success = barterSkillRoll.postRollData.success;
                            const isDemon = barterSkillRoll.postRollData.isDemon;
                            const isDragon = barterSkillRoll.postRollData.isDragon;
                            const canPush = barterSkillRoll.postRollData.canPush;
                            const ChatMessage = barterSkillRoll.rollMessage._id;
                            let existingMessage = game.messages.get(ChatMessage);
                            
                            if (canPush) {
                                await barterPushButton(existingMessage);
                                existingMessage = game.messages.get(ChatMessage);
                            }
                            await addBuyButton(item, actor, success, isDemon, isDragon, existingMessage, ChatMessage, barterSkillRoll);
                        }
                    },
                },
                buyWithoutRoll: {
                    label: game.i18n.localize("DB-IB.BuyWithoutRoll"),
                    callback: async () => {
                       await this.buyItem(event);
                    },
                },
            },
            default: "buyWithRoll", // Default button when hitting Enter
        });
    
        // Render the Dialog
        d.render(true);
    }
    async itemFilter(event){
        const filterData = this.filterData;
        const inputString =  event.target.value.toLowerCase();
        const chosenItem = await this.itemFiltration(filterData,filterData.chosenType);
        const filteredItems = chosenItem.filter(item => item.name.toLowerCase().includes(inputString));
        this.filterData.chosenItems = filteredItems
        this.filterData.filters.itemName = event.target.value;
        const inputField = document.querySelector(".input-item-name");
        const inputState = {
        value: inputField?.value || "",
        cursorPosition: inputField?.selectionStart || 0
    };
        const template = await renderTemplate(
            "modules/dragonbane-item-browser/templates/items-search.hbs",
            {data: this.filterData }
        );       
        this.data.content = template;
        this.render(true,{width:700,height:500})
        setTimeout(() => {
            const newInputField = document.querySelector(".input-item-name");
            if (newInputField) {
                newInputField.value = inputState.value; // Restore value
                newInputField.setSelectionRange(inputState.cursorPosition, inputState.cursorPosition); // Restore cursor position
                newInputField.focus(); // Set focus back to the input field
            }
        }, 0);
       

    }
}
export async function addChatListeners(_app, html, _data) { 
    html.on("click", ".chat-button.buy-item", buyFromChat);
    html.on("click", ".barter-push-roll", barterPushRoll);
  


}
async function buyFromChat(event) {
 
    
    const ChatMessage =  game.messages.get(event.target.getAttribute("data-message-id"));
    const actor = game.actors.get(ChatMessage.system.actor._id);
    const item = ChatMessage.system.item;
    const rollResults = ChatMessage.system.barterSkillRoll.postRollData.success;
    const isDragon = ChatMessage.system.barterSkillRoll.postRollData.isDragon;
    

        const buyIitem = await spendMoneyWithBarter(item,actor, rollResults, isDragon);
        if(buyIitem){
            await actor.createEmbeddedDocuments("Item", [item])
            await actor.update()
        }
}
async function spendMoneyWithBarter(item,actor,rollResults, isDragon){
    let actorGC= actor.system.currency.gc;
    let actorSC = actor.system.currency.sc;
    let actorCC = actor.system.currency.cc;
    let itemPrice = item.system.cost;
    const itemPriceNoSpace = itemPrice.replace(/\s+/g, "");
    const regex = /^(\d+D\d+)x(\d+)([a-zA-Z]+)$/;
    const isMatch = regex.test(itemPriceNoSpace);
    let enoughMoney = true;
    
    if(isMatch){
        const dice = itemPriceNoSpace.match(regex)[1];
        const multiplyer = itemPriceNoSpace.match(regex)[2];
        const currency = itemPriceNoSpace.match(regex)[3]
        const formula = `${dice}*${multiplyer}`
        const costRoll =await new Roll(formula).evaluate()
        const content = game.i18n.format("DB-IB.rollForPrice",{formula:formula,item:item.name,currency:currency})
        costRoll.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: content,
        });
        itemPrice = String(costRoll.total)+" "+currency;          
    }
    let cost = Number(itemPrice.split(" ")[0]);
    const currency2 = itemPrice.split(" ")[1];
    if(rollResults === false){
        cost = cost; 
    } 
    else if(rollResults === true){
        cost = (cost)*0.8;
        cost = Math.round(cost * 100) / 100;
    }
    else if(rollResults === true && isDragon === true){
        cost = (cost)*0.5;
        cost = Math.round(cost * 100) / 100;

    }  
    let isCopper;
    let testPattern = ""
    let copperPart = 0, silverPart = 0, goldPart = 0;
    const localCopper = [game.i18n.translations.DoD.currency.copper.toLowerCase(), "copper"];
    for (const string of localCopper) {
        testPattern = new RegExp(`^\\d+\\s+${string}$`);
        isCopper = testPattern.test(itemPrice);
        if (isCopper) {
            copperPart = Math.round(cost);
            break; 
        }
    }
    let isSilver;
    
    const localSilver = [game.i18n.translations.DoD.currency.silver.toLowerCase(), "silver"];
    for (const string of localSilver) {
        testPattern = new RegExp(`^\\d+\\s+${string}$`);
        isSilver = testPattern.test(itemPrice);
        if (isSilver) {
            silverPart = Math.floor(cost); // Get the integer part
            copperPart = (cost - silverPart)*10;
            break; 
        }
    }
    let isGold;
    const localGold = [game.i18n.translations.DoD.currency.gold.toLowerCase(), "gold"];
    for (const string of localGold) {
        testPattern = new RegExp(`^\\d+\\s+${string}$`);
        isGold = testPattern.test(itemPrice);
        if (isGold) {
            goldPart = Math.floor(cost); // Get the integer part
            copperPart = Math.round((cost - goldPart)*10);
            copperPart= copperPart*10;
            if (copperPart > 10){
                silverPart =  Math.floor(copperPart/10);
                copperPart = copperPart - (silverPart*10);
            }
            break; 
        }
    }
    if (copperPart !== 0){
        
        while (copperPart > actorCC) {
            if (actorCC < copperPart && actorSC > 0){
                actorSC = actorSC - 1;
                actorCC = actorCC + 10;
            }
            if (actorCC < copperPart && actorSC === 0 && actorGC >0){
                actorSC = actorSC + 9;
                actorGC = actorGC - 1;
                actorCC = actorCC + 10
            }
            if (actorGC === 0 && actorSC === 0 && actorCC < copperPart) {
                enoughMoney = false              
                break;
            }
        }
        if(enoughMoney){
        actorCC = actorCC -copperPart;
        }
    }
    if (silverPart !== 0){
       
        while (silverPart > actorSC){
            if (actorSC < silverPart  && actorCC >= 10){
                actorCC = actorCC - 10;
                actorSC = actorSC + 1
            }
            else if (actorSC < silverPart && actorCC < 10 && actorGC > 0){
                actorGC = actorGC - 1;
                actorSC = actorSC + 10                   
            }
            if (actorGC === 0 && actorCC < 10 && actorSC < silverPart) {
                enoughMoney = false             
                break;
            }   
        }
        if(enoughMoney){
            actorSC = actorSC -silverPart;
        }
    }
    if (goldPart !== 0){
      
        while (goldPart > actorGC){
         
            if (actorCC >=10){
                actorCC = actorCC - 10;
                actorSC = actorSC + 1;
            }
            if(actorSC >=10){
                actorSC = actorSC - 10;
                actorGC = actorGC + 1;
            }
            if (actorCC < 10 && actorSC < 10 && actorGC < goldPart) {
                 enoughMoney = false         
                 break;
             }
        }
        if(enoughMoney){
            actorGC = actorGC - goldPart
        }
      
    }
    if(!enoughMoney){
        ChatMessage.create({
            content: game.i18n.format("DB-IB.notEnoughMoney",{actor:actor.name,item:item.name}),
            speaker: ChatMessage.getSpeaker({ actor })
         });     
    }
    else {
    
    if ((actorGC !== actor.system.currency.gc || 
        actorSC !== actor.system.currency.sc ||
        actorCC !== actor.system.currency.cc) && enoughMoney
    ){
        await actor.update({
            ["system.currency.gc"]: actorGC,
            ["system.currency.sc"]: actorSC,
            ["system.currency.cc"]: actorCC,

        })
        let finalPrice;
        if (currency2 === "copper" || currency2 === game.i18n.translations.DoD.currency.copper.toLowerCase() ){
            finalPrice = String(copperPart)+" "+currency2;
        }
        else{
            finalPrice = String(cost)+" "+currency2;
        }
        
    ChatMessage.create({
        content:game.i18n.format("DB-IB.spendMoney",{actor:actor.name,item:item.name, itemPrice:finalPrice}),
        speaker: ChatMessage.getSpeaker({ actor })
    });
  
    }
    else if(enoughMoney) { 
        ChatMessage.create({
            content: game.i18n.format("DB-IB.manualMonyRemoval",{itemPrice:itemPrice, item:item.name}),
            speaker: ChatMessage.getSpeaker({ actor })
        });


    }
    }
    return enoughMoney

}
async function addBuyButton(item,actor,sucess, isDemon, isDragon, existingMessage, ChatMessage, barterSkillRoll) {
    let flavor = existingMessage.flavor;
    let newFlavor = "";
    if(sucess){
        const tekst = game.i18n.format("DB-IB.Chat.reducePrice",{item:item.name});
        const reducePrice =`<br><p> ${tekst}</p>`
        newFlavor = flavor + reducePrice  
        

    }   
    else if(isDemon)  {
        const tekst = game.i18n.format("DB-IB.Chat.cannotBuy",{item:item.name});
        const cannotBuy =`<br><p> ${tekst}</p>`
        newFlavor = flavor +cannotBuy   
                
        }
    else if(isDragon)  {
            const tekst = game.i18n.format("DB-IB.Chat.reducePriceDragon",{item:item.name});
            const reducePriceDragon =`<br><p> ${tekst}</p>`
            newFlavor = flavor +reducePriceDragon    // Keep </span> and add reducePrice after it
              
        }
    else{
        const tekst = game.i18n.format("DB-IB.Chat.nochangeInPrice",{item:item.name});
        const regularPrice =`<br><p> ${tekst}</p>`
        newFlavor = flavor +regularPrice
    }
    if (isDemon === false){
        const newButton = `
        <button type="button" class="chat-button buy-item" data-message-id="${ChatMessage}">
        ${game.i18n.format("DB-IB.Chat.buyItem")}
         </button>
        `;
        let updatedContent = `${existingMessage.content} <div>${newButton}</div>`;
        existingMessage.update({ content: updatedContent,flavor:newFlavor, system: {actor,item,barterSkillRoll}} );
      
    }
    else{
        existingMessage.update({ flavor:newFlavor, system: {actor,item,barterSkillRoll}} );

    }
    
}
async function barterPushButton(existingMessage) {
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = existingMessage.content;
    let button = tempDiv.querySelector("button.push-roll");
    if (button) {
        button.classList.remove("push-roll");
        button.classList.add("barter-push-roll");
    }
    let updatedContent = tempDiv.innerHTML;
    existingMessage.content = updatedContent; 
    existingMessage.update({ content: updatedContent });
}
async function barterPushRoll(event) {
    const ChatMessageID = event.target.closest('[data-message-id]')?.getAttribute('data-message-id');
    const currentMessage =  game.messages.get(ChatMessageID);
    const formula = currentMessage.rolls[0]._formula;
    const actor = game.actors.get(currentMessage.system.actor._id);
    const item = currentMessage.system.item;
    const element = event.currentTarget;
        const parent = element.parentElement;
        const pushChoices = parent.getElementsByTagName("input");
        const choice = Array.from(pushChoices).find(e => e.name==="pushRollChoice" && e.checked);
        if (!actor.hasCondition(choice.value)) {
           actor.updateCondition(choice.value, true);
           await creatConditionMagade(actor,choice)
        } else {
            DoD_Utility.WARNING("DoD.WARNING.conditionAlreadyTaken");
            return;
        }
        let skillName =  game.settings.get("dragonbane-item-browser","custom-barter-skill")
        if (skillName === ""){
            skillName = "Bartering"
        }
        let skill = actor.findSkill(skillName)
        if (skill === undefined && skill !== "Bartering"){
            skill = actor.findSkill("Bartering")
        }
       
        let options = {canPush:false,skipDialog: true, formula:formula};
        const test = new DoDSkillTest(actor, skill, options);
        const barterSkillRoll = await test.roll();
        const sucess = barterSkillRoll.postRollData.success;
        const isDemon = barterSkillRoll.postRollData.isDemon;
        const isDragon = barterSkillRoll.postRollData.isDragon;
        const ChatMessage = barterSkillRoll.rollMessage._id;
        let existingMessage = game.messages.get(ChatMessage);
        await addBuyButton(item,actor,sucess, isDemon, isDragon, existingMessage, ChatMessage, barterSkillRoll)
    
}
async function creatConditionMagade(actor, choice){
    const msg = game.i18n.format("DoD.ui.chat.takeCondition",
        {
            actor: actor.name,
            condition: game.i18n.localize("DoD.conditions." + choice.value)
        });
    ChatMessage.create({
        content: msg,
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: actor })
    });   
}
export class sellingItem {
    constructor({ itemID, actorID}) {     
        this.itemID = itemID; 
        this.actorID = actorID;
    }
    async  addChatListeners(_app, html, _data) { 
        html.on("click", ".sell-push-roll",  this.sellPushRoll.bind(this));
        html.on("click", ".chat-button.sell-item",  this.sellFromChat.bind(this));

    }
    async selling(itemID, actorID){
        const actor = game.actors.get(actorID);
        const item = actor.items.filter(item => item.id === itemID)[0];
        const rollForBarter =  game.settings.get("dragonbane-item-browser", "barter-roll-when-buys")
        if(rollForBarter){      
            let skillName = game.settings.get("dragonbane-item-browser", "custom-barter-skill");
            if (skillName === "") {
                skillName = "Bartering";
            }
            let skill = actor.findSkill(skillName);
            if (skill === undefined && skillName !== "Bartering") {
                skill = actor.findSkill("Bartering");
            }
            const options = {};
            const test = new DoDSkillTest(actor, skill, options);
            const d = new Dialog({
                title: game.i18n.localize("DB-IB.wannaBarter"),
                content: game.i18n.localize("DB-IB.pickIfYouWantToRollForBartering"),
                buttons: {
                    sellWithRoll: {
                        label: game.i18n.localize("DB-IB.rollForBarter"),
                        callback: async () => {
                            const barterSkillRoll = await test.roll();
                            if (barterSkillRoll !== undefined) {
                                const success = barterSkillRoll.postRollData.success;
                                const isDemon = barterSkillRoll.postRollData.isDemon;
                                const isDragon = barterSkillRoll.postRollData.isDragon;
                                const canPush = barterSkillRoll.postRollData.canPush;
                                const ChatMessage = barterSkillRoll.rollMessage._id;
                                let existingMessage = game.messages.get(ChatMessage);
                                
                                if (canPush) {
                                    await this.barterSellPushButton(existingMessage);
                                    existingMessage = game.messages.get(ChatMessage);
                                }
                                await this.addSellButton(item, actor, success, isDemon, isDragon, existingMessage, ChatMessage, barterSkillRoll);
                            }
                        },
                    },
                    sellWithoutRoll: {
                        label: game.i18n.localize("DB-IB.BuyWithoutRoll"),
                        callback: async () => {
                           await this.sellItem(item,actor);
                        },
                    },
                },
                default: "sellWithRoll", // Default button when hitting Enter
            });
        
            // Render the Dialog
            d.render(true);

        }
        else{
            await this.sellItem(item,actor);
        }

    }

    async sellItem(item,actor) {
        const itemPrice = item.system.cost;
        let actorGC= actor.system.currency.gc;
        let actorSC = actor.system.currency.sc;
        let actorCC = actor.system.currency.cc;
        const coinsType = [game.i18n.translations.DoD.currency.gold.toLowerCase(), "gold", game.i18n.translations.DoD.currency.silver.toLowerCase(), "silver", game.i18n.translations.DoD.currency.copper.toLowerCase(), "copper"];
        const itemPriceNoSpace = itemPrice.replace(/\s+/g, "");
        const regex = /^(\d+D\d+)x(\d+)([a-zA-Z]+)$/;
        const isMatch = regex.test(itemPriceNoSpace);
        if(isMatch){
            const dice = itemPriceNoSpace.match(regex)[1];
            const multiplyer = itemPriceNoSpace.match(regex)[2];
            const currency = itemPriceNoSpace.match(regex)[3]
            const formula = `${dice}*${multiplyer}`
            const costRoll =await new Roll(formula).evaluate()
            const content = game.i18n.format("DB-IB.rollForPrice",{formula:formula,item:item.name,currency:currency})
            costRoll.toMessage({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: content,
            });
            itemPrice = String(costRoll.total)+" "+currency;          
        }
        let cost = Number(itemPrice.split(" ")[0]);
        const currency2 = itemPrice.split(" ")[1];
        let currencyType; 
        let index = 0; // Initialize the index variable
        for (const coin of coinsType) {
            if (currency2.toLowerCase() === coin) {
                currencyType = index;
                break;
            }
            index++; // Increment the index in each iteration
        }
        switch(currencyType){
            case 0:
            case 1:
                actorGC = actorGC + cost;
                break;
            case 2:
            case 3:
                actorSC = actorSC + cost;
                break;
            case 3:
            case 4:
                actorCC = actorCC + cost;
                break;

        } 
        await actor.update({
            ["system.currency.gc"]: actorGC,
            ["system.currency.sc"]: actorSC,
            ["system.currency.cc"]: actorCC,

        })
        actor.deleteEmbeddedDocuments("Item", [item.id])
        ChatMessage.create({
            content: game.i18n.format("DB-IB.Chat.sellItem",{cost:cost, item:item.name, actor:actor.name, currency:currency2}),
            speaker: ChatMessage.getSpeaker({ actor })
        });

    }
    async barterSellPushButton(existingMessage) {
        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = existingMessage.content;
        let button = tempDiv.querySelector("button.push-roll");
        if (button) {
            button.classList.remove("push-roll");
            button.classList.add("sell-push-roll");
        }
        let updatedContent = tempDiv.innerHTML;
        existingMessage.content = updatedContent; 
        existingMessage.update({ content: updatedContent });
    }
    async sellPushRoll(event) {
        const ChatMessageID = event.target.closest('[data-message-id]')?.getAttribute('data-message-id');
        const currentMessage =  game.messages.get(ChatMessageID);
        const formula = currentMessage.rolls[0]._formula;
        const actor = game.actors.get(currentMessage.system.actor._id);
        const item = currentMessage.system.item;
        const element = event.currentTarget;
            const parent = element.parentElement;
            const pushChoices = parent.getElementsByTagName("input");
            const choice = Array.from(pushChoices).find(e => e.name==="pushRollChoice" && e.checked);
            if (!actor.hasCondition(choice.value)) {
               actor.updateCondition(choice.value, true);
               await creatConditionMagade(actor,choice)
            } else {
                DoD_Utility.WARNING("DoD.WARNING.conditionAlreadyTaken");
                return;
            }
            let skillName =  game.settings.get("dragonbane-item-browser","custom-barter-skill")
            if (skillName === ""){
                skillName = "Bartering"
            }
            let skill = actor.findSkill(skillName)
            if (skill === undefined && skill !== "Bartering"){
                skill = actor.findSkill("Bartering")
            }
           
            let options = {canPush:false,skipDialog: true, formula:formula};
            const test = new DoDSkillTest(actor, skill, options);
            const barterSkillRoll = await test.roll();
            const sucess = barterSkillRoll.postRollData.success;
            const isDemon = barterSkillRoll.postRollData.isDemon;
            const isDragon = barterSkillRoll.postRollData.isDragon;
            const ChatMessage = barterSkillRoll.rollMessage._id;
            let existingMessage = game.messages.get(ChatMessage);
            await this.addSellButton(item,actor,sucess, isDemon, isDragon, existingMessage, ChatMessage, barterSkillRoll)
        
    }
    async addSellButton(item, actor, success, isDemon, isDragon, existingMessage, ChatMessage, barterSkillRoll){
        let flavor = existingMessage.flavor;
        let newFlavor = "";
        if(success){
            const tekst = game.i18n.format("DB-IB.Chat.increasPrice",{item:item.name});
            const reducePrice =`<br><p> ${tekst}</p>`
            newFlavor = flavor + reducePrice  
            
    
        }   
        if(isDemon)  {
            const tekst = game.i18n.format("DB-IB.Chat.cannotSell",{item:item.name});
            const cannotBuy =`<br><p> ${tekst}</p>`
            newFlavor = flavor +cannotBuy   
                    
            }
        if(isDragon)  {
                const tekst = game.i18n.format("DB-IB.Chat.increasePriceDragon",{item:item.name});
                const reducePriceDragon =`<br><p> ${tekst}</p>`
                newFlavor = flavor +reducePriceDragon    // Keep </span> and add reducePrice after it
                  
            }
        if(!success && isDemon === false){
            const tekst = game.i18n.format("DB-IB.Chat.nochangeInPriceSell",{item:item.name});
            const regularPrice =`<br><p> ${tekst}</p>`
            newFlavor = flavor +regularPrice
        }
        if (isDemon === false){
            const newButton = `
            <button type="button" class="chat-button sell-item" data-message-id="${ChatMessage}">
            ${game.i18n.format("DB-IB.Chat.sellItemButton")}
             </button>
            `;
            let updatedContent = `${existingMessage.content} <div>${newButton}</div>`;
            existingMessage.update({ content: updatedContent,flavor:newFlavor, system: {actor,item,barterSkillRoll}} );
          
        }
        else{
            existingMessage.update({ flavor:newFlavor, system: {actor,item,barterSkillRoll}} );
    
        }
    }
    async sellFromChat(event){
        const mesageID = event.target.dataset.messageId
        const data = game.messages.get(mesageID).system;
        const roll = data.barterSkillRoll;
        const actor = data.actor;
        const item = data.item;
        const sucess = roll.postRollData.success;
        const isDemon = roll.postRollData.isDemon;
        const isDragon = roll.postRollData.isDragon;
        const coinsType = [game.i18n.translations.DoD.currency.gold.toLowerCase(), "gold", game.i18n.translations.DoD.currency.silver.toLowerCase(), "silver", game.i18n.translations.DoD.currency.copper.toLowerCase(), "copper"];
        const itemPriceNoSpace = itemPrice.replace(/\s+/g, "");
        const regex = /^(\d+D\d+)x(\d+)([a-zA-Z]+)$/;
        const isMatch = regex.test(itemPriceNoSpace);
        let sellPrice;
        if(sucess){
            sellPrice = item.system.cost 
        }


    }
}

