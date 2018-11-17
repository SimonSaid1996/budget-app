var timeoutID;
var timeout = 20000;

var catList = [];
var budgetList = new Map();
var budgetListKeys = [];
var uncatList = [];
var uncategoried = 0;
var hasPurchase = false;
var hasCat = false;
var hasReloaded = false;

function setup() {
	document.getElementById("theButton").addEventListener("click", sendCat, true);
	document.getElementById("theButton1").addEventListener("click", sendPur, true);
	poller();
	pollerP();
}


function makeRec(method, target, retCode, handlerAction, data) {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Giving up :( Cannot create an XMLHTTP instance');
		return false;
	}

	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, handlerAction);
	httpRequest.open(method, target);
	
	if (data) {
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		httpRequest.send(data);
	}
	else {
		httpRequest.send();			//an error here
	}	
}


function makeHandler(httpRequest, retCode, action) {
	console.log("making handler!");
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				console.log("recieved response text:  " + httpRequest.responseText);
				action(httpRequest.responseText);
			} else {
				alert("There was a problem with the request.  you'll need to refresh the page!");
			}
		}
	}
	return handler;
}


function poller() {						//need to combine the get repopulate with the repopulatePur, need to use a global list to store the list in the repolulate and then compare with the purchase list 
	makeRec("GET", "/cats", 200, repopulate);
}

function pollerP(){			//poller for purchases
	makeRec("GET", "/purchases", 200, repopulatePur);
}

function sendCat() {	//need to think about the user input here, what are their input? the catagory should have 2 input, one is for the name and one is for the price, can't u do something like appending the name and price together?
	window.clearTimeout(timeoutID);
	var newCat = document.getElementById("newCat").value;
	var newPrice = document.getElementById("newPrice").value;
	var date = new Date();				//in theory this will get u the current time, u just need to get the current month to compare with the month of the items in the list
	
	var data;
	if( newCat !== "" && newPrice !== "" ){			//prevent invalid inputs 
		data = "task=" + newCat+":"+newPrice+ ":"+ ( parseInt(date.getMonth())+1 ) ;
		var duplicateCat = false;
		for (i in catList){
			var catName = catList[i].split(":");
			if( catName[0] === newCat){
				duplicateCat = true;
			}
		}
		hasCat = true;
		if(!duplicateCat){
			console.log("posting data ",data);
			makeRec("POST", "/cats", 201, poller, data);
		}
	
		else
			alert("can't add a duplicate category in the same month, try adding a different category name ");
		
	}
	else
		alert("one of the inputs is invalid, fix your imput and add again");
	
}

function sendPur(){
	
	window.clearTimeout(timeoutID);
	var newC = document.getElementById("newC").value;
	var newPrice1 = document.getElementById("newPrice1").value;
	var newPN = document.getElementById("newP").value;				//to get the name of the purchase 
	
	var newMonth = parseInt ( document.getElementById("event_month").value );
	var newYear = parseInt ( document.getElementById("event_year").value ) ;
	var newDate = parseInt ( document.getElementById("event_date").value ) ;
	var newTime = new Date ( newYear, newMonth, newDate );				//might not work, if it works, then we add get month, if not, just work on it
	
	
	var data;


	if(newC !== "" &&  newPrice1!== "" && newPN!== ""){
		data = "task=" + newC+":"+newPrice1 +":"+newPN+":"+newTime.getMonth();				//the PN part doesn't really matter since it is just the name 
		hasPurchase = true;	
		console.log("posting data ",data);
		makeRec("POST", "/purchases", 201, pollerP, data);			//maybe i can combine those two method?
	
	}
	else
		alert("one of your input is invalid, check your input again ");
}

function deleteCat(taskID) {
	window.clearTimeout(timeoutID);
	makeRec("DELETE", "/cats/" + taskID, 204, poller);
}

// helper function for repop:
function addCell(row, text) {
	var newCell = row.insertCell();
	var newText = document.createTextNode(text);
	newCell.appendChild(newText);
}

function repopulatePur(responseText) {		//need to delete the purchase table here, don't need to append on it 	
	console.log("repopulatingpur!");
	var purs = JSON.parse(responseText);
	var newRow, newCell, t, task, newButton, newDelF;

	uncategoried = 0;				//need to reset the value and add each times
	console.log("get purchases data ", purs);
	budgetList = new Map();//again, need to update the budgetlist
	budgetListKeys =[];
	for (t in purs) {
		hasPurchase = true; 			//realoading data, if having purcahse in the database, then the hasPurchase should be true
		for (task in purs[t]) {
			
			var curPur = purs[t][task].split(":");
			var categorized = false;
			
			for (i = 0; i<catList.length; i++) {		//need to check if purlist has a match with the catlist
				var curCat = catList[i].split(":");
				
				if( curCat[0] === curPur[0] && parseInt( curCat[ 2 ] ) === parseInt( curPur[ 3 ] ) ){			//need to check two things, the budgetlist if they have the curcat already and try to append the item in the budget list as a dictionary
					categorized = true;
					if( budgetList.get( curCat[0] ) === undefined ){
						budgetListKeys.push( curCat[0] );
						budgetList.set(curCat[0], curPur[1]);         			
					}				 
					else					//add new to the original price
						budgetList.set(curCat[0], parseInt( budgetList.get( curCat[0] ) )  + parseInt( curPur[1] ) );   //update the original price
				}
				
			}
			if( !categorized ){				//need to think about the reload situation, shouldn't have the deletePur when reloading
				uncategoried = parseInt(uncategoried) + parseInt(curPur[1]); 	
				console.log("curPur[0] is ",curPur[0]);
				uncatList.push( curPur[0] );
			}	
			
		}	
	}
	
	if( hasPurchase ){
		var totalbudget= "total budget is </br>";
		var catNoPur = [];
		
		for(j=0; j<catList.length; j++){					//think about the delete cat question now, what to do with the purchase when dat happend
			var curCat = catList[j].split(":");
			var noPur = true;
			
			for(i = 0; i<budgetListKeys.length; i++){
				if(budgetListKeys[i].toString() === curCat[0] ){
					if( parseInt( curCat[1] ) < parseInt( budgetList.get ( budgetListKeys[i] ) ) )
						totalbudget = " "+totalbudget + ( parseInt( budgetList.get ( budgetListKeys[i] )  ) - parseInt( curCat[1] ) ) +" over the budget of  "+curCat[0]+" "+curCat[1]+"; </br>";
					else
						totalbudget = " "+totalbudget + budgetListKeys[i].toString()+"  " + ( parseInt( curCat[1] ) - parseInt( budgetList.get ( budgetListKeys[i] ) ) ) +" / "+ curCat[1] +" left for the budget;  </br>";
					noPur = false;
				}
			}
			if( noPur ){
				totalbudget = " "+totalbudget+ curCat[0]+" "+curCat[1]+"/"+curCat[1]+" left for the budget  </br>";
			}	
			
		}
			
		totalbudget = totalbudget + " " + " the uncategoried money "+uncategoried;
		document.getElementById('summary').innerHTML = totalbudget;	
	}
	else if( !hasPurchase && !hasCat )
		document.getElementById('summary').innerHTML = "the total budget is None, and the uncategoried money is 0";	
	else{	//else can only be no purcahse, but have cat 
		for(j=0; j<catList.length; j++){					//think about the delete cat question now, what to do with the purchase when dat happend
			var curCat = catList[j].split(":");
			totalbudget = " "+totalbudget+ curCat[0]+" "+curCat[1]+"/"+curCat[1]+" left for the budget  ";
		}	
		document.getElementById('summary').innerHTML = totalbudget;	
	}
	
	timeoutID = window.setTimeout(pollerP, timeout);
}


function repopulate(responseText) {			//need to think about the repopulate, this function is mean to be implemented for the cats, not really for the purchases
	console.log("repopulating!");
	var cats = JSON.parse(responseText);
	var tab = document.getElementById("theTable");
	var newRow, newCell, t, task, newButton, newDelF;				//right here, try to compare the two tables and split all the data

	while (tab.rows.length > 0) {
		tab.deleteRow(0);
	}
	catList = [];	// need to think about the situation when duplicate cat, they can't exist so must warn ppl it is not valid
	console.log("get cats data ", cats);
	for (t in cats) {
		newRow = tab.insertRow();
		addCell(newRow, t);
		for (task in cats[t]) {
			addCell(newRow, task);
			addCell(newRow, cats[t][task]);
			catList.push(cats[t][task]);
		}
		hasCat = true;				//if having old data, then the hasPurchase should be true
		newCell = newRow.insertCell();
		newButton = document.createElement("input");
		newButton.type = "button";
		newButton.value = "Delete " + t;
		(function(_t){ newButton.addEventListener("click", function() { deleteCat(_t); }); })(t);
		newCell.appendChild(newButton);
	}
	
	
	if( ! hasPurchase && !hasCat  )
		document.getElementById('summary').innerHTML = "the total budget is none, and the uncategoried money is 0";	
	else if(!hasPurchase && hasCat ){
		var totalbudget= "total budget is ";
		for(j=0; j<catList.length; j++){					//think about the delete cat question now, what to do with the purchase when dat happend
			var curCat = catList[j].split(":");
			totalbudget = " "+totalbudget+ curCat[0]+" "+curCat[1]+"/"+curCat[1]+" left for the budget;  </br>";
		}	
		document.getElementById('summary').innerHTML = totalbudget;	
	}			
		
	timeoutID = window.setTimeout(poller, timeout);
}


// setup load event
window.addEventListener("load", setup, true);
