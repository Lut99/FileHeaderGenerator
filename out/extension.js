"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
class CommentSet {
    constructor(start, middle, end) {
        this.start = start;
        this.middle = middle;
        this.end = end;
    }
}
class Header {
}
function get_header_title(doc) {
    let path_raw = doc.uri.path;
    let slash_pos = path_raw.lastIndexOf("/");
    let name;
    if (slash_pos < 0) {
        // Everything is filename
        name = path_raw;
    }
    else {
        name = path_raw.substr(slash_pos + 1);
    }
    // Change the file name (excl. extension) to capital letters. However, if the name has camelcase letters, split the name by space. Replaces '_' or '-' also with a space.
    let extension_pos = name.lastIndexOf(".");
    if (extension_pos < 0) {
        // No extension
        extension_pos = name.length;
    }
    let last_type = undefined;
    let result = "";
    for (var i = 0; i < extension_pos; i++) {
        let c = name.charAt(i);
        let type = "lower";
        if (!isNaN(Number(c))) {
            type = "num";
        }
        else if (c === c.toUpperCase()) {
            type = "upper";
        }
        if (c === "_" || c === "-" || c === " ") {
            result += " ";
            c = "";
            type = "space";
        }
        else if (last_type !== undefined && ((type === "num" && last_type !== "num" && last_type !== "space") || (type === "upper" && last_type === "lower"))) {
            // First number, add a space
            result += " ";
        }
        result += c.toUpperCase();
        // Update last_c and type
        last_type = type;
    }
    // Add the extension as-is
    if (extension_pos !== name.length) {
        result += name.substr(extension_pos);
    }
    return result;
}
function get_comment_set(doc) {
    let id = doc.languageId;
    // Use that for the comment character
    if (id === "c" || id === "cpp" || id === "csharp" || id === "java") {
        return new CommentSet("/* ", " * ", "**/");
    }
    else if (id === "python") {
        return new CommentSet("# ", "# ", "# ");
    }
    else if (id === "lua") {
        return new CommentSet("--[[ ", "     ", "--]]");
    }
    else {
        return new CommentSet("", "", "");
    }
}
function get_now() {
    let now = new Date(Date.now());
    return now.toLocaleString();
}
function generate_header() {
    var _a;
    // Fetch the currently opened document
    let doc = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
    if (doc === undefined) {
        vscode.window.showErrorMessage("No file opened");
        return;
    }
    // Determine the path of the currently opened document
    let path = doc.uri;
    // Fetch the correct comment characters
    let set = get_comment_set(doc);
    // Fetch the filename (with extension)
    let title = get_header_title(doc);
    // Create the full comment text
    let text = set.start + title + "\n";
    text += set.middle + "  by Lut99\n";
    text += set.middle + "\n";
    text += set.middle + "Created:\n";
    text += set.middle + "  " + get_now() + "\n";
    text += set.middle + "Last edited:\n";
    text += set.middle + "  " + get_now() + "\n";
    text += set.middle + "Auto updated?\n";
    text += set.middle + "  Yes\n";
    text += set.middle + "\n";
    text += set.middle + "Test description\n";
    text += set.end + "\n\n";
    // Create an edit
    let edit = new vscode.WorkspaceEdit();
    edit.insert(path, new vscode.Position(0, 0), text);
    vscode.workspace.applyEdit(edit);
}
function perform_update() {
}
/* Returns an header object */
function get_header() {
    return new Header();
}
/* Event listener for when a user saves a file, i.e. the header should be updated. */
function update_header() {
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.generateHeader', generate_header);
    let another_disposable = vscode.workspace.onDidSaveTextDocument(update_header);
    context.subscriptions.push(disposable, another_disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map