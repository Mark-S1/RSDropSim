let currentDropTables = [];

function loadWikiDropData(pageName) {
	let url = `https://oldschool.runescape.wiki/api.php?action=query&prop=revisions&titles=${pageName}&format=json&rvprop=content&rvslots=*&formatversion=2`
	
	let xhr = new XMLHttpRequest();
	
	xhr.onload = () => {
		console.log("onload");
		let responseJson = JSON.parse(xhr.response);
		//console.log(responseJson);
		let pageContent = responseJson.query.pages[0].revisions[0].slots.main.content;
		console.log(pageContent);
		
		let lines = pageContent.split("\n");
		let dropTables = [];
		let tableIndex = 0;
		let tableName = "drops";
		
		if(lines[0].startsWith("#REDIRECT")) {
			let redirectName = lines[0].substring(lines[0].indexOf("[[")+2, lines[0].indexOf("]]"));
			console.log(`Redirecting from "${pageName}" to "${redirectName}"`);
			loadWikiDropData(redirectName);
			return;
		}
		
		for(let i = 0; i < lines.length; i++) {
			if(!dropTables[tableIndex]) dropTables[tableIndex] = {};
			
			if(lines[i].indexOf("==") == 0 && lines[i].indexOf("===") == -1 && dropTables[tableIndex].drops) {
				tableIndex++;
				tableName = "drops";
			}
			
			if(lines[i].toLowerCase().includes("tertiary")) {
				tableName = lines[i].replaceAll("=", "");
			}
			
			if(lines[i].includes("rarity")) {
				if(!dropTables[tableIndex][tableName]) {
					dropTables[tableIndex][tableName] = [];
				}
				
				dropTables[tableIndex][tableName].push(lines[i]);
			}
		}
		
		for(let i = 0; i < dropTables.length; i++) {
			if(Object.keys(dropTables[i]).length === 0) {
				dropTables.splice(i, 1);
			}
		}
		
		console.log(dropTables);
		currentDropTables = dropTables;
	};
	
	xhr.onerror = () => {
		console.log("onerror");
		console.log(xhr.response);
	};
	
	xhr.open("GET", url);
	xhr.send();
}

function parseDropData(line) {
	let splitData = line.split("|");
	
	let itemData = {};
	
	for(let i = 0; i < splitData.length; i++) {
		if(splitData[i].indexOf("name=") == 0) {
			itemData.name = splitData[i].split("=")[1];
		}
		
		if(splitData[i].indexOf("rarity=") == 0) {
			let rarity = splitData[i].split("=")[1];
			
			if(rarity.indexOf("/") >= 0) {
				let nums = rarity.split("/");
				let numerator = Number(nums[0]);
				let denominator = Number(nums[1]);
				itemData.rarity = numerator/denominator;
				
			} else if(rarity == "Always") {
				itemData.rarity = "1";
				
			} else {
				itemData.rarity = rarity;
			}
		}
		
		if(splitData[i].indexOf("quantity=") == 0) {
			let quantity = splitData[i].split("=")[1];
			
			if(quantity.indexOf("(noted)") >= 0) {
				quantity = quantity.substring(0, quantity.indexOf("(noted)")).trim();
				itemData.isNoted = true;
			}
			
			if(isNaN(Number(quantity))) {
				let nums = quantity.split("-");
				itemData.minQuantity = Number(nums[0]);
				itemData.maxQuantity = Number(nums[1]);
				
			} else {
				itemData.minQuantity = Number(quantity);
				itemData.maxQuantity = Number(quantity);
			}
		}
	}
	
	return itemData;
}