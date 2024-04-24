let currentDropTables = [];
const dataTables = document.getElementById("data-tables");
const errorMessageField = document.getElementById("error-message");

document.getElementById("submit-monster").onclick = () => {
	let pageName = document.getElementById("page-name").value;
	
	errorMessageField.innerText = "";
	
	loadWikiDropData(pageName, loadTables);
};

function loadTables() {
	dataTables.innerHTML = "";	//clear the table
	
	if(currentDropTables.length == 0) {
		errorMessageField.innerText = "No loot data available"
		return;
	}
	
	for(let i = 0; i < currentDropTables.length; i++) {
		populateTable(currentDropTables[i]);
	}
}

function populateTable(dropTable) {
	const dataTable = document.createElement("table");
	const thead = document.createElement("thead");
	const tableHeaderValues = ["Name", "Min", "Max", "Numerator", "Denominator", "Rarity"];
	
	for(let i = 0; i < tableHeaderValues.length; i++) {
		let th = document.createElement("th");
		th.innerText = tableHeaderValues[i];
		thead.appendChild(th);
	}
	
	dataTable.appendChild(thead);
	
	let mainDropTable = dropTable.drops;
	
	for(let i = 0; i < mainDropTable.length; i++) {
		let tr = document.createElement("tr");
		
		let dataKeys = ["name", "minQuantity", "maxQuantity", "numerator", "denominator", "rarity"];
		
		console.log(dropTable[i]);
		
		for(let j = 0; j < dataKeys.length; j++) {
			let td = document.createElement("td");
			td.innerText = mainDropTable[i][dataKeys[j]];
			
			if(j > 0) td.classList.add("number-cell");
			
			tr.appendChild(td);
		}
		
		dataTable.appendChild(tr);
	}
	
	dataTables.appendChild(dataTable);
}

function loadWikiDropData(pageName, callback) {
	let url = `https://oldschool.runescape.wiki/api.php?action=query&prop=revisions&titles=${pageName}&format=json&rvprop=content&rvslots=*&formatversion=2`
	
	let xhr = new XMLHttpRequest();
	
	xhr.onload = () => {
		let responseJson = JSON.parse(xhr.response);
		//console.log(responseJson);
		let pageContent = responseJson.query.pages[0].revisions[0].slots.main.content;
		//console.log(pageContent);
		
		let lines = pageContent.split("\n");
		let dropTables = [];
		let tableIndex = 0;
		let tableName = "drops";
		
		if(lines[0].startsWith("#REDIRECT")) {
			let redirectName = lines[0].substring(lines[0].indexOf("[[")+2, lines[0].indexOf("]]"));
			console.log(`Redirecting from "${pageName}" to "${redirectName}"`);
			loadWikiDropData(redirectName, callback);
			return;
		}
		
		for(let i = 0; i < lines.length; i++) {
			if(!dropTables[tableIndex]) dropTables[tableIndex] = {};
			
			if(lines[i].indexOf("==") == 0 && lines[i].indexOf("===") == -1 && dropTables[tableIndex].drops) {
				tableIndex++;
				tableName = "drops";
			}
			
			if(lines[i].toLowerCase().includes("tertiary") && dropTables[tableIndex].drops) {
				tableName = lines[i].replaceAll("=", "");
			}
			
			if(lines[i].includes("rarity")) {
				if(!dropTables[tableIndex][tableName]) {
					dropTables[tableIndex][tableName] = [];
				}
				
				let parsedData = parseDropData(lines[i]);
				//dropTables[tableIndex][tableName].push(lines[i]);
				dropTables[tableIndex][tableName].push(parsedData);
			}
		}
		
		for(let i = 0; i < dropTables.length; i++) {
			if(Object.keys(dropTables[i]).length === 0) {
				dropTables.splice(i, 1);
			}
		}
		
		//console.log(dropTables);
		currentDropTables = dropTables;
		callback();
	};
	
	xhr.onerror = () => {
		console.log("onerror");
		console.log(xhr.response);
	};
	
	xhr.open("GET", url, true);
	xhr.send();
}

function parseDropData(line) {
	let splitData = line.replaceAll("{{","").replaceAll("}}","").split("|");
	let itemData = {};
	console.log(splitData);
	
	for(let i = 0; i < splitData.length; i++) {
		if(splitData[0] == "DropsLineClue" && splitData[i].indexOf("type=") == 0) {
			let type = splitData[i].split("=")[1];
			itemData.name = `Clue scroll (${type})`;
		}
		
		if(splitData[i].indexOf("name=") == 0) {
			if(itemData.name) continue;	//prevent override from nested template such as NamedRef
			itemData.name = splitData[i].split("=")[1];
		}
		
		//reference: https://oldschool.runescape.wiki/w/Template:DropsLine
		if(splitData[i].indexOf("rarity=") == 0) {
			let rarity = splitData[i].split("=")[1];
			
			if(rarity.indexOf("/") >= 0) {
				let nums = rarity.split("/");
				itemData.numerator = Number(nums[0]);
				itemData.denominator = Number(nums[1]);
				itemData.rarity = itemData.numerator/itemData.denominator;
				
			} else if(rarity == "Always") {
				itemData.numerator = 1;
				itemData.denominator = 1;
				itemData.rarity = 1;
				
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