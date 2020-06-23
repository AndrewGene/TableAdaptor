# Table Adaptor
Easily create html tables from a JSON object.

## Requirements

jQuery

## Overview

The TableAdaptor is data-driven approach to building html tables using jQuery.  It gives you the ability to map data to your columns, easy callbacks for row commands, CSS classes get added automatically, and this plugin creates tables that are prepped to be used with the popular TableSorter plugin.

## Example JSON Object
```
 requests = [{requestId:12, name:'Andrew', serviceStreetAddress:'2005 Main St', submitted:'6/23/2020', lastUpdated: '6/24/2020', 'editor':'Brandon Allgood'},...]
```

## First, create your table headers and map them to your JSON keys (order is important)
Notice: The extra 'Commands' header is there because the following commands will both go in that column.  The TableCommand objects below are rendered only during the .Normal state.

```js
let tableHeaders = ["RequestID", "Name", "Address", "Created", "Updated", "Editor", "Commands"];
let jsonKeys = ["requestId", "name", "serviceStreetAddress", "submitted", "lastUpdated", "editor"];

let viewCommand = new TableCommand();
viewCommand.commandText = "View";
viewCommand.callback = function (tablerow) {
   var webRequestId = tablerow.data.requestId;
   var link = "RequestDetails?WebRequestId=";
   window.location = link + webRequestId.toString();
};

let claimCommand = new TableCommand();
claimCommand.commandText = "Claim";
claimCommand.callback = function (tablerow) {   
   //AJAX call to 'claim' this request
};

var commands = [viewCommand, claimCommand];
```
     
## Formatting
You can choose the format of each row / state of your table in this callback

# Important
### all events related to changing state or causing action (edit/delete) will need the 'command-link' class if you are writing them by hand like below

data-action will either equal 'edit' or 'delete' and will fire the function passed into 'editing'/'deleting' below respectively.

data-toState will either be 'Insert'/'Edit'/Delete/'Normal'/'Empty' and will change the state of the row after it is clicked.  This will immediately reload the table and this format function will run to reflect the new state.

```js
let format = function (tableRow) {
   if (tableRow.state === rowState.edit) {                    
       return "<tr class='edit-mode'><td colspan='3'>Edit Row Showing</td><td><input id='btnCancel' type='button' value='Done' data-action='edit' class='command-link'/><input id='btnDelete' type='button' value='Delete' data-tostate='Delete' class='command-link' /><input id='btnCancel' type='button' value='Cancel' data-toState='Normal' class='command-link'/></td></tr>";
   }
   if (tableRow.state === rowState.delete) {
       return "<tr class='delete-mode'><td colspan='3'>Are you sure you want to delete " + tableRow.data.serviceStreetAddress + "?</td > <td><input id='btnDelete' type='button' value='YES' data-action='delete' class='command-link' /><input id='btnCancel' type='button' value='NO' data-toState='Edit' class='command-link'/></td></tr > ";
   }
   if (tableRow.state === rowState.empty) {
       return "<tr class='empty-state'><td colspan='7'>No requests are waiting.</td></tr>";
   }
};
```

## Table Loaded
This callback will fire any time the table is (re)loaded

```js
let loaded = function () { 
 alert("Table loading complete!");
};
```

## Adding Values
Because javascript is loosely typed you can dynamically add values to your data like we do here by looking at a 'customerCount' variable that could be in our JSON object and adding an 'impact' property to the data which shows an image (green/red/yellow)

```js
 $.each(requests, function (ind, value) {
     if (value.customerCount > 20000) {
         value.impact = "images/HighImpact.png";
     }
     else if (value.customerCount > 500) {
         value.impact = "images/MediumImpact.png";
     }
     else {
         value.impact = "images/LowImpact.png"
     }
 });
```
## Editing / Deleting
Unlike the commands above, these are special functions which you might want to perform on the data in your table.  These are passed in as parameters below.

```js
var editing = function (tableRow) {
    console.log(tableRow.data);
    tableRow.state = rowState.normal;
    tableSchema.reload();
}

var deleting = function (tableRow) {
    console.log(tableRow.data);
    tableRow.state = rowState.normal;
    tableSchema.reload();
}
```

## CSS Rules
This is used during the .Normal state to apply special formatting to individual pieces of data in your table (often a particular td).  The following rule will look at the data and if the value of "lastUpdated" is different from "submitted" then for the td where the "lastUpdated" key is show we will add the class "recently-updated".  The "recently-updated" class might change the text color of the "lastUpdated" field to green so it stands out from those that have not been recently updated.

```js
var cssRules = [];

 $.each(requests, function (index, value) {
     if (value.lastUpdated !== value.submitted) {
         cssRules.push(new CSSRule(index, "lastUpdated", "recently-updated"));
     }     
 });
```
 
 ## Create the schema
 Pass in all of the parameters to the TableSchema constructor to generate your table
 
 ```js
 var tableSchema = new TableSchema("#table-to-adapt", tableHeaders, requests, jsonKeys, commands, format, editing, deleting, cssRules, loaded);
 ```

