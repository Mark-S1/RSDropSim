let currentDropTables = [];

function loadWikiDropData(pageName) {
	pageName.replaceAll(" ", "_");
	
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