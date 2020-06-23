const rowState = {
    insert: 'Insert',
    edit: 'Edit',
    "delete": 'Delete',
    normal: 'Normal',
    empty: 'Empty'
};

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

class TableCommand {
    constructor(commandText, toState, callback, cssClass) {
        this.commandText = commandText;        
        this.toState = toState;
        this.callback = callback;
        this.data = null;
        this.cssClass = cssClass;
        this.uuid = uuidv4();
        if (this.toState === undefined || this.toState === null) {
            this.toState = rowState.normal;
        }        
    }
}

class CSSRule {
    constructor(rowIndex, jsonKey, cssClass) {
        this.rowIndex = rowIndex;
        this.jsonKey = jsonKey;
        this.cssClass = cssClass;
    }
}

class DataCleanUpRule {
    constructor(dataValue, dataReturnText) {
        this.dataValue = dataValue;
        this.dataReturnText = dataReturnText;
    }
}

class TableRow {
    constructor(data, variables, jsonKeys, commands, state) {
        this.data = data;
        this.variables = variables;
        this.commands = commands;
        this.jsonKeys = jsonKeys;
        this.state = state;
        this.uuid = uuidv4();
        this.tableUUID = "";
        if (this.state === undefined || this.state === null) {
            this.state = rowState.normal;
        }
    }

    addCommand(command) {
        return "<input type='button' data-uuid='" + command.uuid + "' data-rowuuid='" + this.uuid + "' data-tableuuid='" + this.tableUUID + "' value='" + command.commandText + "' data-tostate='" + command.toState + "' class='command-link" + (command.cssClass !== undefined ? (" " + command.cssClass) : "") + "'/>";
    }
}

class TableSchema {

    constructor(element, headers, jsonData, jsonKeys, commands, UIForState, editCallback, deleteCallback, cssRules, tableLoadedCallback) {
        this.element = element;
        if (this.element !== undefined && this.element !== null && $(this.element).length > 0) {
            if ($(this.element).is("table")) {
                this.headers = headers;
                this.jsonData = jsonData;
                this.jsonKeys = jsonKeys;
                this.commands = commands;
                this.cssRules = cssRules;
                this.html = "";
                this.rows = [];
                this.UIForState = UIForState;
                this.uuid = uuidv4();
                this.editCallback = editCallback;
                this.deleteCallback = deleteCallback;
                this.interactiveRow = null;
                this.tableLoadedCallback = tableLoadedCallback;
                $(this.element).data("uuid", this.uuid);

                if (this.jsonKeys !== undefined && this.jsonKeys !== null) {
                    this.generate();
                }
            }
            else {
                alert("specified id is not a table");
            }
            
        }
        else {
            alert("no id found");
        }
        
    }

    generate() {
        this.generateTableRows();
        this.setupCommands();
        this.generateHTML();
        
    }

    generateTableRows() {
        var rows = this.rows;
        var commands = this.commands;
        var jsonData = this.jsonData;
        var jsonKeys = this.jsonKeys;

        $.each(jsonData, function (index, data) {
            var rowValues = Array();
            var nullRowValues = 0;
            $.each(jsonKeys, function (indx, key) {
                if (data[key] === null) {
                    nullRowValues++;
                    rowValues.push("null");
                }
                else {
                    rowValues.push(data[key]);
                }
            });
            if (rowValues.length > nullRowValues) {
                rows.push(new TableRow(data, rowValues, jsonKeys, commands));
            }
        });
    }

    setupCommands() {
        var commands = this.commands;
        var rows = this.rows;
        var generateHTML = this.generateHTML;
        var headers = this.headers;
        var cssRules = this.cssRules;
        var UIForState = this.UIForState;
        var table = this;
        var editCallback = this.editCallback;
        var deleteCallback = this.deleteCallback;
        var interactiveRow = this.interactiveRow;

        $(document).on("click", "table .command-link", function () {
            var tableid = $(this).closest("table").attr("id");
            var tableUUID = $(this).closest("table").data("uuid");
            if (tableUUID === table.uuid) {
                var commandUUID = $(this).data("uuid");
                if (commandUUID !== undefined) {
                    var commandArray = commands.filter(function (cm) {
                        return cm.uuid === commandUUID;
                    });
                    if (commandArray.length > 0) {
                        var command = commandArray[0];
                        var rowUUID = $(this).data("rowuuid");
                        var rowArray = rows.filter(function (rw) {
                            return rw.uuid === rowUUID;
                        });
                        if (rowArray.length > 0) {
                            var row = rowArray[0];

                            $.each(rows, function (index, rw) {
                                if (rw.uuid !== row.uuid) {
                                    rw.state = rowState.normal;
                                }
                            });

                            if (command.callback !== undefined && command.callback !== null) {
                                command.callback(row, tableid);
                            }
                            row.state = command.toState;
                            if (row.state === rowState.edit) {
                                interactiveRow = row;
                            }
                            else if (row.state === rowState.delete) {
                                interactiveRow = row;
                            }
                            table.generateHTML();
                        }
                    }
                }
                else {
                    var linkAction = $(this).data("action");
                    var toState = $(this).data("tostate");
                    if (linkAction !== undefined && linkAction !== null) {
                        if (linkAction.toLowerCase() === "edit") {
                            if (interactiveRow !== null) {
                                editCallback(interactiveRow);
                            }
                        }
                        if (linkAction.toLowerCase() === "delete") {
                            if (interactiveRow !== null) {
                                deleteCallback(interactiveRow);
                            }
                        }
                    }
                    if (toState !== undefined && toState !== null) {
                        if (interactiveRow !== null) {
                            interactiveRow.state = toState;
                        }
                        table.generateHTML();
                    }
                }
            }            
        });
    }

    reload() {
        var rows = this.rows;
        var table = this;
        $.each(rows, function (index, row) {
            row.state = rowState.normal;
        });
        table.generateHTML();
    }

    generateHTML() {

        var headers = this.headers;
        var rows = this.rows;
        var cssRules = this.cssRules;
        var UIForState = this.UIForState;
        var uuid = this.uuid;
        var element = this.element;

        var headerHTML = "<thead><tr class='table-header'>";
        $.each(headers, function (index, value) {
            headerHTML += "<th class='" + spearCase(value) + "'>" + value + "</th>";
        });
        headerHTML += "</tr></thead>";

        var rowHTML = "<tbody>";
        var undefinedVariableCount = 0;
        if (rows.length === 0) {
            //empty
            var tr = new TableRow(null, null, null, null, rowState.empty);
            rows.push(tr);
            if (UIForState !== undefined && UIForState !== null) {
                var overrideHTML = UIForState(tr);
                rowHTML += overrideHTML;
            }
            else {
                rowHTML+= "<tr><td></td></tr>";
            }
        }
        else {
            $.each(rows, function (index, tableRow) {
                tableRow.tableUUID = uuid;
                var overrideHTML = "";
                if (UIForState !== undefined && UIForState !== null) {
                    overrideHTML = UIForState(tableRow);
                }
                if (overrideHTML !== undefined && overrideHTML !== null && overrideHTML !== "") {
                    rowHTML += overrideHTML;
                }
                else {
                    rowHTML += "<tr data-state='" + tableRow.state + "'>";
                    $.each(tableRow.variables, function (ind, variable) {
                        if (variable !== undefined && variable !== null) {
                            var cssRule = [];
                            var jsonKey = tableRow.jsonKeys[ind];

                            if (cssRules !== undefined && cssRules !== null) {
                                //console.log("jsonKey", jsonKey);
                                //console.log("index", index);
                                cssRule = cssRules.filter(rule => rule.rowIndex === index && rule.jsonKey.toString() === jsonKey.toString());
                                //console.log("rule count", cssRule.length);
                            }


                            if (variable.toString().indexOf(".png") !== -1 || variable.toString().indexOf(".jpg") !== -1 || variable.toString().indexOf(".jpeg") !== -1 || variable.toString().indexOf(".svg") !== -1) {
                                //it's an image
                                if (cssRule.length > 0) {
                                    rowHTML += "<td class='" + jsonKey + " ";

                                    var imgRuleHTML = "";
                                    $.each(cssRule, function (ruleIndex, rule) {
                                        if (imgRuleHTML === "") {
                                            imgRuleHTML = rule.cssClass;
                                        }
                                        else {
                                            imgRuleHTML = " " + rule.cssClass;
                                        }
                                    });

                                    rowHTML += imgRuleHTML;
                                    rowHTML += "'> <img src='" + variable.toString() + "' alt='" + jsonKey + "' /></td > ";
                                }
                                else {
                                    rowHTML += "<td class='" + jsonKey + "'> <img src='" + variable.toString() + "' alt='" + jsonKey + "' /></td > ";
                                }
                            }
                            else {
                                if (cssRule.length > 0) {
                                    rowHTML += "<td class='" + jsonKey + " ";

                                    var ruleHTML = "";
                                    $.each(cssRule, function (ruleIndex, rule) {
                                        if (ruleHTML === "") {
                                            ruleHTML = rule.cssClass;
                                        }
                                        else {
                                            ruleHTML = " " + rule.cssClass;
                                        }
                                    });

                                    rowHTML += ruleHTML;
                                    rowHTML += "'> ";
                                    if (variable === undefined || variable === null || variable === "undefined" || variable === "null") {
                                        rowHTML += "";
                                    }
                                    else {
                                        rowHTML += variable.toString();
                                    }
                                    rowHTML += "</td > ";
                                }
                                else {
                                    rowHTML += "<td class='" + jsonKey + "'> ";
                                    if (variable === undefined || variable === null || variable === "undefined" || variable === "null") {
                                        rowHTML += "";
                                    }
                                    else {
                                        rowHTML += variable.toString();
                                    }
                                    rowHTML += "</td > ";
                                }
                            }
                        }
                        else {
                            undefinedVariableCount++;
                        }
                    });
                    if (tableRow.commands !== undefined && tableRow.commands !== null && tableRow.commands.length > 0) {
                        rowHTML += "<td class='commands'>";
                        $.each(tableRow.commands, function (ind, command) {
                            //rowHTML += generateCommandHtml(tableRow, command);
                            rowHTML += "<input type='button' data-uuid='" + command.uuid + "' data-rowuuid='" + tableRow.uuid + "' data-tableuuid='" + uuid + "' value='" + command.commandText + "' data-tostate='" + command.toState + "' class='command-link" + (command.cssClass !== undefined ? (" " + command.cssClass) : "") + "'/>";
                        });
                        rowHTML += "</td>";
                    }
                    rowHTML += "</tr>";
                }

            });
        }

        rowHTML += "</tbody>";

        $(element).html(headerHTML + rowHTML);
        if (this.tableLoadedCallback !== undefined && this.tableLoadedCallback !== null) {
            this.tableLoadedCallback();
        }
        if (undefinedVariableCount !== 0) {
            alert("Please check your variable names. One is undefined.");
        }
    }
}

function spearCase(text) {
    return replaceAll(text.toLowerCase(), " ", "-");
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
